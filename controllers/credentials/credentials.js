/*
 * Copyright 2017 Brigham Young University
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

const Enforcer = require('swagger-enforcer');
const utils = require('../utils');
const db = require('../db');
const sql = require('./sql');
const auth = require('../auth');
const event = require('../event');
const moment = require('moment-timezone');

/**
 * A helper function that takes the swagger definition sql results and
 * returns a JSON object based on a map
 * @param definitions - Swagger
 * @param row - SQL Results
 * @param api_type - Whether the field is modifiable or read-only
 * @returns {*}
 */
function mapDBResultsToDefinition(definitions, row, api_type) {
  return Enforcer.applyTemplate(definitions.credential, null,
    {
      cache_date_time: new Date().toISOString(),
      byu_id: row.byu_id,
      name: row.name || undefined,
      credential_type: row.credential_type,
      credential_id: row.credential_id,
      api_type: api_type,
      date_time_updated: row.date_time_updated || undefined,
      updated_by_id: row.updated_by_id,
      updated_by_name: row.updated_by_name || undefined,
      date_time_created: row.date_time_created || undefined,
      created_by_id: row.created_by_id,
      created_by_name: row.created_by_name || undefined,
      user_name: row.user_name || ' ',
      lost_or_stolen: row.lost_or_stolen || false,
      status: row.status || ' ',
      expiration_date: row.expiration_date || undefined,
      issuing_location: row.issuing_location || ' ',
      physical_form: row.physical_form || ' ',
      associated_device: row.associated_device || ' ',
    }
  );
}

function modifiableOrReadOnly(credential_type, permissions) {
  switch (credential_type) {
    case "GOOGLE_ID":
    case "FACEBOOK_ID":
    case "BYU_IDAHO_ID":
    case "BYU_HAWAII_ID":
    case "LDS_ACCOUNT_ID":
    case "LDS_CMIS_ID":
      if (auth.canUpdateCasCredential(permissions)) {
        return 'modifiable';
      }
      break;
    case "SEMINARY_STUDENT_ID":
      if (auth.canUpdateCasCredential(permissions) || auth.canIsLdsSync(permissions)) {
        return 'modifiable';
      }
      break;
    case "PROX_CARD":
    case "ID_CARD":
      if (auth.canUpdateIdCard(permissions)) {
        return 'modifiable';
      }
      break;
    case "WSO2_CLIENT_ID":
      if (auth.canUpdateWso2ClientId(permissions)) {
        return 'modifiable';
      }
      break;
    case "NET_ID":
      if (auth.canChangeNetId(permissions)) {
        return 'modifiable';
      }
      break;
    default:
      return 'read-only';
  }
}

function validateCredentialId(credential_type, credential_id) {
  switch (credential_type) {
    case "NET_ID":
      if (!/^[a-z][a-z0-9]{0,8}$/g.test(credential_id)) {
        throw utils.Error(409, `Invalid URL: Please Fix and Resubmit
          \nNET_ID 1 to 9 lowercase alpha numeric characters`)
      }
      break;
    case "PROX_CARD":
      if (!/^[0-9]{3,7}$/g.test(credential_id)) {
        throw utils.Error(409, `Invalid URL: Please Fix and Resubmit
          \nPROX_CARD 3 to 7 digit numeric`)
      }
      break;
    case "WSO2_CLIENT_ID":
      if (!/^[a-zA-Z0-9_]{28}$/g.test(credential_id)) {
        throw utils.Error(409, `Invalid URL: Please Fix and Resubmit
          \nWSO2_CLIENT_ID 28 printable characters`)
      }
      break;
    case "ID_CARD":
      if (!/^[0-9]{11}$/g.test(credential_id)) {
        throw utils.Error(409, `Invalid URL: Please Fix and Resubmit
          \nID_CARD is an 11 digit number 9 digit BYU_ID + 2 digit issue number Example 12345678901`)
      }
      break;
    default:
  }
}

