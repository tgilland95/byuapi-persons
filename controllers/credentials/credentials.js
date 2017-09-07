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
      byu_id: row.byu_id,
      name: row.name,
      credential_type: row.credential_type,
      credential_id: row.credential_id,
      api_type: api_type,
      date_time_updated: row.date_time_updated,
      updated_by_id: row.updated_by_id,
      updated_by_name: row.updated_by_name || undefined,
      date_time_created: row.date_time_created,
      created_by_id: row.created_by_id,
      created_by_name: row.created_by_name || undefined,
      user_name: row.user_name,
      lost_or_stolen: row.lost_or_stolen,
      status: row.status,
      expiration_date: row.expiration_date,
      issuing_location: row.issuing_location,
      physical_form: row.physical_form,
      associated_device: row.associated_device,
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
      if (auth.canUpdateCASCredential(permissions)) {
        return 'modifiable';
      }
      break;
    case "SEMINARY_STUDENT_ID":
      if (auth.canUpdateCASCredential(permissions) || auth.isLDSSync(permissions)) {
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
      if (auth.canUpdateWSO2ClientId(permissions)) {
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

exports.getCredential = async function getCredential(definitions, byu_id, credential_type, credential_id, permissions) {
  const params = [credential_type, credential_id, byu_id];
  const sql_query = sql.sql.getCredential;
  const results = await db.execute(sql_query, params);

  // If no results are returned or the record is restricted
  // and the entity retrieving the record does not belong
  // to the GRO.PERSON_GROUP.GROUP_ID.RESTRICTED then
  // return 404 person not found
  if (!results.rows.length ||
    (results.rows[0].restricted === 'Y' &&
      !auth.hasRestrictedRights(permissions))) {
    throw utils.Error(404, 'BYU_ID Not Found In Person Table');
  }

  // If the person exists but the type of credential requested
  // does not exist then return 404 credential not found
  if (!results.rows[0].credential_type) {
    throw utils.Error(404, `${credential_type},${credential_id} not associated with BYU_ID or not found`);
  }

  // If it is not self service and the entity retrieving the
  // record does not have the PERSON info area and the
  // credential being retrieved does not belong to an employee
  // or faculty and it is not his or her work credential
  // and if it is unlisted then throw a 403 Not Authorized
  if (auth.canViewBasic(permissions) || /^NET_ID$/g.test(credential_type) ||
    (/^WSO2_CLIENT_ID$/g.test(credential_type) && auth.canUpdateWSO2ClientId(permissions)) ||
    (/^(LDS_CMIS_ID|LDS_ACCOUNT_ID|SEMINARY_STUDENT_ID)$/g.test(credential_type) &&
      auth.canViewLDSCred(permissions))) {
    throw utils.Error(403, 'Not Authorized To View Credential');
  }

  return mapDBResultsToDefinition(definitions, results.rows[0], modifiableOrReadOnly(credential_type, permissions));
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

  // If no results are returned or the record is restricted
  // and the entity retrieving the record does not belong
  // to the GRO.PERSON_GROUP.GROUP_ID.RESTRICTED then
  // return 404 person not found
  if (!results.rows.length ||
    (results.rows[0].restricted === 'Y' &&
      !auth.hasRestrictedRights(permissions))) {
    throw utils.Error(404, 'BYU_ID Not Found In Person Table')
  }

  // If it is self service or the entity retrieving the record has the PERSON info area then
  // return all credential information else if they are looking up an employee or faculty member
  // return the employee's or faculty's work credential as long as it is not unlisted
  if (auth.canViewBasic(permissions)) {
    values = results.rows.map(row => mapDBResultsToDefinition(
      definitions, row, modifiableOrReadOnly(row.credential_type, permissions)));
  } else {
    results.rows.filter(row => (row.credential_type === 'NET_ID' &&
      (row.primary_role === 'Employee' || row.primary_role === 'Faculty'))
    ).map(row => mapDBResultsToDefinition(definitions, row, 'read-only'))
  }

  const credentials = Enforcer.applyTemplate(definitions.credentials, definitions,
    {
      byu_id: byu_id,
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

function processPostCode(postal_code, country_code) {
  if (country_code === 'USA' &&
    !/^( |[0-9]{5})$/g.test(postal_code)) {

    if (/^[0-9]{5}$/g.test(postal_code.substr(0, 5))) {
      postal_code = postal_code.substr(0, 5);
    }
    else {
      postal_code = ' ';
    }
  }

  if (country_code === 'CAN' &&
    !/^( |[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ ]\d[ABCEGHJ-NPRSTV-Z]\d)$/g.test(postal_code)) {

    if (/^( |[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d)$/g.test(postal_code)) {
      postal_code = postal_code.substr(0, 3) + ' ' + postal_code.substr(3, 3);
    }
    else if (/^( |[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][-]\d[ABCEGHJ-NPRSTV-Z]\d)$/g.test(postal_code)) {
      postal_code = postal_code.replace(/-/, ' ');
    }
    else {
      postal_code = ' ';
    }
  }

  if (!/^( |[A-Z0-9 -]{1,20})$/g.test(postal_code)) {
    postal_code = ' ';
  }

  return postal_code;
}

function processBody(authorized_byu_id, body) {
  let current_date_time = moment();
  current_date_time = current_date_time.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
  let new_body = {};
  new_body.credential_line_1 = body.credential_line_1 || '';
  new_body.credential_line_2 = body.credential_line_2 || ' ';
  new_body.credential_line_3 = body.credential_line_3 || ' ';
  new_body.credential_line_4 = body.credential_line_4 || ' ';
  new_body.country_code = body.country_code || '???';
  new_body.room = body.room || ' ';
  new_body.building = body.building || ' ';
  new_body.city = body.city || ' ';
  new_body.state_code = body.state_code || '??';
  new_body.postal_code = (body.postal_code) ? processPostCode(body.postal_code, new_body.country_code) : ' ';
  new_body.verified_flag = body.verified_flag ? 'Y' : 'N';
  new_body.unlisted = body.unlisted ? 'Y' : 'N';
  new_body.updated_by_id = (!body.updated_by_id || !body.updated_by_id.trim()) ? authorized_byu_id : body.updated_by_id;
  if (!body.date_time_updated || !body.date_time_updated.trim()) {
    new_body.date_time_updated = current_date_time
  } else {
    new_body.date_time_updated = moment.tz(body.date_time_updated, 'America/Danmarkshavn');
    new_body.date_time_updated = new_body.date_time_updated.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
  }
  new_body.created_by_id = (!body.created_by_id || !body.created_by_id.trim()) ? authorized_byu_id : body.created_by_id;
  if (!body.date_time_created || !body.date_time_created.trim()) {
    new_body.date_time_created = current_date_time;
  } else {
    new_body.date_time_created = moment.tz(body.date_time_created, 'America/Danmarkshavn');
    new_body.date_time_created = new_body.date_time_created.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
  }

  let error = false;
  let msg = 'Incorrect BODY: Missing\n';
  if (!new_body.credential_line_1) {
    msg += '\n\tCredential Line 1 must not be blank or a space'
  }

  if (!utils.isValidCountryCode(new_body.country_code)) {
    msg += '\n\tInvalid Country Code if unknown use, ???';
    error = true;
  }

  if (!utils.isValidStateCode(new_body.state_code, new_body.country_code)) {
    msg += '\n\tInvalid State Code if unknown use, ??';
    error = true;
  }

  if (!utils.isValidBuildingCode(new_body.building)) {
    msg += '\n\tInvalid Building Code';
    error = true;
  }

  for (let prop in new_body) {
    if (new_body.hasOwnProperty(prop)) {
      if (!/[\x00-\x7F]+/.test(new_body[prop])) {
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
  process_results.restricted = (from_results.restricted && from_results.restricted === 'Y');
  process_results.credential_line_1 = from_results.credential_line_1 || ' ';
  process_results.credential_line_2 = from_results.credential_line_2 || ' ';
  process_results.credential_line_3 = from_results.credential_line_3 || ' ';
  process_results.credential_line_4 = from_results.credential_line_4 || ' ';
  process_results.country_code = from_results.country_code || ' ';
  process_results.room = from_results.room || ' ';
  process_results.building = from_results.building || ' ';
  process_results.city = from_results.city || ' ';
  process_results.state_code = from_results.state_code || ' ';
  process_results.postal_code = from_results.postal_code || ' ';
  process_results.unlisted = from_results.unlisted || ' ';
  process_results.verified_flag = from_results.verified_flag || ' ';

  return process_results;
}

async function logChange(connection, change_type, authorized_byu_id, byu_id, credential_type, processed_results, new_body) {
  const sql_query = sql.modifyCredential.logChange;

  let log_params = [];
  if (change_type === 'D') {
    let date_time_updated = moment();
    date_time_updated = date_time_updated.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
    log_params = [
      change_type,
      byu_id,
      credential_type,
      date_time_updated,
      authorized_byu_id,
      processed_results.date_time_created,
      processed_results.created_by_id,
      processed_results.from_credential_line_1,
      processed_results.from_credential_line_2,
      processed_results.from_credential_line_3,
      processed_results.from_credential_line_4,
      processed_results.from_country_code,
      processed_results.from_room,
      processed_results.from_building,
      processed_results.from_city,
      processed_results.from_state_code,
      processed_results.from_postal_code,
      processed_results.from_unlisted,
      processed_results.from_verified_flag,
      processed_results.credential_line_1,
      processed_results.credential_line_2,
      processed_results.credential_line_3,
      processed_results.credential_line_4,
      processed_results.country_code,
      processed_results.room,
      processed_results.building,
      processed_results.city,
      processed_results.state_code,
      processed_results.postal_code,
      processed_results.unlisted,
      processed_results.verified_flag
    ];
  }
  else if (change_type === 'A' ||
    change_type === 'C') {
    log_params = [
      change_type,
      byu_id,
      credential_type,
      new_body.date_time_updated,
      new_body.updated_by_id,
      new_body.date_time_created,
      new_body.created_by_id,
      processed_results.credential_line_1,
      processed_results.credential_line_2,
      processed_results.credential_line_3,
      processed_results.credential_line_4,
      processed_results.country_code,
      processed_results.room,
      processed_results.building,
      processed_results.city,
      processed_results.state_code,
      processed_results.postal_code,
      processed_results.unlisted,
      processed_results.verified_flag,
      new_body.credential_line_1,
      new_body.credential_line_2,
      new_body.credential_line_3,
      new_body.credential_line_4,
      new_body.country_code,
      new_body.room,
      new_body.building,
      new_body.city,
      new_body.state_code,
      new_body.postal_code,
      new_body.unlisted,
      new_body.verified_flag
    ];
  }
  console.log('LOG PARAMS', log_params);
  return connection.execute(sql_query, log_params, { autoCommit: true });
}

async function credentialEvents(connection, change_type, byu_id, credential_type, body, processed_results) {
  try {
    const credential_url = `https://api.byu.edu/byuapi/persons/v1/${byu_id}/credentials/${credential_type}`;
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
    body.unlisted = (body.unlisted === 'Y');
    body.verified_flag = (body.verified_flag === 'Y');
    if (!processed_results.restricted && !body.unlisted) {
      let event_body = [
        'person_id',
        processed_results.person_id,
        'byu_id',
        byu_id,
        'net_id',
        processed_results.net_id,
        'credential_type',
        credential_type,
        'credential_line_1',
        body.credential_line_1,
        'credential_line_2',
        body.credential_line_2,
        'credential_line_3',
        body.credential_line_3,
        'credential_line_4',
        body.credential_line_4,
        'country_code',
        body.country_code,
        'city',
        body.city,
        'state_code',
        body.state_code,
        'postal_code',
        body.postal_code,
        'campus_credential_f',
        body.building,
        'unlisted',
        body.unlisted,
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
        'credential_line_1',
        ' ',
        'credential_line_2',
        ' ',
        'credential_line_3',
        ' ',
        'credential_line_4',
        ' ',
        'country_code',
        ' ',
        'city',
        ' ',
        'state_code',
        ' ',
        'postal_code',
        ' ',
        'campus_credential_f',
        ' ',
        'unlisted',
        body.unlisted,
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
      eventness = event.Builder(header, restricted_body);
      event_frame.events.event.push(eventness);

      header[5] = event_type2;
      restricted_body.push('verified_flag');
      restricted_body.push(' ');
      filters.push('restricted');
      filters.push(body.restricted);
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

exports.modifyCredential = async function (definitions, byu_id, credential_type, body, authorized_byu_id, permissions) {
  const connection = await db.getConnection();
  const new_body = processBody(authorized_byu_id, body);
  console.log('NEW BODY', new_body);

  if (!auth.canUpdatePersonContact(permissions)) {
    throw utils.Error(403, 'User not authorized to update CONTACT data')
  }

  let params = [
    credential_type,
    byu_id
  ];
  let sql_query = sql.sql.fromCredential;
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
    new_body.credential_line_1 !== processed_results.credential_line_1 ||
    new_body.credential_line_2 !== processed_results.credential_line_2 ||
    new_body.credential_line_3 !== processed_results.credential_line_3 ||
    new_body.credential_line_4 !== processed_results.credential_line_4 ||
    new_body.country_code !== processed_results.country_code ||
    new_body.room !== processed_results.room ||
    new_body.building !== processed_results.building ||
    new_body.city !== processed_results.city ||
    new_body.state_code !== processed_results.state_code ||
    new_body.postal_code !== processed_results.postal_code ||
    new_body.unlisted !== processed_results.unlisted ||
    new_body.verified_flag !== processed_results.verified_flag);

  if (is_different) {
    if (!from_results.rows[0].credential_type) {
      sql_query = sql.modifyCredential.create;
      params = [
        byu_id,
        credential_type,
        new_body.date_time_updated,
        new_body.updated_by_id,
        new_body.date_time_created,
        new_body.created_by_id,
        new_body.credential_line_1,
        new_body.credential_line_2,
        new_body.credential_line_3,
        new_body.credential_line_4,
        new_body.country_code,
        new_body.room,
        new_body.building,
        new_body.city,
        new_body.state_code,
        new_body.postal_code,
        new_body.unlisted,
        new_body.verified_flag
      ];
    } else {
      sql_query = sql.modifyCredential.update;
      params = [
        new_body.date_time_updated,
        new_body.updated_by_id,
        new_body.credential_line_1,
        new_body.credential_line_2,
        new_body.credential_line_3,
        new_body.credential_line_4,
        new_body.country_code,
        new_body.room,
        new_body.building,
        new_body.city,
        new_body.state_code,
        new_body.postal_code,
        new_body.unlisted,
        new_body.verified_flag,
        byu_id,
        credential_type
      ];
    }
    await connection.execute(sql_query, params);
    await logChange(connection, change_type, authorized_byu_id, byu_id, credential_type, processed_results, new_body);
    // connection.commit();
    await credentialEvents(connection, change_type, byu_id, credential_type, new_body, processed_results);
  }

  params = [credential_type, byu_id];
  sql_query = sql.sql.getCredential;
  const results = await connection.execute(sql_query, params);
  connection.close();
  return mapDBResultsToDefinition(definitions, results.rows[0], 'modifiable');
};

async function credentialDeletedEvents(connection, byu_id, credential_type, processed_results) {
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
    const credential_url = `https://api.byu.edu/byuapi/persons/v1/${byu_id}/credentials/${credential_type}`;
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
    processed_results.unlisted = (processed_results.unlisted === 'Y');
    processed_results.verified_flag = (processed_results.verified_flag === 'Y');

    if (!processed_results.restricted && !processed_results.unlisted) {
      let event_body = [
        'person_id',
        processed_results.person_id,
        'byu_id',
        byu_id,
        'net_id',
        processed_results.net_id,
        'credential_type',
        credential_type,
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
  processed_results.from_credential_line_1 = (from_results.credential_line_1) ? from_results.credential_line_1 : ' ';
  processed_results.from_credential_line_2 = (from_results.credential_line_2) ? from_results.credential_line_2 : ' ';
  processed_results.from_credential_line_3 = (from_results.credential_line_3) ? from_results.credential_line_3 : ' ';
  processed_results.from_credential_line_4 = (from_results.credential_line_4) ? from_results.credential_line_4 : ' ';
  processed_results.from_country_code = (from_results.country_code) ? from_results.country_code : ' ';
  processed_results.from_room = (from_results.room) ? from_results.room : ' ';
  processed_results.from_building = (from_results.building) ? from_results.building : ' ';
  processed_results.from_city = (from_results.city) ? from_results.city : ' ';
  processed_results.from_state_code = (from_results.state_code) ? from_results.state_code : ' ';
  processed_results.from_postal_code = (from_results.postal_code) ? from_results.postal_code : ' ';
  processed_results.from_unlisted = (from_results.unlisted) ? from_results.unlisted : ' ';
  processed_results.from_verified_flag = (from_results.verified_flag) ? from_results.verified_flag : ' ';
  processed_results.credential_line_1 = ' ';
  processed_results.credential_line_2 = ' ';
  processed_results.credential_line_3 = ' ';
  processed_results.credential_line_4 = ' ';
  processed_results.country_code = ' ';
  processed_results.room = ' ';
  processed_results.building = ' ';
  processed_results.city = ' ';
  processed_results.state_code = ' ';
  processed_results.postal_code = ' ';
  processed_results.unlisted = ' ';
  processed_results.verified_flag = ' ';

  console.log("DELETE PROCESS RESULTS", processed_results);
  return processed_results;
}

exports.deleteCredential = async function (definitions, byu_id, credential_type, authorized_byu_id, permissions) {
  const connection = await db.getConnection();
  if (!auth.canUpdatePersonContact(permissions)) {
    throw utils.Error(403, 'User not authorized to update CONTACT data')
  }
  let sql_query = sql.sql.fromCredential;
  let params = [
    credential_type,
    byu_id
  ];
  const from_results = await connection.execute(sql_query, params);

  console.log("FROM RESULTS", from_results);
  if (!from_results.rows.length) {
    throw utils.Error(404, 'Could not find BYU_ID');
  }


  if (from_results.rows[0].credential_type) {
    const change_type = 'D';
    const processed_results = processDeleteFromResults(from_results.rows[0]);
    sql_query = sql.modifyCredential.delete;
    await connection.execute(sql_query, params);
    await logChange(connection, change_type, authorized_byu_id, byu_id, credential_type, processed_results);
    await credentialDeletedEvents(connection, byu_id, credential_type, processed_results);
  }
  connection.close();
};
