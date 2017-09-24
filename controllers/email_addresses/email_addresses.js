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
const validator = require("email-validator");

/**
 * A helper function that takes the swagger definition sql results and
 * returns a JSON object based on a map
 * @param definitions - Swagger
 * @param row - SQL Results
 * @param api_type - Whether the field is modifiable or read-only
 * @returns {*}
 */
function mapDBResultsToDefinition(definitions, row, api_type) {
  return Enforcer.applyTemplate(definitions.email_address, null,
    {
      byu_id: row.byu_id,
      name: row.name,
      email_address_type: row.email_address_type,
      api_type: api_type,
      date_time_updated: row.date_time_updated,
      updated_by_id: row.updated_by_id,
      updated_by_name: row.updated_by_name,
      date_time_created: row.date_time_created,
      created_by_id: row.created_by_id,
      created_by_name: row.created_by_name || undefined,
      email_address: row.email_address,
      unlisted: /^Y$/g.test(row.unlisted),
      verified_flag: /^Y$/g.test(row.verified_flag)
    }
  );
}

/**
 * This function returns a JSON object with a person's address information as defined by the
 * swagger.
 * @param definitions - swagger information
 * @param byu_id - Nine digit number
 * @param email_address_type - MAL, RES, PRM, WRK
 * @param permissions - authorizations
 * @returns {Promise.<*>}
 */
exports.getEmailAddress = async function getEmailAddress(definitions, byu_id, email_address_type, permissions) {
  const params = [email_address_type, byu_id];
  const sql_query = sql.sql.getEmailAddress;
  const modifiable = auth.canUpdateContact(permissions) ? 'modifiable' : 'read-only';
  const results = await db.execute(sql_query, params);

  // If no results are returned or the record is restricted
  // and the entity retrieving the record does not belong
  // to the GRO.PERSON_GROUP.GROUP_ID.RESTRICTED then
  // return 404 person not found
  if (!results.rows.length ||
    (/^Y$/g.test(results.rows[0].restricted) &&
      !auth.hasRestrictedRights(permissions))) {
    throw utils.Error(404, 'BYU_ID Not Found In Person Table')
  }

  // If the person exists but the type of address requested
  // does not exist then return 404 address not found
  if (!results.rows[0].email_address_type) {
    throw utils.Error(404, `${email_address_type} email address not found`)
  }

  // If it is not self service and the entity retrieving the
  // record does not have the PERSON info area and the
  // address being retrieved does not belong to an employee
  // or faculty and it is not his or her work address
  // and if it is unlisted then throw a 403 Not Authorized
  if (!auth.canViewContact(permissions) &&
    !/^WORK$/g.test(email_address_type) &&
    !/^(Employee|Faculty)$/g.test(results.rows[0].primary_role) &&
    /^Y$/g.test(results.rows[0].unlisted)) {
    throw utils.Error(403, 'Not Authorized To View Email Address')
  }

  return mapDBResultsToDefinition(definitions, results.rows[0], modifiable);
};

/**
 * Returns a person's address collection
 * @param definitions - Swagger
 * @param byu_id - Nine digit number
 * @param permissions - Authorizations
 * @returns {Promise.<*>}
 */