exports.getCredential = async function getCredential(definitions, byu_id, credential_type, credential_id, permissions) {
  validateCredentialId(credential_type, credential_id);
  const params = [credential_type, credential_id, byu_id];
  const sql_query = sql.sql.getCredential;
  const results = await db.execute(sql_query, params);

  console.log(results);
  console.log(!results.rows[0].credential_type);
  // If no results are returned or the record is restricted
  // and the entity retrieving the record does not belong
  // to the GRO.PERSON_GROUP.GROUP_ID.RESTRICTED then
  // return 404 person not found
  if (!results.rows.length ||
    (/^Y$/g.test(results.rows[0].restricted) &&
      !auth.hasRestrictedRights(permissions))) {
    throw utils.Error(404, 'BYU_ID Not Found In Person Table');
  }

  // If the person exists but the type of credential requested
  // does not exist then return 404 credential not found
  if (!results.rows[0].credential_type) {
    console.log("I should be a 404");
    throw utils.Error(404, `${credential_type},${credential_id} not associated with BYU_ID or not found`);
  }

  if (auth.canViewBasic(permissions) || /^NET_ID$/g.test(credential_type) ||
    (/^WSO2_CLIENT_ID$/g.test(credential_type) && auth.canUpdateWso2ClientId(permissions)) ||
    (/^(LDS_CMIS_ID|LDS_ACCOUNT_ID|SEMINARY_STUDENT_ID)$/g.test(credential_type) &&
      auth.canViewLdsCred(permissions))) {
    return mapDBResultsToDefinition(definitions, results.rows[0], modifiableOrReadOnly(credential_type, permissions));
  }

  throw utils.Error(403, 'Not Authorized To View Credential');
};

/**
 * Returns a person's credential collection
 * @param definitions - Swagger
 * @param byu_id - Nine digit number
 * @param permissions - Authorizations
 * @returns {Promise.<*>}
 */
exports.getCredentials = async function getCredentials(definitions, byu_id, permissions) {
  const params = [byu_id];
  const sql_query = sql.sql.getCredentials;
  const results = await db.execute(sql_query, params);
  const return_code = auth.canViewBasic(permissions) ? 200 : 203;
  const return_message = auth.canViewBasic(permissions) ? 'Success' : 'Authorized Info Only';
  const collection_size = (results.rows[0].credential_type) ? results.rows.length : 0;
  let values = [];

  console.log(results);
  // If no results are returned or the record is restricted
  // and the entity retrieving the record does not belong
  // to the GRO.PERSON_GROUP.GROUP_ID.RESTRICTED then
  // return 404 person not found
  if (!results.rows.length ||
    (/^Y$/g.test(results.rows[0].restricted) &&
      !auth.hasRestrictedRights(permissions))) {
    throw utils.Error(404, 'BYU_ID Not Found In Person Table')
  }

  if (results.rows[0].credential_type) {
    if (auth.canViewBasic(permissions)) {
      values = results.rows.map(row => mapDBResultsToDefinition(
        definitions, row, modifiableOrReadOnly(row.credential_type, permissions)
      ));

    } else {
      values = results.rows.filter(row => /^NET_ID/g.test(row.credential_type)).map(row => mapDBResultsToDefinition(
        definitions, row, modifiableOrReadOnly(row.credential_type, permissions)
      ));
      if (auth.canUpdateWso2ClientId(permissions)) {
        values.concat(results.rows.filter(row => /^WSO2_CLIENT_ID$/g.test(row.credential_type)).map(row => mapDBResultsToDefinition(
          definitions, row, modifiableOrReadOnly(row.credential_type, permissions)
        )))
      }
      if (auth.canViewLdsCred(permissions)) {
        values.concat(results.rows.filter(row => /^(LDS_ACCOUNT_ID|LDS_CMIS_ID|SEMINARY_STUDENT_ID)/g.test(row.credential_type)).map(row => mapDBResultsToDefinition(
          definitions, row, modifiableOrReadOnly(row.credential_type, permissions)
        )))
      }
    }
  }

  const credentials = Enforcer.applyTemplate(definitions.credentials, definitions,
    {
      byu_id: byu_id,
      cache_date_time: new Date().toISOString(),
      collection_size: collection_size,
      page_start: 0,
      page_end: collection_size,
      page_size: collection_size,
      default_page_size: 1,
      maximum_page_size: 100,
      validation_response_code: return_code,
      validation_response_message: return_message,
      credentials_values: values
    });
  credentials.values = values;
  return credentials;
};

