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
  return Enforcer.applyTemplate(definitions.phone, null,
    {
      cache_date_time: new Date().toISOString(),
      api_type: api_type,
      byu_id: row.byu_id,
      name: row.name,
      lookup_number: row.lookup_number,
      date_time_updated: row.date_time_updated,
      updated_by_id: row.updated_by_id,
      updated_by_name: row.updated_by_name || undefined,
      date_time_created: row.date_time_created,
      created_by_id: row.created_by_id,
      created_by_name: row.created_by_name || undefined,
      phone_number: row.phone_number,
      country_code: row.country_code,
      country_name: row.country_name || undefined,
      country_number: row.country_number,
      cell_flag: /^Y$/g.test(row.cell_flag),
      time_code: row.time_code,
      texts_okay: /^Y$/g.test(row.texts_okay),
      unlisted: /^Y$/g.test(row.unlisted),
      primary_flag: /^Y$/g.test(row.primary_flag),
      tty: /^Y$/g.test(row.tty),
      work_flag: /^Y$/g.test(row.work_flag),
      verified_flag: /^Y$/g.test(row.verified_flag)
    }
  );
}

function mapPublicToDefinition(definitions, row, api_type) {
  return Enforcer.applyTemplate(definitions.phone, null,
    {
      cache_date_time: new Date().toISOString(),
      api_type: api_type,
      byu_id: row.byu_id,
      lookup_number: row.lookup_number,
      phone_number: row.phone_number,
      country_number: row.country_number,
      unlisted: /^Y$/g.test(row.unlisted),
      work_flag: /^Y$/g.test(row.work_flag)
    }
  );
}

/**
 * This function returns a JSON object with a person's phone information as defined by the
 * swagger.
 * @param definitions - swagger information
 * @param byu_id - Nine digit number
 * @param lookup_number - MAL, RES, PRM, WRK
 * @param permissions - authorizations
 * @returns {Promise.<*>}
 */
exports.getPhone = async function getPhone(definitions, byu_id, lookup_number, permissions) {
  const params = [lookup_number, byu_id];
  const sql_query = sql.sql.getPhone;
  const modifiable = auth.canViewContact(permissions) ? 'modifiable' : 'read-only';
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

  // If the person exists but the type of phone requested
  // does not exist then return 404 phone not found
  if (!results.rows[0].lookup_number) {
    throw utils.Error(404, `${lookup_number} phone not found`)
  }

  // If it is not self service and the entity retrieving the
  // record does not have the PERSON info area and the
  // phone being retrieved does not belong to an employee
  // or faculty and it is not his or her work phone
  // and if it is unlisted then throw a 403 Not Authorized
  if (auth.canViewContact(permissions)) {
    return mapDBResultsToDefinition(definitions, results.rows[0], modifiable);
  }

  if (/^Y$/g.test(results.rows[0].work_flag) &&
    /^(Employee|Faculty)$/g.test(results.rows[0].primary_role) &&
    !/^Y$/g.test(results.rows[0].unlisted)) {
    return mapPublicToDefinition(definitions, results.rows[0], modifiable);
  }

  throw utils.Error(403, 'Not Authorized To View Phone');
};

/**
 * Returns a person's phone collection
 * @param definitions - Swagger
 * @param byu_id - Nine digit number
 * @param permissions - Authorizations
 * @returns {Promise.<*>}
 */
