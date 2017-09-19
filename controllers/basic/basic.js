/*
 * Copyright 2017 Brigham Young University
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

const Enforcer = require('swagger-enforcer');
const moment = require('moment-timezone');
const auth = require('../auth');
const db = require('../db');
const sql = require('./sql');
const utils = require('../utils');
const event = require('../event');

function mapDBResultsToDefinition(definitions, row, name_api_type, basic_api_type) {
  return Enforcer.applyTemplate(definitions.basic, definitions,
    {
      byu_id: row.byu_id,
      person_id: row.person_id || ' ',
      net_id: row.net_id || ' ',
      name_api_type: name_api_type,
      basic_api_type: basic_api_type,
      deceased: /^Y$/g.test(row.deceased),
      sex: row.sex || '?',
      personal_email_address: row.personal_email_address || ' ',
      primary_phone_number: row.primary_phone_number || ' ',
      date_time_updated: row.date_time_updated,
      updated_by_id: row.updated_by_id || ' ',
      updated_by_name: row.updated_by_name || ' ',
      date_time_created: row.date_time_created,
      created_by_id: row.created_by_id || ' ',
      created_by_name: row.created_by_name || ' ',
      first_name: row.first_name || ' ',
      middle_name: row.middle_name || ' ',
      surname: row.surname || ' ',
      suffix: row.suffix || ' ',
      preferred_first_name: row.preferred_first_name || row.first_name,
      preferred_surname: row.preferred_surname || row.surname,
      rest_of_name: row.rest_of_name || `${row.first_name} ${row.middle_name}`,
      name_lnf: row.name_lnf || ' ',
      name_fnf: row.name_fnf || ' ',
      preferred_name: row.preferred_name || `${row.first_name} ${row.surname}`,
      home_town: row.home_town || ' ',
      home_state_code: row.home_state_code || '??',
      home_state_name: row.home_state_name || 'Unknown',
      home_country_code: row.home_country_code || '???',
      home_country_name: row.home_country_name || 'Unknown',
      high_school_code: row.high_school_code || ' ',
      high_school_name: row.high_school_name || ' ',
      high_school_state_code: row.high_school_state_code || '??',
      high_school_state_name: row.high_school_state_name || ' ',
      high_school_city: row.high_school_city || ' ',
      restricted: /^Y$/g.test(row.restricted) || false,
      merge_in_process: /^Y$/g.test(row.merge_in_process) || false
    }
  );
}

function mapDBResultsToStudentDefinition(definitions, row, basic_api_type) {
  return Enforcer.applyTemplate(definitions.basic, definitions,
    {
      byu_id: row.byu_id,
      basic_api_type: basic_api_type,
      unauthorized_api_type: 'unauthorized',
      sex: row.sex,
      preferred_first_name: row.preferred_first_name,
      preferred_surname: row.preferred_surname,
      preferred_name: row.preferred_name,
      home_town: row.home_town,
      home_state_code: row.home_state_code || '??',
      home_state_name: row.home_state_name || '',
      home_country_code: row.home_country_code || '???',
      home_country_name: row.home_country_name || '',
      high_school_code: row.high_school_code || ' ',
      high_school_name: row.high_school_name || ' ',
      high_school_city: row.high_school_city || ' ',
      high_school_state_code: row.high_school_state_code || '??',
      high_school_state_name: row.high_school_state_name || ' '
    }
  );
}

function mapDBResultsToEmployeeDefinition(definitions, row) {
  return Enforcer.applyTemplate(definitions.basic, definitions,
    {
      byu_id: row.byu_id,
      unauthorized_api_type: 'unauthorized',
      sex: row.sex,
      preferred_first_name: row.preferred_first_name || row.first_name,
      preferred_surname: row.preferred_surname || row.surname,
      preferred_name: row.preferred_name || `${row.first_name} ${row.surname}`
    }
  );
}

exports.getBasic = async function getBasic(definitions, byu_id, permissions) {
  const params = [byu_id];
  const sql_query = sql.sql.getBasic;
  const results = await db.execute(sql_query, params);
  const name_api_type = auth.canUpdateBasic(permissions) ? 'modifiable' : 'read-only';
  const basic_api_type = auth.canUpdateBasic(permissions) ? 'modifiable' : 'read-only';

  console.log("Results", results);
  if (!results.rows.length ||
    (results.rows[0].restricted === 'Y' &&
      !auth.hasRestrictedRights(permissions))) {
    throw utils.Error(404, 'BYU_ID Not Found In Person Table')
  }

  if (!auth.canViewBasic(permissions)) {
    if (/^Student$/g.test(results.rows[0].primary_role)) {
      console.log("STUDENT");
      return mapDBResultsToStudentDefinition(definitions, results.rows[0], basic_api_type);
    } else if (/^Employee$/g.test(results.rows[0].primary_role)) {
      console.log("EMPLOYEE");
      return mapDBResultsToEmployeeDefinition(definitions, results.rows[0]);
    }
    throw utils.Error(403, 'Not Authorized To View Address');
  }

  return mapDBResultsToDefinition(definitions, results.rows[0], name_api_type, basic_api_type);
};

function processBody(authorized_byu_id, body) {
  let current_date_time = moment();
  current_date_time = current_date_time.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
  let new_body = {};
  new_body.sex = /^[?FM]$/.test(body.sex) ? body.sex : '?';
  new_body.surname = body.surname || '';
  new_body.first_name = body.first_name || '';
  new_body.preferred_surname = body.preferred_surname || body.surname;
  new_body.preferred_first_name = body.preferred_first_name || body.first_name;
  new_body.preferred_name = `${new_body.preferred_first_name} ${new_body.preferred_surname}`;
  new_body.middle_name = body.middle_name || ' ';
  new_body.suffix = body.suffix || ' ';
  new_body.home_town = body.home_town || ' ';
  new_body.home_state_code = body.home_state_code || '??';
  new_body.home_country_code = body.home_country_code || '???';
  new_body.high_school_code = body.high_school_code || ' ';
  new_body.rest_of_name = new_body.middle_name === ' ' ? new_body.first_name : (
    `${new_body.first_name} ${new_body.middle_name}`);
  new_body.sort_name = new_body.surname + ", " + new_body.rest_of_name;
  new_body.restricted = body.restricted ? 'Y' : 'N';
  new_body.updated_by_id = (!body.updated_by_id || !body.updated_by_id.trim()) ? authorized_byu_id : body.updated_by_id;
  if (!body.date_time_updated || !body.date_time_updated.trim()) {
    new_body.date_time_updated = current_date_time;
  } else {
    new_body.date_time_updated = moment.tz(body.date_time_updated, 'America/Danmarkshavn');
    new_body.date_time_updated = new_body.date_time_updated.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
  }


  let error = false;
  let msg = 'Incorrect BODY: Missing or Invalid';
  if (!new_body.first_name) {
    msg += '\n\tFirst Name';
    error = true;
  }
  if (!new_body.surname) {
    msg += '\n\tSurname';
    error = true;
  }
  if (!utils.isValidCountryCode(new_body.home_country_code)) {
    msg += '\n\tCountry Code if unknown use, ???';
    error = true;
  }
  if (!utils.isValidStateCode(new_body.home_state_code, new_body.home_country_code)) {
    msg += '\n\tState Code if unknown use, ??';
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
  process_results.primary_role = from_results.primary_role;
  process_results.name_fnf = from_results.name_fnf || ' ';
  process_results.from_date_of_birth = from_results.date_of_birth || '';
  process_results.from_deceased = from_results.deceased || ' ';
  process_results.from_date_of_death = from_results.date_of_death || '';
  process_results.from_sex = from_results.sex || ' ';
  process_results.from_marital_status = from_results.marital_status || ' ';
  process_results.from_religion_code = from_results.religion_code || ' ';
  process_results.from_lds_unit_number = from_results.lds_unit_number || ' ';
  process_results.from_citizenship_country_code = from_results.citizenship_country_code || ' ';
  process_results.from_birth_country_code = from_results.birth_country_code || ' ';
  process_results.from_home_town = from_results.home_town || ' ';
  process_results.from_home_state_code = from_results.home_state_code || ' ';
  process_results.from_home_country_code = from_results.home_country_code || ' ';
  process_results.from_high_school_code = from_results.high_school_code || ' ';
  process_results.from_restricted = from_results.restricted || ' ';
  process_results.from_ssn = from_results.ssn || ' ';
  process_results.from_ssn_verification_date = from_results.ssn_verification_date || '';
  process_results.from_visa_type = from_results.visa_type || ' ';
  process_results.from_i20_expiration_date = from_results.i20_expiration_date || '';
  process_results.from_visa_type_source = from_results.visa_type_source || ' ';
  process_results.from_lds_confirmation_date = from_results.lds_confirmation_date || '';
  process_results.date_of_birth = from_results.date_of_birth || '';
  process_results.deceased = from_results.deceased || ' ';
  process_results.date_of_death = from_results.date_of_death || '';
  process_results.marital_status = from_results.marital_status || ' ';
  process_results.religion_code = from_results.religion_code || ' ';
  process_results.lds_unit_number = from_results.lds_unit_number || ' ';
  process_results.citizenship_country_code = from_results.citizenship_country_code || ' ';
  process_results.birth_country_code = from_results.birth_country_code || ' ';
  process_results.ssn = from_results.ssn || ' ';
  process_results.ssn_verification_date = from_results.ssn_verification_date || '';
  process_results.visa_type = from_results.visa_type || ' ';
  process_results.i20_expiration_date = from_results.i20_expiration_date || '';
  process_results.visa_type_source = from_results.visa_type_source || ' ';
  process_results.lds_confirmation_date = from_results.lds_confirmation_date || '';
  process_results.from_surname = from_results.surname || ' ';
  process_results.from_rest_of_name = from_results.rest_of_name || ' ';
  process_results.from_suffix = from_results.suffix || ' ';
  process_results.from_preferred_first_name = from_results.preferred_first_name || ' ';
  process_results.from_preferred_surname = from_results.preferred_surname || ' ';
  process_results.from_preferred_name = from_results.preferred_name || ' ';
  process_results.from_sort_name = from_results.sort_name || ' ';
  process_results.from_first_name = from_results.first_name || ' ';
  process_results.from_middle_name = from_results.middle_name || ' ';
  return process_results;
}

exports.putBasic = async function putBasic(definitions, byu_id, authorized_byu_id, body, permissions) {
  const connection = await db.getConnection();
  const new_body = processBody(authorized_byu_id, body);
  const change_type = 'C';

  let sql_query = sql.sql.fromBasic;
  let params = [
    byu_id
  ];
  const from_results = await connection.execute(sql_query, params);
  if (!from_results.rows.length) {
    throw utils.Error(404, 'Could not find BYU_ID in Person Table');
  }
  if (from_results.rows[0].merge_in_process === 'Y') {
    throw new utils.Error(403, "User not authorized to update PERSON data")
  }

  let processed_body = processFromResults(from_results.rows[0]);
  processed_body.display_name = new_body.preferred_name;
  new_body.created_by_id = from_results.rows[0].created_by_id || new_body.created_by_id;
  new_body.date_time_created = from_results.rows[0].date_time_created || new_body.date_time_created;

  const name_dif = (
    processed_body.from_surname !== new_body.surname ||
    processed_body.from_first_name !== new_body.first_name ||
    processed_body.from_middle_name !== new_body.middle_name);

  if (name_dif && !auth.canUpdateName(permissions)) {
    throw utils.Error(403, 'User not authorized to update name');
  }

  const basic_dif = (
    processed_body.from_home_town !== new_body.home_town ||
    processed_body.from_home_state_code !== new_body.home_state_code ||
    processed_body.from_home_country_code !== new_body.home_country_code ||
    processed_body.from_high_school_code !== new_body.high_school_code ||
    processed_body.from_preferred_surname !== new_body.preferred_surname ||
    processed_body.from_preferred_first_name !== new_body.preferred_first_name ||
    processed_body.from_suffix !== new_body.suffix ||
    processed_body.from_sex !== new_body.sex ||
    processed_body.from_restricted !== new_body.restricted);

  if (basic_dif && !auth.canUpdatePersonBasic(permissions)) {
    throw utils.Error(403, 'User not authorized to update basic');
  }

  if (name_dif || basic_dif) {
    sql_query = sql.modifyBasic.update;
    params = [
      new_body.date_time_updated,
      new_body.updated_by_id,
      new_body.surname,
      new_body.first_name,
      new_body.rest_of_name,
      new_body.preferred_surname,
      new_body.preferred_first_name,
      new_body.preferred_name,
      new_body.sort_name,
      new_body.middle_name,
      new_body.suffix,
      new_body.home_town,
      new_body.home_state_code,
      new_body.home_country_code,
      new_body.high_school_code,
      new_body.sex,
      new_body.restricted,
      byu_id
    ];
    const update_results = await connection.execute(sql_query, params);
    console.log('UPDATE RESULTS', update_results);

    if (name_dif ||
      processed_body.from_preferred_surname !== new_body.preferred_surname ||
      processed_body.from_preferred_first_name !== new_body.preferred_first_name ||
      processed_body.from_suffix !== new_body.suffix) {
      sql_query = sql.modifyBasic.logNameChange;
      const log_name_params = [
        change_type,
        byu_id,
        new_body.date_time_updated,
        new_body.updated_by_id,
        new_body.date_time_created,
        new_body.created_by_id,
        processed_body.from_surname,
        processed_body.from_rest_of_name,
        processed_body.from_suffix,
        processed_body.from_preferred_first_name,
        processed_body.from_preferred_surname,
        processed_body.from_preferred_name,
        processed_body.from_sort_name,
        processed_body.from_first_name,
        processed_body.from_middle_name,
        new_body.surname,
        new_body.rest_of_name,
        new_body.suffix,
        new_body.preferred_first_name,
        new_body.preferred_surname,
        new_body.preferred_name,
        new_body.sort_name,
        new_body.first_name,
        new_body.middle_name
      ];
      const name_change_log_results = await connection.execute(sql_query, log_name_params);
      console.log('NAME CHANGE LOG RESULTS', name_change_log_results);
    }


    if (
      processed_body.from_home_town !== new_body.home_town ||
      processed_body.from_home_state_code !== new_body.home_state_code ||
      processed_body.from_home_country_code !== new_body.home_country_code ||
      processed_body.from_high_school_code !== new_body.high_school_code ||
      processed_body.from_sex !== new_body.sex ||
      processed_body.from_restricted !== new_body.restricted) {
      sql_query = sql.modifyBasic.logPersonalChange;
      const log_personal_params = [
        change_type,
        byu_id,
        new_body.date_time_updated,
        new_body.updated_by_id,
        new_body.date_time_created,
        new_body.created_by_id,
        processed_body.from_date_of_birth,
        processed_body.from_deceased,
        processed_body.from_date_of_death,
        processed_body.from_sex,
        processed_body.from_marital_status,
        processed_body.from_religion_code,
        processed_body.from_lds_unit_number,
        processed_body.from_citizenship_country_code,
        processed_body.from_birth_country_code,
        processed_body.from_home_town,
        processed_body.from_home_state_code,
        processed_body.from_home_country_code,
        processed_body.from_high_school_code,
        processed_body.from_restricted,
        processed_body.from_ssn,
        processed_body.from_ssn_verification_date,
        processed_body.from_visa_type,
        processed_body.from_i20_expiration_date,
        processed_body.from_visa_type_source,
        processed_body.from_lds_confirmation_date,
        processed_body.date_of_birth,
        processed_body.deceased,
        processed_body.date_of_death,
        new_body.sex,
        processed_body.marital_status,
        processed_body.religion_code,
        processed_body.lds_unit_number,
        processed_body.citizenship_country_code,
        processed_body.birth_country_code,
        new_body.home_town,
        new_body.home_state_code,
        new_body.home_country_code,
        new_body.high_school_code,
        new_body.restricted,
        processed_body.ssn,
        processed_body.ssn_verification_date,
        processed_body.visa_type,
        processed_body.i20_expiration_date,
        processed_body.visa_type_source,
        processed_body.lds_confirmation_date
      ];
      return connection.execute(sql_query, log_personal_params);
    }
    connection.commit();

    return personChangedEvents(connection)

  }

  return exports.get(connection, resources, request)
};

async function personDeletedEvents(connection, body, processed_body) {
  try {
    const source_dt = new Date().toISOString();
    const identity_type = 'Person';
    const event_type = "Person Deleted";
    const event_type2 = "Person Deleted v2";
    const domain = "edu.byu";
    const entity = "BYU-IAM";
    let event_frame = {
      "events": {
        "event": []
      }
    };
    let header = [
      "domain",
      domain,
      "entity",
      entity,
      "event_type",
      event_type,
      "source_dt",
      source_dt,
      "event_dt",
      " ",
      "event_id",
      " "
    ];

    let event_body = [
      "person_id",
      body.person_id,
      "byu_id",
      body.byu_id,
      "net_id",
      body.net_id
    ];
    let eventness = event.Builder(header, event_body);
    event_frame.events.event.push(eventness);

    header[5] = event_type2;
    const filters = [
      "identity_type",
      identity_type,
      "employee_type",
      processed_body.employee_type,
      "student_status",
      processed_body.student_status
    ];
    eventness = event.Builder(header, event_body, filters);
    event_frame.events.event.push(eventness);

    let sql_query = db.raiseEvent;
    let params = [JSON.stringify(event_frame)];
    await connection.execute(sql_query, params, { autoCommit: true });

    sql_query = db.enqueue;
    return connection.execute(sql_query, params)
  } catch (error) {
    console.error(error.stack);
    throw new ClientError(207, 'Person Deleted but event not raised');
  }
}