function isValidIssuingLocation(issuing_location) {
  let issuing_locations = require("../../meta/id_centers/idCenters.json");

  for (let i = issuing_locations.items.length; i--;) {
    if (issuing_location === issuing_locations.items[i].domain_value) {
      return true;
    }
  }
  return false;
}

function processBody(authorized_byu_id, body, credential_type) {
  let current_date_time = moment();
  current_date_time = current_date_time.clone().tz('America/Denver');
  let new_body = {};
  new_body.user_name = body.user_name || ' ';
  new_body.lost_or_stolen = (body.lost_or_stolen) ? 'Y' : 'N';
  new_body.status = body.status || 'ACTIVE';
  new_body.expiration_date = body.expiration_date || '';
  if (/^LDS_ACCOUNT_ID$/g.test(credential_type)) {
    new_body.expiration_date = current_date_time.add(1, "years").format("YYYY-MM-DD");
  }
  new_body.issuing_location = body.issuing_location || ' ';
  new_body.physical_form = body.physical_form || ' ';
  new_body.associated_device = body.associated_device || ' ';
  new_body.scoped_affiliation = body.scoped_affiliation || ' ';
  new_body.updated_by_id = (!body.updated_by_id || !body.updated_by_id.trim()) ? authorized_byu_id : body.updated_by_id;
  if (!body.date_time_updated || !body.date_time_updated.trim()) {
    new_body.date_time_updated = current_date_time.format('YYYY-MM-DD HH:mm:ss.SSS');
  } else {
    new_body.date_time_updated = moment.tz(body.date_time_updated, 'America/Danmarkshavn');
    new_body.date_time_updated = new_body.date_time_updated.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
  }
  new_body.created_by_id = (!body.created_by_id || !body.created_by_id.trim()) ? authorized_byu_id : body.created_by_id;
  if (!body.date_time_created || !body.date_time_created.trim()) {
    new_body.date_time_created = current_date_time.format('YYYY-MM-DD HH:mm:ss.SSS');
  } else {
    new_body.date_time_created = moment.tz(body.date_time_created, 'America/Danmarkshavn');
    new_body.date_time_created = new_body.date_time_created.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
  }

  let error = false;
  let msg = `Incorrect BODY: Invalid field(s)\n`;

  if (!isValidIssuingLocation(new_body.issuing_location)) {
    msg += `\n\t${new_body.issuing_location} is an invalid issuing location`;
    error = true;
  }

  if (moment.tz(new_body.expiration_date, 'YYYY-MM-DD', 'America/Denver').startOf('day') < current_date_time.startOf('day')) {
    msg += `\n\texpiration_date cannot be before today`;
    error = true;
  }

  for (let prop in new_body) {
    if (new_body.hasOwnProperty(prop)) {
      if (!/(|[\x00-\x7F]+)/.test(new_body[prop])) {
        msg += `${prop} contains unsupported characters`;
        error = true;
      }
    }
  }

  if (error) {
    throw utils.Error(409, msg)
  }

  return new_body;
}

function processFromResults(from_results) {
  let process_results = {};
  process_results.person_id = from_results.person_id || ' ';
  process_results.net_id = from_results.net_id || ' ';
  process_results.employee_type = /[^-]/.test(from_results.employee_type) ? from_results.employee_type : 'Not An Employee';
  process_results.student_status = from_results.student_status;
  process_results.restricted = /^Y$/g.test(from_results.restricted);
  process_results.user_name = from_results.user_name || ' ';
  process_results.lost_or_stolen = from_results.lost_or_stolen || ' ';
  process_results.status = from_results.status || ' ';
  process_results.expiration_date = from_results.expiration_date || '';
  process_results.issuing_location = from_results.issuing_location || ' ';
  process_results.physical_form = from_results.physical_form || ' ';
  process_results.associated_device = from_results.associated_device || ' ';
  process_results.scoped_affiliation = from_results.scoped_affiliation || ' ';

  return process_results;
}