exports.getPhones = async function getPhones(definitions, byu_id, permissions) {
  const params = [byu_id];
  const sql_query = sql.sql.getPhones;
  const results = await db.execute(sql_query, params);
  const can_view_contact = auth.canViewContact(permissions);
  const api_type = auth.canUpdateContact(permissions) ? 'modifiable' : 'read-only';
  const return_code = can_view_contact ? 200 : 203;
  const return_message = can_view_contact ? 'Success' : 'Public Info Only';
  const collection_size = (!results.rows[0].lookup_number) ? 0 : results.rows.length;
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
  // return all phone information else if they are looking up an employee or faculty member
  // return the employee's or faculty's work phone as long as it is not unlisted
  if (results.rows[0].lookup_number) {
    values = (can_view_contact) ? (
      results.rows.map(row => mapDBResultsToDefinition(definitions, row, api_type))
    ) : (
      results.rows.filter(row => (/^N$/g.test(row.unlisted) &&
        /^Y$/g.test(row.work_flag) && /^(Employee|Faculty)$/g.test(row.primary_role))
      ).map(row => mapPublicToDefinition(definitions, row, api_type))
    );
  }

  console.log(values);
  const phones = Enforcer.applyTemplate(definitions.phones, definitions,
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
      phones_values: values
    });
  phones.values = values;
  return phones;
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
  new_body.phone_line_1 = body.phone_line_1 || '';
  new_body.phone_line_2 = body.phone_line_2 || ' ';
  new_body.phone_line_3 = body.phone_line_3 || ' ';
  new_body.phone_line_4 = body.phone_line_4 || ' ';
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
  if (!new_body.phone_line_1) {
    msg += '\n\tPhone Line 1 must not be blank or a space'
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
  process_results.phone_line_1 = from_results.phone_line_1 || ' ';
  process_results.phone_line_2 = from_results.phone_line_2 || ' ';
  process_results.phone_line_3 = from_results.phone_line_3 || ' ';
  process_results.phone_line_4 = from_results.phone_line_4 || ' ';
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

async function logChange(connection, change_type, authorized_byu_id, byu_id, lookup_number, processed_results, new_body) {
  const sql_query = sql.modifyPhone.logChange;

  let log_params = [];
  if (change_type === 'D') {
    let date_time_updated = moment();
    date_time_updated = date_time_updated.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
    log_params = [
      change_type,
      byu_id,
      lookup_number,
      date_time_updated,
      authorized_byu_id,
      processed_results.date_time_created,
      processed_results.created_by_id,
      processed_results.from_phone_line_1,
      processed_results.from_phone_line_2,
      processed_results.from_phone_line_3,
      processed_results.from_phone_line_4,
      processed_results.from_country_code,
      processed_results.from_room,
      processed_results.from_building,
      processed_results.from_city,
      processed_results.from_state_code,
      processed_results.from_postal_code,
      processed_results.from_unlisted,
      processed_results.from_verified_flag,
      processed_results.phone_line_1,
      processed_results.phone_line_2,
      processed_results.phone_line_3,
      processed_results.phone_line_4,
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
      lookup_number,
      new_body.date_time_updated,
      new_body.updated_by_id,
      new_body.date_time_created,
      new_body.created_by_id,
      processed_results.phone_line_1,
      processed_results.phone_line_2,
      processed_results.phone_line_3,
      processed_results.phone_line_4,
      processed_results.country_code,
      processed_results.room,
      processed_results.building,
      processed_results.city,
      processed_results.state_code,
      processed_results.postal_code,
      processed_results.unlisted,
      processed_results.verified_flag,
      new_body.phone_line_1,
      new_body.phone_line_2,
      new_body.phone_line_3,
      new_body.phone_line_4,
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

async function phoneEvents(connection, change_type, byu_id, lookup_number, body, processed_results) {
  try {
    const phone_url = `https://api.byu.edu/byuapi/persons/v1/${byu_id}/phones/${lookup_number}`;
    const source_dt = new Date().toISOString();
    const domain = 'edu.byu';
    const entity = 'BYU-IAM';
    const identity_type = 'Person';
    let event_type = (change_type === 'A') ? 'Phone Added' : 'Phone Changed';
    let event_type2 = (change_type === 'A') ? 'Phone Added v2' : 'Phone Changed v2';
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
        'lookup_number',
        lookup_number,
        'phone_line_1',
        body.phone_line_1,
        'phone_line_2',
        body.phone_line_2,
        'phone_line_3',
        body.phone_line_3,
        'phone_line_4',
        body.phone_line_4,
        'country_code',
        body.country_code,
        'city',
        body.city,
        'state_code',
        body.state_code,
        'postal_code',
        body.postal_code,
        'campus_phone_f',
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
        phone_url
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
      params = [phone_url];
      let results = await connection.execute(sql_query, params);
      if (!results.rows.length) {
        sql_query = db.intermediaryId.put;
        params = [
          phone_url,
          ' ',    // actor
          ' ',    // group_id
          body.created_by_id
        ];
        await connection.execute(sql_query, params);
        sql_query = db.intermediaryId.get;
        params = [phone_url];
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
        'lookup_number',
        ' ',
        'phone_line_1',
        ' ',
        'phone_line_2',
        ' ',
        'phone_line_3',
        ' ',
        'phone_line_4',
        ' ',
        'country_code',
        ' ',
        'city',
        ' ',
        'state_code',
        ' ',
        'postal_code',
        ' ',
        'campus_phone_f',
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

exports.modifyPhone = async function (definitions, byu_id, lookup_number, body, authorized_byu_id, permissions) {
  const connection = await db.getConnection();
  const new_body = processBody(authorized_byu_id, body);
  console.log('NEW BODY', new_body);

  if (!auth.canUpdateContact(permissions)) {
    throw utils.Error(403, 'User not authorized to update CONTACT data')
  }

  let params = [
    lookup_number,
    byu_id
  ];
  let sql_query = sql.sql.fromPhone;
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

  const change_type = (!from_results.rows[0].lookup_number) ? 'A' : 'C';
  const processed_results = processFromResults(from_results.rows[0]);
  console.log('PROCESS RESULTS', processed_results);
  const is_different = (
    new_body.phone_line_1 !== processed_results.phone_line_1 ||
    new_body.phone_line_2 !== processed_results.phone_line_2 ||
    new_body.phone_line_3 !== processed_results.phone_line_3 ||
    new_body.phone_line_4 !== processed_results.phone_line_4 ||
    new_body.country_code !== processed_results.country_code ||
    new_body.room !== processed_results.room ||
    new_body.building !== processed_results.building ||
    new_body.city !== processed_results.city ||
    new_body.state_code !== processed_results.state_code ||
    new_body.postal_code !== processed_results.postal_code ||
    new_body.unlisted !== processed_results.unlisted ||
    new_body.verified_flag !== processed_results.verified_flag);

  if (is_different) {
    if (!from_results.rows[0].lookup_number) {
      sql_query = sql.modifyPhone.create;
      params = [
        byu_id,
        lookup_number,
        new_body.date_time_updated,
        new_body.updated_by_id,
        new_body.date_time_created,
        new_body.created_by_id,
        new_body.phone_line_1,
        new_body.phone_line_2,
        new_body.phone_line_3,
        new_body.phone_line_4,
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
      sql_query = sql.modifyPhone.update;
      params = [
        new_body.date_time_updated,
        new_body.updated_by_id,
        new_body.phone_line_1,
        new_body.phone_line_2,
        new_body.phone_line_3,
        new_body.phone_line_4,
        new_body.country_code,
        new_body.room,
        new_body.building,
        new_body.city,
        new_body.state_code,
        new_body.postal_code,
        new_body.unlisted,
        new_body.verified_flag,
        byu_id,
        lookup_number
      ];
    }
    await connection.execute(sql_query, params);
    await logChange(connection, change_type, authorized_byu_id, byu_id, lookup_number, processed_results, new_body);
    // connection.commit();
    await phoneEvents(connection, change_type, byu_id, lookup_number, new_body, processed_results);
  }

  params = [lookup_number, byu_id];
  sql_query = sql.sql.getPhone;
  const results = await connection.execute(sql_query, params);
  connection.close();
  return mapDBResultsToDefinition(definitions, results.rows[0], 'modifiable');
};

async function phoneDeletedEvents(connection, byu_id, lookup_number, processed_results) {
  try {
    const source_dt = new Date().toISOString();
    const event_type = 'Phone Deleted';
    const event_type2 = 'Phone Deleted v2';
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
    const phone_url = `https://api.byu.edu/byuapi/persons/v1/${byu_id}/phones/${lookup_number}`;
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
        'lookup_number',
        lookup_number,
        'callback_url',
        phone_url
      ];
      let eventness = event.Builder(header, event_body);
      event_frame.events.event.push(eventness);

      header[5] = event_type2;
      eventness = event.Builder(header, event_body, filters);
      event_frame.events.event.push(eventness);
    }
    else {
      let sql_query = db.intermediaryId.get;
      let params = [phone_url];
      let results = await connection.execute(sql_query, params);
      if (!results.rows.length) {
        sql_query = db.intermediaryId.put;
        params = [
          phone_url,
          ' ',    // actor
          ' ',    // group_id
          processed_results.created_by_id
        ];
        await connection.execute(sql_query, params);
        sql_query = db.intermediaryId.get;
        params = [phone_url];
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
        'lookup_number',
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
  processed_results.from_phone_line_1 = (from_results.phone_line_1) ? from_results.phone_line_1 : ' ';
  processed_results.from_phone_line_2 = (from_results.phone_line_2) ? from_results.phone_line_2 : ' ';
  processed_results.from_phone_line_3 = (from_results.phone_line_3) ? from_results.phone_line_3 : ' ';
  processed_results.from_phone_line_4 = (from_results.phone_line_4) ? from_results.phone_line_4 : ' ';
  processed_results.from_country_code = (from_results.country_code) ? from_results.country_code : ' ';
  processed_results.from_room = (from_results.room) ? from_results.room : ' ';
  processed_results.from_building = (from_results.building) ? from_results.building : ' ';
  processed_results.from_city = (from_results.city) ? from_results.city : ' ';
  processed_results.from_state_code = (from_results.state_code) ? from_results.state_code : ' ';
  processed_results.from_postal_code = (from_results.postal_code) ? from_results.postal_code : ' ';
  processed_results.from_unlisted = (from_results.unlisted) ? from_results.unlisted : ' ';
  processed_results.from_verified_flag = (from_results.verified_flag) ? from_results.verified_flag : ' ';
  processed_results.phone_line_1 = ' ';
  processed_results.phone_line_2 = ' ';
  processed_results.phone_line_3 = ' ';
  processed_results.phone_line_4 = ' ';
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

exports.deletePhone = async function (definitions, byu_id, lookup_number, authorized_byu_id, permissions) {
  const connection = await db.getConnection();
  if (!auth.canUpdateContact(permissions)) {
    throw utils.Error(403, 'User not authorized to update CONTACT data')
  }
  let sql_query = sql.sql.fromPhone;
  let params = [
    lookup_number,
    byu_id
  ];
  const from_results = await connection.execute(sql_query, params);

  console.log("FROM RESULTS", from_results);
  if (!from_results.rows.length) {
    throw utils.Error(404, 'Could not find BYU_ID');
  }


  if (from_results.rows[0].lookup_number) {
    const change_type = 'D';
    const processed_results = processDeleteFromResults(from_results.rows[0]);
    sql_query = sql.modifyPhone.delete;
    await connection.execute(sql_query, params);
    await logChange(connection, change_type, authorized_byu_id, byu_id, lookup_number, processed_results);
    await phoneDeletedEvents(connection, byu_id, lookup_number, processed_results);
  }
  connection.close();
};
