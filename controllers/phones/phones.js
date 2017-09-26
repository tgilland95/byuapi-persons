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
const PhoneNumber = require("awesome-phonenumber");

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

function GetIsoCode(country_code) {
  if (/^([?]{3}|UK|HK|EL|CW|SX|[A-Z]{3})$/.test(country_code)) {
    const country_codes = require("../../meta/countries/countryCodes.json");

    for (let i = country_codes.items.length; i--;) {
      if (country_code === country_codes.items[i].country_code) {
        return country_codes.items[i].iso_code;
      }
    }
  }
}

function processBody(authorized_byu_id, body, lookup_number) {
  let current_date_time = moment();
  current_date_time = current_date_time.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
  let new_body = {};
  new_body.country_code = body.country_code;
  new_body.phone_number = body.phone_number || lookup_number;
  new_body.cell_flag = body.cell_flag ? 'Y' : 'N';
  new_body.time_code = body.time_code || 'Mountain';
  new_body.texts_okay = body.texts_okay ? 'Y' : 'N';
  new_body.unlisted = body.unlisted ? 'Y' : 'N';
  new_body.primary_flag = body.primary_flag ? 'Y' : 'N';
  new_body.tty = body.tty ? 'Y' : 'N';
  new_body.verified_flag = body.verified_flag ? 'Y' : 'N';
  new_body.work_flag = body.work_flag ? 'Y' : 'N';
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

  if (!utils.isValidCountryCode(new_body.country_code)) {
    msg += '\n\tInvalid Country Code if unknown use, ???';
    error = true;
  }

  if (new_body.phone_number.replace(/\D/g, '') !== lookup_number) {
    msg += `\n\tphone_number digits do not match url lookup number`;
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

  const pn = new PhoneNumber(new_body.phone_number, GetIsoCode(new_body.country_code));
  const valid = pn.isValid();
  const mobile = pn.isMobile();
  if (valid) {
    new_body.phone_number = pn.a.number.national;
    if (/^(USA|CAN)$/.test(new_body.country_code)) {
      new_body.phone_number = new_body.phone_number.replace(/\D/g, '').replace(/([0-9]{3})([0-9]{3})([0-9]{4}$)/gi, '$1-$2-$3');
    }
  }
  else {
    new_body.texts_okay = 'N';
  }
  if (mobile) {
    new_body.cell_flag = 'Y';
  }

  return new_body;
}

function processFromResults(from_results) {
  let process_results = {};
  process_results.person_id = from_results.person_id || ' ';
  process_results.net_id = from_results.net_id || ' ';
  process_results.employee_type = /[^-]/.test(from_results.employee_type) ? from_results.employee_type : 'Not An Employee';
  process_results.student_status = from_results.student_status;
  process_results.restricted = from_results.restricted || '';
  process_results.country_code = from_results.country_code || ' ';
  process_results.cell_flag = from_results.cell_flag || ' ';
  process_results.time_code = from_results.time_code || ' ';
  process_results.texts_okay = from_results.texts_okay || ' ';
  process_results.unlisted = from_results.unlisted || ' ';
  process_results.primary_flag = from_results.primary_flag || ' ';
  process_results.tty = from_results.tty || ' ';
  process_results.verified_flag = from_results.verified_flag || ' ';
  process_results.work_flag = from_results.work_flag || ' ';
  process_results.phone_number = from_results.phone_number || ' ';

  return process_results;
}

async function logChange(connection, change_type, authorized_byu_id, byu_id, lookup_number, processed_results, new_body) {
  const sql_query = sql.modifyPhone.logChange;

  let log_params = [];
  if (/^D$/.test(change_type)) {
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
      processed_results.from_phone_number,
      processed_results.from_country_code,
      processed_results.from_cell_flag,
      processed_results.from_time_code,
      processed_results.from_texts_okay,
      processed_results.from_unlisted,
      processed_results.from_primary_flag,
      processed_results.from_tty,
      processed_results.from_verified_flag,
      processed_results.from_work_flag,
      processed_results.phone_number,
      processed_results.country_code,
      processed_results.cell_flag,
      processed_results.time_code,
      processed_results.texts_okay,
      processed_results.unlisted,
      processed_results.primary_flag,
      processed_results.tty,
      processed_results.verified_flag,
      processed_results.work_flag
    ];
  } else if (/^[AC]$/.test(change_type)) {
    log_params = [
      change_type,
      byu_id,
      lookup_number,
      new_body.date_time_updated,
      new_body.updated_by_id,
      new_body.date_time_created,
      new_body.created_by_id,
      processed_results.phone_number,
      processed_results.country_code,
      processed_results.cell_flag,
      processed_results.time_code,
      processed_results.texts_okay,
      processed_results.unlisted,
      processed_results.primary_flag,
      processed_results.tty,
      processed_results.verified_flag,
      processed_results.work_flag,
      new_body.phone_number,
      new_body.country_code,
      new_body.cell_flag,
      new_body.time_code,
      new_body.texts_okay,
      new_body.unlisted,
      new_body.primary_flag,
      new_body.tty,
      new_body.verified_flag,
      new_body.work_flag
    ];
  }
  console.log('LOG PARAMS', log_params);
  return connection.execute(sql_query, log_params, { autoCommit: true });
}