async function logChange(connection, change_type, authorized_byu_id, byu_id, credential_type, credential_id, processed_results, new_body) {
  const sql_query = sql.modifyCredential.logChange;

  let log_params = [];
  if (change_type === 'D') {
    let date_time_updated = moment();
    date_time_updated = date_time_updated.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
    log_params = [
      change_type,
      byu_id,
      credential_type,
      credential_id,
      date_time_updated,
      authorized_byu_id,
      processed_results.date_time_created,
      processed_results.created_by_id,
      processed_results.from_user_name,
      processed_results.from_lost_or_stolen,
      processed_results.from_status,
      processed_results.from_expiration_date,
      processed_results.from_issuing_location,
      processed_results.from_physical_form,
      processed_results.from_associated_device,
      processed_results.from_scoped_affiliation,
      processed_results.user_name,
      processed_results.lost_or_stolen,
      processed_results.status,
      processed_results.expiration_date,
      processed_results.issuing_location,
      processed_results.physical_form,
      processed_results.associated_device,
      processed_results.scoped_affiliation
    ];
  }
  else if (change_type === 'A' ||
    change_type === 'C') {
    log_params = [
      change_type,
      byu_id,
      credential_type,
      credential_id,
      new_body.date_time_updated,
      new_body.updated_by_id,
      new_body.date_time_created,
      new_body.created_by_id,
      processed_results.user_name,
      processed_results.lost_or_stolen,
      processed_results.status,
      processed_results.expiration_date,
      processed_results.issuing_location,
      processed_results.physical_form,
      processed_results.associated_device,
      processed_results.scoped_affiliation,
      new_body.user_name,
      new_body.lost_or_stolen,
      new_body.status,
      new_body.expiration_date,
      new_body.issuing_location,
      new_body.physical_form,
      new_body.associated_device,
      new_body.scoped_affiliation
    ];
  }
  console.log('LOG PARAMS', log_params);
  return connection.execute(sql_query, log_params, { autoCommit: true });
}

async function credentialEvents(connection, change_type, byu_id, credential_type, credential_id, body, processed_results) {
  try {
    const credential_url = `https://api.byu.edu/byuapi/persons/v1/${byu_id}/credentials/${credential_type},${credential_id}`;
    const source_dt = new Date().toISOString();
    const domain = 'edu.byu';
    const entity = 'BYU-IAM';
    const identity_type = 'Person';
    let event_type = (change_type === 'A') ? 'Credential Added' : 'Credential Changed';
    let event_type2 = (change_type === 'A') ? 'Credential Added v2' : 'Credential Changed v2';
    let secure_url = 'https://api.byu.edu/domains/legacy/identity/secureurl/v1/';
    let sql_query = '';
    let filters = [];
    let params = [];
    let eventness;
    let event_frame = {
      'events': {
        'event': []
      }
    };
    let header = [
      'domain',
      domain,
      'entity',
      entity,
      'event_type',
      event_type,
      'source_dt',
      source_dt,
      'event_dt',
      ' ',
      'event_id',
      ' '
    ];
    if (!processed_results.restricted) {
      let event_body = [
        'person_id',
        processed_results.person_id,
        'byu_id',
        byu_id,
        'net_id',
        processed_results.net_id,
        'credential_type',
        credential_type,
        'credential_id',
        credential_id,
        'user_name',
        body.user_name,
        'lost_or_stolen',
        body.lost_or_stolen,
        'status',
        body.status,
        'expiration_date',
        body.expiration_date,
        'associated_device',
        body.associated_device,
        'physical_form',
        body.physical_form,
        'updated_by_id',
        body.updated_by_id,
        'date_time_updated',
        body.date_time_updated,
        'created_by_id',
        body.created_by_id,
        'date_time_created',
        body.date_time_created,
        'callback_url',
        credential_url
      ];
      console.log("event body 1", event_body);
      eventness = event.Builder(header, event_body);
      event_frame.events.event.push(eventness);

      header[5] = event_type2;
      event_body.push('verified_flag');
      event_body.push(body.verified_flag);
      filters.push('identity_type');
      filters.push(identity_type);
      filters.push('employee_type');
      filters.push(processed_results.employee_type);
      filters.push('student_status');
      filters.push(processed_results.student_status);
      console.log("event body 2", event_body);
      eventness = event.Builder(header, event_body, filters);
      event_frame.events.event.push(eventness);
    }
    else {
      sql_query = db.intermediaryId.get;
      params = [credential_url];
      let results = await connection.execute(sql_query, params);
      if (!results.rows.length) {
        sql_query = db.intermediaryId.put;
        params = [
          credential_url,
          ' ',    // actor
          ' ',    // group_id
          body.created_by_id
        ];
        await connection.execute(sql_query, params);
        sql_query = db.intermediaryId.get;
        params = [credential_url];
        results = await connection.execute(sql_query, params);
      }

      secure_url += results.rows[0].intermediary_id;

      let restricted_body = [
        'person_id',
        ' ',
        'byu_id',
        ' ',
        'net_id',
        ' ',
        'credential_type',
        ' ',
        'credential_id',
        ' ',
        'user_name',
        ' ',
        'lost_or_stolen',
        ' ',
        'status',
        ' ',
        'expiration_date',
        ' ',
        'associated_device',
        ' ',
        'physical_form',
        ' ',
        'updated_by_id',
        ' ',
        'date_time_updated',
        ' ',
        'created_by_id',
        ' ',
        'date_time_created',
        ' ',
        'secure_url',
        secure_url
      ];
      console.log("restricted body 1", restricted_body);
      eventness = event.Builder(header, restricted_body);
      event_frame.events.event.push(eventness);

      header[5] = event_type2;
      restricted_body.push('verified_flag');
      restricted_body.push(' ');
      filters.push('restricted');
      filters.push(body.restricted);
      console.log("restricted body 2", restricted_body);
      eventness = event.Builder(header, restricted_body, filters);
      event_frame.events.event.push(eventness);
    }

    sql_query = db.raiseEvent;
    params = [JSON.stringify(event_frame)];
    await connection.execute(sql_query, params, { autoCommit: true });
    // connection.commit();
    sql_query = db.enqueue;
    await connection.execute(sql_query, params);
  } catch (error) {
    console.log('EVENT ENQUEUE ERROR');
    console.error(error.stack);
    throw utils.Error(207, 'Record was changed but event was not raised');
  }
}