exports.getEmailAddresses = async function getEmailAddresses(definitions, byu_id, permissions) {
  const params = [byu_id];
  const sql_query = sql.sql.getEmailAddresses;
  const results = await db.execute(sql_query, params);
  const can_view_contact = auth.canViewContact(permissions);
  const return_code = can_view_contact ? 200 : 203;
  const return_message = can_view_contact ? 'Success' : 'Public Info Only';
  const collection_size = (results.rows[0].email_address_type) ? results.rows.length : 0;
  const api_type = auth.canUpdateContact(permissions) ? 'modifiable' : 'read-only';
  let values = [];

  // If no results are returned or the record is restricted
  // and the entity retrieving the record does not belong
  // to the GRO.PERSON_GROUP.GROUP_ID.RESTRICTED then
  // return 404 person not found
  if (!results.rows.length ||
    (/^Y$/g.test(results.rows[0].restricted) &&
      !auth.hasRestrictedRights(permissions))) {
    throw utils.Error(404, 'BYU_ID Not Found In Person Table')
  }

  // If it is self service or the entity retrieving the record has the PERSON info area then
  // return all address information else if they are looking up an employee or faculty member
  // return the employee's or faculty's work address as long as it is not unlisted
  if (results.rows[0].email_address_type) {
    values = (can_view_contact) ? (
      results.rows.map(row => mapDBResultsToDefinition(definitions, row, api_type))
    ) : (
      results.rows.filter(row => (/^N$/g.test(row.unlisted) &&
        /^WORK$/g.test(row.email_address_type) && /^(Employee|Faculty)$/g.test(row.primary_role))
      ).map(row => mapDBResultsToDefinition(definitions, row, api_type))
    );
  }

  const email_addresses = Enforcer.applyTemplate(definitions.email_addresses, definitions,
    {
      cache_date_time: new Date().toISOString(),
      byu_id: byu_id,
      collection_size: collection_size,
      page_start: 0,
      page_end: collection_size,
      page_size: collection_size,
      default_page_size: 1,
      maximum_page_size: 100,
      validation_response_code: return_code,
      validation_response_message: return_message,
      email_addresses_values: values
    });
  email_addresses.values = values;
  return email_addresses;
};