async function phoneEvents(connection, change_type, byu_id, lookup_number, new_body, processed_results) {
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
    if (!/^Y$/.test(processed_results.restricted) && !/^Y$/.test(new_body.unlisted)) {
      let event_body = [
        'person_id',
        processed_results.person_id,
        'byu_id',
        byu_id,
        'net_id',
        processed_results.net_id,
        'lookup_number',
        lookup_number,
        'phone_number',
        new_body.phone_number,
        'cell_flag',
        /^Y$/.test(new_body.cell_flag),
        'time_code',
        new_body.time_code,
        'texts_okay',
        /^Y$/.test(new_body.texts_okay),
        'country_code',
        new_body.country_code,
        'primary_flag',
        /^Y$/.test(new_body.primary_flag),
        'tty',
        /^Y$/.test(new_body.tty),
        'unlisted',
        /^Y$/.test(new_body.unlisted),
        'work_flag',
        /^Y$/.test(new_body.work_flag),
        'verified_flag',
        /^Y$/.test(new_body.verified_flag),
        'updated_by_id',
        new_body.updated_by_id,
        'date_time_updated',
        new_body.date_time_updated,
        'created_by_id',
        new_body.created_by_id,
        "date_time_created",
        new_body.date_time_created,
        'callback_url',
        phone_url
      ];
      eventness = event.Builder(header, event_body);
      event_frame.events.event.push(eventness);

      header[5] = event_type2;
      event_body.push('verified_flag');
      event_body.push(body.verified_flag);
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
    } else {
      sql_query = db.intermediaryId.get;
      params = [phone_url];
      let results = await connection.execute(sql_query, params);
      if (!results.rows.length) {
        sql_query = db.intermediaryId.put;
        params = [
          phone_url,
          ' ',    // actor
          ' ',    // group_id
          new_body.created_by_id
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
        'phone_number',
        ' ',
        'cell_flag',
        ' ',
        'time_code',
        ' ',
        'texts_okay',
        ' ',
        'country_code',
        ' ',
        'primary_flag',
        ' ',
        'tty',
        ' ',
        'unlisted',
        /^Y$/.test(new_body.unlisted),
        'work_flag',
        ' ',
        'verified_flag',
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
      eventness = event.Builder(header, restricted_body);
      event_frame.events.event.push(eventness);

      header[5] = event_type2;
      restricted_body.push('verified_flag');
      restricted_body.push(' ');
      filters.push('restricted');
      filters.push(new_body.restricted);
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
  const new_body = processBody(authorized_byu_id, body, lookup_number);
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
    new_body.cell_flag !== processed_results.cell_flag ||
    new_body.time_code !== processed_results.time_code ||
    new_body.texts_okay !== processed_results.texts_okay ||
    new_body.country_code !== processed_results.country_code ||
    new_body.primary_flag !== processed_results.primary_flag ||
    new_body.tty !== processed_results.tty ||
    new_body.unlisted !== processed_results.unlisted ||
    new_body.verified_flag !== processed_results.verified_flag ||
    new_body.work_flag !== processed_results.work_flag ||
    new_body.phone_number !== processed_results.phone_number);

  if (is_different) {
    if (!from_results.rows[0].lookup_number) {
      sql_query = sql.modifyPhone.create;
      params = [
        byu_id,
        new_body.phone_number,
        new_body.country_code,
        new_body.date_time_updated,
        new_body.updated_by_id,
        new_body.date_time_created,
        new_body.created_by_id,
        new_body.cell_flag,
        new_body.time_code,
        new_body.texts_okay,
        new_body.unlisted,
        new_body.primary_flag,
        new_body.tty,
        new_body.verified_flag,
        new_body.work_flag,
        lookup_number
      ];
    } else {
      sql_query = sql.modifyPhone.update;
      params = [
        new_body.date_time_updated,
        new_body.updated_by_id,
        new_body.cell_flag,
        new_body.time_code,
        new_body.texts_okay,
        new_body.country_code,
        new_body.primary_flag,
        new_body.tty,
        new_body.unlisted,
        new_body.verified_flag,
        new_body.work_flag,
        new_body.phone_number,
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
  processed_results.from_country_code = from_results.country_code || ' ';
  processed_results.from_cell_flag = from_results.cell_flag || ' ';
  processed_results.from_time_code = from_results.time_code || ' ';
  processed_results.from_texts_okay = from_results.texts_okay || ' ';
  processed_results.from_unlisted = from_results.unlisted || ' ';
  processed_results.from_primary_flag = from_results.primary_flag || ' ';
  processed_results.from_tty = from_results.tty || ' ';
  processed_results.from_verified_flag = from_results.verified_flag || ' ';
  processed_results.from_work_flag = from_results.work_flag || ' ';
  processed_results.from_phone_number = from_results.phone_number || ' ';
  processed_results.country_code = " ";
  processed_results.cell_flag = " ";
  processed_results.time_code = " ";
  processed_results.texts_okay = " ";
  processed_results.unlisted = " ";
  processed_results.primary_flag = " ";
  processed_results.tty = " ";
  processed_results.verified_flag = " ";
  processed_results.work_flag = " ";
  processed_results.phone_number = ' ';

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