exports.modifyCredential = async function (definitions, byu_id, credential_type, credential_id, body, authorized_byu_id, permissions) {
  validateCredentialId(credential_type, credential_id);
  const connection = await db.getConnection();
  const new_body = processBody(authorized_byu_id, body, credential_type);
  console.log('NEW BODY', new_body);

  if (modifiableOrReadOnly(credential_type, permissions) === 'read-only') {
    throw utils.Error(403, `User not authorized to create or update ${credential_type} credentials`);
  }

  let params = [
    credential_type,
    credential_id
  ];
  let sql_query = sql.sql.checkCredential;
  const check_results = await connection.execute(sql_query, params);
  if (check_results.rows[0] && (byu_id !== check_results.rows[0].byu_id)) {
    throw utils.Error(409, `${credential_type},${credential_id} belongs to another BYU_ID`);
  }
  sql_query = sql.sql.fromCredential;
  params.push(byu_id);
  const from_results = await connection.execute(sql_query, params);
  if (from_results.rows.length === 0 ||
    (from_results.rows[0].restricted === 'Y' &&
      !auth.hasRestrictedRights(permissions))) {
    throw utils.Error(404, 'Could not find BYU_ID in Person Table')
  }

  new_body.created_by_id = from_results.rows[0].created_by_id || new_body.created_by_id;
  if (from_results.rows[0].date_time_created) {
    new_body.date_time_created = moment.tz(from_results.rows[0].date_time_created, 'America/Danmarkshavn');
    new_body.date_time_created = new_body.date_time_created.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
  }

  const change_type = (!from_results.rows[0].credential_type) ? 'A' : 'C';
  const processed_results = processFromResults(from_results.rows[0]);
  console.log('PROCESS RESULTS', processed_results);

  const is_different = (
    new_body.user_name !== processed_results.user_name ||
    new_body.lost_or_stolen !== processed_results.lost_or_stolen ||
    new_body.status !== processed_results.status ||
    new_body.expiration_date !== processed_results.expiration_date ||
    new_body.issuing_location !== processed_results.issuing_location ||
    new_body.physical_form !== processed_results.physical_form ||
    new_body.associated_device !== processed_results.associated_device ||
    new_body.scoped_affiliation !== processed_results.scoped_affiliation);

  if (is_different) {
    if (!from_results.rows[0].credential_type) {
      if (/^NET_ID$/g.test(credential_type) && /^[a-z][a-z0-9]{4,7}$/g.test(credential_id)) {
        throw utils.Error(409, `Invalid URL:
        NET_ID must be lowercase, start with a letter, and be 5 to 8 characters long (letters and numbers only)`);
      }
      sql_query = sql.modifyCredential.create;
      params = [
        credential_id,
        credential_type,
        new_body.user_name,
        byu_id,
        new_body.date_time_updated,
        new_body.updated_by_id,
        new_body.date_time_created,
        new_body.created_by_id,
        new_body.lost_or_stolen,
        new_body.status,
        new_body.expiration_date,
        new_body.issuing_location,
        new_body.physical_form,
        new_body.associated_device,
        new_body.scoped_affiliation
      ];
    } else {
      sql_query = sql.modifyCredential.update;
      params = [
        new_body.date_time_updated,
        new_body.updated_by_id,
        new_body.user_name,
        new_body.lost_or_stolen,
        new_body.status,
        new_body.expiration_date,
        new_body.issuing_location,
        new_body.physical_form,
        new_body.associated_device,
        new_body.scoped_affiliation,
        byu_id,
        credential_type,
        credential_id
      ];
    }
    await connection.execute(sql_query, params);
    await logChange(connection, change_type, authorized_byu_id, byu_id, credential_type, credential_id, processed_results, new_body);
    await credentialEvents(connection, change_type, byu_id, credential_type,credential_id, new_body, processed_results);
  }

  params = [credential_type, credential_id, byu_id];
  sql_query = sql.sql.getCredential;
  const results = await connection.execute(sql_query, params);
  connection.close();
  return mapDBResultsToDefinition(definitions, results.rows[0], 'modifiable');
};