function processBody(authorized_byu_id, body) {
  let current_date_time = moment();
  current_date_time = current_date_time.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
  let new_body = {};
  new_body.email_address = body.email_address;
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
  let msg = 'Incorrect BODY:';
  if (!validator.validate(new_body.email_address)) {
    msg += `\n\tInvalid email_address, unrecognized format`;
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
  let from = {};
  from.person_id = from_results.person_id || ' ';
  from.net_id = from_results.net_id || ' ';
  from.employee_type = /[^-]/.test(from_results.employee_type) ? from_results.employee_type : 'Not An Employee';
  from.student_status = from_results.student_status;
  from.restricted = from_results.restricted || ' ';
  from.email_address = from_results.email_address || ' ';
  from.unlisted = from_results.unlisted || ' ';
  from.verified_flag = from_results.verified_flag || ' ';

  return from;
}

async function logChange(connection, change_type, authorized_byu_id, byu_id, email_address_type, processed_results, new_body) {
  const sql_query = sql.modifyEmailAddress.logChange;

  let log_params = [];
  if (change_type === 'D') {
    let date_time_updated = moment();
    date_time_updated = date_time_updated.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
    log_params = [
      change_type,
      byu_id,
      email_address_type,
      date_time_updated,
      authorized_byu_id,
      processed_results.date_time_created,
      processed_results.created_by_id,
      processed_results.from_email_address,
      processed_results.from_unlisted,
      processed_results.from_verified_flag,
      processed_results.email_address,
      processed_results.unlisted,
      processed_results.verified_flag
    ];
  }
  else if (change_type === 'A' ||
    change_type === 'C') {
    log_params = [
      change_type,
      byu_id,
      email_address_type,
      new_body.date_time_updated,
      new_body.updated_by_id,
      new_body.date_time_created,
      new_body.created_by_id,
      processed_results.email_address,
      processed_results.unlisted,
      processed_results.verified_flag,
      new_body.email_address,
      new_body.unlisted,
      new_body.verified_flag
    ];
  }
  console.log('LOG PARAMS', log_params);
  return connection.execute(sql_query, log_params, { autoCommit: true });
}

async function emailAddressEvents(connection, change_type, byu_id, email_address_type, body, processed_results) {
  try {
    const email_address_url = `https://api.byu.edu/byuapi/persons/v1/${byu_id}/email_addresses/${email_address_type}`;
    const source_dt = new Date().toISOString();
    const domain = 'edu.byu';
    const entity = 'BYU-IAM';
    const identity_type = 'Person';
    let event_type = (change_type === 'A') ? 'Email Address Added' : 'Email Address Changed';
    let event_type2 = (change_type === 'A') ? 'Email Address Added v2' : 'Email Address Changed v2';
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
    body.unlisted = /^Y$/g.test(body.unlisted);
    body.verified_flag = /^Y$/g.test(body.verified_flag);
    if (!processed_results.restricted && !body.unlisted) {
      let event_body = [
        'person_id',
        processed_results.person_id,
        'byu_id',
        byu_id,
        'net_id',
        processed_results.net_id,
        'email_address_type',
        email_address_type,
        'email_address',
        body.email_address,
        'unlisted',
        body.unlisted,
        'verified_flag',
        /^Y$/g.test(body.verified_flag),
        'updated_by_id',
        body.updated_by_id,
        'date_time_updated',
        body.date_time_updated,
        'created_by_id',
        body.created_by_id,
        'date_time_created',
        body.date_time_created,
        'callback_url',
        email_address_url
      ];
      eventness = event.Builder(header, event_body);
      event_frame.events.event.push(eventness);

      header[5] = event_type2;
      filters = [
        'identity_type',
        identity_type,
        'employee_type',
        processed_results.employee_type,
        'student_status',
        processed_results.student_status
      ];
      eventness = event.Builder(header, event_body, filters);
      event_frame.events.event.push(eventness);
    }
    else {
      sql_query = db.intermediaryId.get;
      params = [email_address_url];
      let results = await connection.execute(sql_query, params);
      if (!results.rows.length) {
        sql_query = db.intermediaryId.put;
        params = [
          email_address_url,
          ' ',    // actor
          ' ',    // group_id
          body.created_by_id
        ];
        await connection.execute(sql_query, params);
        sql_query = db.intermediaryId.get;
        params = [email_address_url];
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
        'address_type',
        ' ',
        'address_line_1',
        ' ',
        'address_line_2',
        ' ',
        'address_line_3',
        ' ',
        'address_line_4',
        ' ',
        'country_code',
        ' ',
        'city',
        ' ',
        'state_code',
        ' ',
        'postal_code',
        ' ',
        'campus_address_f',
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

exports.modifyEmailAddress = async function (definitions, byu_id, email_address_type, body, authorized_byu_id, permissions) {
  const connection = await db.getConnection();
  const new_body = processBody(authorized_byu_id, body);
  console.log('NEW BODY', new_body);

  if (!auth.canUpdateContact(permissions)) {
    throw utils.Error(403, 'User not authorized to update CONTACT data')
  }

  let params = [
    email_address_type,
    byu_id
  ];
  let sql_query = sql.sql.fromEmailAddress;
  const from_results = await connection.execute(sql_query, params);
  if (!from_results.rows.length ||
    (/^Y$/g.test(from_results.rows[0].restricted) &&
      !auth.hasRestrictedRights(permissions))) {
    throw utils.Error(404, 'Could not find BYU_ID in Person Table')
  }

  new_body.created_by_id = from_results.rows[0].created_by_id || new_body.created_by_id;
  if (from_results.rows[0].date_time_created) {
    new_body.date_time_created = moment.tz(from_results.rows[0].date_time_created, 'America/Danmarkshavn');
    new_body.date_time_created = new_body.date_time_created.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
  }

  const change_type = (!from_results.rows[0].email_address_type) ? 'A' : 'C';
  const processed_results = processFromResults(from_results.rows[0]);
  console.log('PROCESS RESULTS', processed_results);
  const is_different = (
    new_body.email_address !== processed_results.email_address ||
    new_body.verified_flag !== processed_results.verified_flag ||
    new_body.unlisted !== processed_results.unlisted);

  if (is_different) {
    if (!from_results.rows[0].email_address_type) {
      sql_query = sql.modifyEmailAddress.create;
      params = [
        byu_id,
        email_address_type,
        new_body.date_time_updated,
        new_body.updated_by_id,
        new_body.date_time_created,
        new_body.created_by_id,
        new_body.email_address,
        new_body.unlisted,
        new_body.verified_flag
      ];
    } else {
      sql_query = sql.modifyEmailAddress.update;
      params = [
        new_body.date_time_updated,
        new_body.updated_by_id,
        new_body.email_address,
        new_body.unlisted,
        new_body.verified_flag,
        byu_id,
        email_address_type
      ];
    }
    await connection.execute(sql_query, params);
    await logChange(connection, change_type, authorized_byu_id, byu_id, email_address_type, processed_results, new_body);
    // connection.commit();
    await emailAddressEvents(connection, change_type, byu_id, email_address_type, new_body, processed_results);
  }

  params = [email_address_type, byu_id];
  sql_query = sql.sql.getEmailAddress;
  const results = await connection.execute(sql_query, params);
  connection.close();
  return mapDBResultsToDefinition(definitions, results.rows[0], 'modifiable');
};

async function emailAddressDeletedEvents(connection, byu_id, email_address_type, processed_results) {
  try {
    const source_dt = new Date().toISOString();
    const event_type = 'Email Address Deleted';
    const event_type2 = 'Email Address Deleted v2';
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
    const email_address_url = `https://api.byu.edu/byuapi/persons/v1/${byu_id}/email_addresses/${email_address_type}`;
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
    processed_results.unlisted = /^Y$/g.test(processed_results.unlisted);
    processed_results.verified_flag = /^Y$/g.test(processed_results.verified_flag);

    if (!processed_results.restricted && !processed_results.unlisted) {
      let event_body = [
        'person_id',
        processed_results.person_id,
        'byu_id',
        byu_id,
        'net_id',
        processed_results.net_id,
        'email_address_type',
        email_address_type,
        'callback_url',
        email_address_url
      ];
      let eventness = event.Builder(header, event_body);
      event_frame.events.event.push(eventness);

      header[5] = event_type2;
      eventness = event.Builder(header, event_body, filters);
      event_frame.events.event.push(eventness);
    }
    else {
      let sql_query = db.intermediaryId.get;
      let params = [email_address_url];
      let results = await connection.execute(sql_query, params);
      if (!results.rows.length) {
        sql_query = db.intermediaryId.put;
        params = [
          email_address_url,
          ' ',    // actor
          ' ',    // group_id
          processed_results.created_by_id
        ];
        await connection.execute(sql_query, params);
        sql_query = db.intermediaryId.get;
        params = [email_address_url];
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
        'address_type',
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
  processed_results.restricted = /^Y$/g.test(from_results.restricted);
  processed_results.from_email_address = from_results.email_address || ' ';
  processed_results.from_unlisted = from_results.unlisted || ' ';
  processed_results.from_verified_flag = from_results.verified_flag || ' ';
  processed_results.email_address = ' ';
  processed_results.unlisted = ' ';
  processed_results.verified_flag = ' ';

  console.log("DELETE PROCESS RESULTS", processed_results);
  return processed_results;
}

exports.deleteEmailAddress = async function (definitions, byu_id, email_address_type, authorized_byu_id, permissions) {
  const connection = await db.getConnection();
  if (!auth.canUpdateContact(permissions)) {
    throw utils.Error(403, 'User not authorized to update CONTACT data')
  }
  let sql_query = sql.sql.fromEmailAddress;
  let params = [
    email_address_type,
    byu_id
  ];
  const from_results = await connection.execute(sql_query, params);

  console.log("FROM RESULTS", from_results);
  if (!from_results.rows.length) {
    throw utils.Error(404, 'Could not find BYU_ID');
  }


  if (from_results.rows[0].email_address_type) {
    const change_type = 'D';
    const processed_results = processDeleteFromResults(from_results.rows[0]);
    sql_query = sql.modifyEmailAddress.delete;
    await connection.execute(sql_query, params);
    await logChange(connection, change_type, authorized_byu_id, byu_id, email_address_type, processed_results);
    await emailAddressDeletedEvents(connection, byu_id, email_address_type, processed_results);
  }
  connection.close();
};