async function credentialDeletedEvents(connection, byu_id, credential_type, credential_id, processed_results) {
  try {
    const source_dt = new Date().toISOString();
    const event_type = 'Credential Deleted';
    const event_type2 = 'Credential Deleted v2';
    const domain = 'edu.byu';
    const entity = 'BYU-IAM';
    const identity_type = 'Person';
    const filters = [
      'identity_type',
      identity_type,
      'employee_type',
      processed_results.employee_type,
      'student_status',
      processed_results.student_status
    ];
    const credential_url = `https://api.byu.edu/byuapi/persons/v1/${byu_id}/credentials/${credential_type},${credential_id}`;
    let secure_url = 'https://api.byu.edu/domains/legacy/identity/secureurl/v1/';
    let event_frame = {
      'events': {
        'event': []
      }
    };
    let header = [
      'domain',
      domain,
      'entity',
      entity,
      'event_type',
      event_type,
      'source_dt',
      source_dt,
      'event_dt',
      ' ',
      'event_id',
      ' '
    ];

    if (!processed_results.restricted) {
      let event_body = [
        'person_id',
        processed_results.person_id,
        'byu_id',
        byu_id,
        'net_id',
        processed_results.net_id,
        'credential_type',
        credential_type,
        'credential_id',
        credential_id,
        'callback_url',
        credential_url
      ];
      let eventness = event.Builder(header, event_body);
      event_frame.events.event.push(eventness);

      header[5] = event_type2;
      eventness = event.Builder(header, event_body, filters);
      event_frame.events.event.push(eventness);
    }
    else {
      let sql_query = db.intermediaryId.get;
      let params = [credential_url];
      let results = await connection.execute(sql_query, params);
      if (!results.rows.length) {
        sql_query = db.intermediaryId.put;
        params = [
          credential_url,
          ' ',    // actor
          ' ',    // group_id
          processed_results.created_by_id
        ];
        await connection.execute(sql_query, params);
        sql_query = db.intermediaryId.get;
        params = [credential_url];
        results = await connection.execute(sql_query, params);
      }

      secure_url += results.rows[0].intermediary_id;
      let restricted_body = [
        'person_id',
        ' ',
        'byu_id',
        ' ',
        'net_id',
        ' ',
        'credential_type',
        ' ',
        'credential_id',
        ' ',
        'secure_url',
        secure_url
      ];
      let eventness = event.Builder(header, restricted_body);
      event_frame.events.event.push(eventness);

      header[5] = event_type2;
      restricted_body.push('verified_flag');
      restricted_body.push(' ');
      filters.push('restricted');
      filters.push(processed_results.restricted);
      eventness = event.Builder(header, restricted_body, filters);
      event_frame.events.event.push(eventness);
    }
    let sql_query = db.raiseEvent;
    let params = [JSON.stringify(event_frame)];
    await connection.execute(sql_query, params, { autoCommit: true });
    // await connection.commit();
    sql_query = db.enqueue;
    await connection.execute(sql_query, params);
  } catch (error) {
    console.log('EVENT ENQUEUE ERROR');
    console.error(error.stack);
    throw utils.Error(207, 'Record was deleted but event was not raised');
  }
}

function processDeleteFromResults(from_results) {
  let processed_results = {};
  processed_results.date_time_created = moment.tz(from_results.date_time_created, 'America/Danmarkshavn');
  processed_results.date_time_created = processed_results.date_time_created.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
  processed_results.created_by_id = from_results.created_by_id;
  processed_results.person_id = from_results.person_id || ' ';
  processed_results.net_id = from_results.net_id || ' ';
  processed_results.employee_type = /^[^-]$/.test(from_results.employee_type) ? from_results.employee_type : 'Not An Employee';
  processed_results.student_status = from_results.student_status;
  processed_results.restricted = (/^Y$/g.test(from_results.restricted));
  processed_results.from_user_name = from_results.user_name || ' ';
  processed_results.from_lost_or_stolen = from_results.lost_or_stolen || 'N';
  processed_results.from_status = from_results.status || 'ACTIVE';
  processed_results.from_expiration_date = from_results.expiration_date || '';
  processed_results.from_issuing_location = from_results.issuing_location || ' ';
  processed_results.from_physical_form = from_results.physical_form || ' ';
  processed_results.from_associated_device = from_results.associated_device || ' ';
  processed_results.from_scoped_affiliation = from_results.scoped_affiliation || ' ';
  processed_results.user_name = ' ';
  processed_results.lost_or_stolen = ' ';
  processed_results.status = ' ';
  processed_results.expiration_date = '';
  processed_results.issuing_location = ' ';
  processed_results.physical_form = ' ';
  processed_results.associated_device = ' ';
  processed_results.scoped_affiliation = ' ';

  console.log("DELETE PROCESS RESULTS", processed_results);
  return processed_results;
}

exports.deleteCredential = async function (definitions, byu_id, credential_type, credential_id, authorized_byu_id, permissions) {
  validateCredentialId(credential_type, credential_id);
  const connection = await db.getConnection();
  if (modifiableOrReadOnly(credential_type, permissions) === 'read-only') {
    throw utils.Error(403, `User not authorized to delete ${credential_type} credentials`);
  }
  let sql_query = sql.sql.checkCredential;
  let params = [
    credential_type,
    credential_id
  ];
  const check_results = await connection.execute(sql_query, params);
  if (check_results.rows[0] && (byu_id !== check_results.rows[0].byu_id)) {
    throw utils.Error(409, "Credential Type and ID combination belong to another BYU_ID")
  }
  sql_query = sql.sql.fromCredential;
  params.push(byu_id);
  const from_results = await connection.execute(sql_query, params);

  console.log("FROM RESULTS", from_results);
  if (!from_results.rows.length) {
    throw utils.Error(404, 'Could not find BYU_ID');
  }


  if (from_results.rows[0].credential_type) {
    console.log('I am a real delete');
    const change_type = 'D';
    const processed_results = processDeleteFromResults(from_results.rows[0]);
    sql_query = sql.modifyCredential.delete;
    await connection.execute(sql_query, params);
    await logChange(connection, change_type, authorized_byu_id, byu_id, credential_type, credential_id, processed_results);
    return await credentialDeletedEvents(connection, byu_id, credential_type, credential_id, processed_results);
  }
  connection.close();
};
