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
const eventy = require('../event');

function mapDBResultsToDefinition(definitions, row, cit_api_type, api_type, ssn_api_type) {
  return Enforcer.applyTemplate(definitions.government_records, definitions,
    {
      cache_date_time: new Date().toISOString(),
      byu_id: row.byu_id,
      name: row.name,
      net_id: row.net_id,
      cit_api_type: cit_api_type,
      api_type: api_type,
      ssn_api_type: ssn_api_type,
      date_time_updated: row.date_time_updated,
      updated_by_id: row.updated_by_id,
      updated_by_name: row.updated_by_name,
      date_time_created: row.date_time_created,
      created_by_id: row.created_by_id,
      created_by_name: row.created_by_name,
      citizenship_country_code: row.citizenship_country_code,
      citizenship_country_name: row.citizenship_country_name,
      birth_country_code: row.birth_country_code,
      birth_country_name: row.birth_country_name,
      ssn: row.ssn,
      ssn_verification_date: row.ssn_verification_date || undefined,
      visa_type: row.visa_type,
      visa_type_source: row.visa_type_source,
      i20_expiration_date: row.i20_expiration_date || undefined
    }
  );
}

function mapPublicDefinition(definitions, row, cit_api_type, api_type) {
  return Enforcer.applyTemplate(definitions.government_records, definitions,
    {
      cache_date_time: new Date().toISOString(),
      byu_id: row.byu_id,
      name: row.name,
      net_id: row.net_id,
      cit_api_type: cit_api_type,
      api_type: api_type,
      date_time_updated: row.date_time_updated,
      updated_by_id: row.updated_by_id,
      date_time_created: row.date_time_created,
      created_by_id: row.created_by_id,
      citizenship_country_code: row.citizenship_country_code,
      citizenship_country_name: row.citizenship_country_name,
      birth_country_code: row.birth_country_code,
      birth_country_name: row.birth_country_name,
      visa_type: row.visa_type,
      visa_type_source: row.visa_type_source,
      i20_expiration_date: row.i20_expiration_date || undefined
    }
  );
}

exports.getGovernmentRecords = async (definitions, byu_id, permissions) => {
  const params = [byu_id];
  const sql_query = sql.sql.getGovernmentRecords;
  const results = await db.execute(sql_query, params);
  const cit_api_type = auth.canUpdateCitizenship(permissions) ? 'modifiable' : 'read-only';
  const api_type = auth.canUpdateBasic(permissions) ? 'modifiable' : 'read-only';
  const ssn_api_type = auth.canUpdateSSN(permissions) ? 'modifiable' : 'read-only';

  console.log("Results", results);
  if (!results.rows.length ||
    (/^Y$/g.test(results.rows[0].restricted) &&
      !auth.hasRestrictedRights(permissions))) {
    throw utils.Error(404, 'BYU_ID Not Found In Person Table')
  }

  if (!auth.canViewBasic(permissions)) {
    throw utils.Error(403, 'Not Authorized To View Personal Records');
  }

  if (!auth.canViewSSN(permissions)) {
    return mapPublicDefinition(definitions, results.rows[0], cit_api_type, api_type)
  }
  return mapDBResultsToDefinition(definitions, results.rows[0], cit_api_type, api_type, ssn_api_type);
};

function processBody(authorized_byu_id, body) {
  let current_date_time = moment();
  current_date_time = current_date_time.clone().tz('America/Denver');
  let new_body = {};
  new_body.citizenship_country_code = body.citizenship_country_code || '???';
  new_body.birth_country_code = body.birth_country_code || '???';
  new_body.ssn = body.ssn || ' ';
  new_body.ssn_verification_date = body.ssn_verification_date || '';
  new_body.visa_type = body.visa_type || ' ';
  new_body.visa_type_source = body.visa_type_source || ' ';
  new_body.i20_expiration_date = body.i20_expiration_date || '';
  new_body.updated_by_id = (!body.updated_by_id || !body.updated_by_id.trim()) ? authorized_byu_id : body.updated_by_id;
  if (!body.date_time_updated || !body.date_time_updated.trim()) {
    new_body.date_time_updated = current_date_time.format('YYYY-MM-DD HH:mm:ss.SSS');
  } else {
    new_body.date_time_updated = moment.tz(body.date_time_updated, 'America/Danmarkshavn');
    new_body.date_time_updated = new_body.date_time_updated.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
  }

  let error = false;
  let msg = `Incorrect BODY:`;
  if (new_body.ssn_verification_date && (moment(new_body.ssn_verification_date, 'YYYY-MM-DD') < moment('2004-01-01', 'YYYY-MM-DD') ||
      moment.tz(new_body.ssn_verification_date, 'YYYY-MM-DD', "America/Denver") > current_date_time.endOf('day'))) {
    msg += `\n\tssn_verification_date must be after 2004 and before tomorrow`;
    error = true;
  }
  if (!utils.isValidCountryCode(new_body.citizenship_country_code)) {
    msg += "\n\tcitizenship_country_code is invalid";
    error = true
  }
  if (!utils.isValidCountryCode(new_body.birth_country_code)) {
    msg += "\n\tbirth_country_code is invalid";
    error = true
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
  console.log('NEW BODY', new_body);
  return new_body;
}

function processFromResults(authorized_byu_id, from_results) {
  let current_date_time = moment();
  let date_time_created = '';
  current_date_time = current_date_time.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
  if (from_results.date_time_created) {
    date_time_created = moment.tz(from_results.date_time_created, 'YYYY-MM-DDTHH:mm:ss.SSSZ', 'America/Danmarkshavn');
    date_time_created = date_time_created.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
  }
  let process_results = {};
  process_results.change_type = 'C';
  process_results.restricted = from_results.restricted || ' ';
  process_results.person_id = from_results.person_id;
  process_results.net_id = from_results.net_id;
  process_results.employee_type = from_results.employee_type;
  process_results.student_status = from_results.student_status;
  process_results.primary_role = from_results.primary_role;
  process_results.preferred_name = from_results.preferred_name || ' ';
  process_results.display_name = from_results.preferred_name;
  process_results.name_fnf = from_results.name_fnf;
  process_results.date_time_created = date_time_created || current_date_time;
  process_results.created_by_id = from_results.created_by_id || authorized_byu_id;
  process_results.date_of_birth = from_results.date_of_birth || '';
  process_results.deceased = from_results.deceased || ' ';
  process_results.date_of_death = from_results.date_of_death || '';
  process_results.sex = from_results.sex || '';
  process_results.marital_status = from_results.marital_status || ' ';
  process_results.religion_code = from_results.religion_code || ' ';
  process_results.lds_unit_number = from_results.lds_unit_number || ' ';
  process_results.from_citizenship_country_code = from_results.citizenship_country_code || ' ';
  process_results.from_birth_country_code = from_results.birth_country_code || ' ';
  process_results.home_town = from_results.home_town || ' ';
  process_results.home_state_code = from_results.home_state_code || ' ';
  process_results.home_country_code = from_results.home_country_code || ' ';
  process_results.high_school_code = from_results.high_school_code || ' ';
  process_results.from_ssn = from_results.ssn || ' ';
  process_results.from_ssn_verification_date = from_results.ssn_verification_date || '';
  process_results.from_visa_type = from_results.visa_type || ' ';
  process_results.from_i20_expiration_date = from_results.i20_expiration_date || '';
  process_results.from_visa_type_source = from_results.visa_type_source || ' ';
  process_results.lds_confirmation_date = from_results.lds_confirmation_date || '';

  return process_results;
}

async function governmentRecordChangedEvents(connection, byu_id, new_body, processed_results) {
  try {
    const source_dt = new Date().toISOString();
    let event_type = "Person Changed";
    let event_type2 = "Person Changed v2";
    const domain = "edu.byu";
    const entity = "BYU-IAM";
    let filters = [];
    const identity_type = "Person";
    const government_records_url = `https://api.byu.edu/byuapi/persons/v1/${byu_id}/government_records`;
    let secure_url = "https://api.byu.edu/domains/legacy/identity/secureurl/v1/";
    let event_frame = {
      "events": {
        "event": []
      }
    };
    const header = [
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
    let sql_query = db.raiseEvent;
    let params = [];
    if (!/^Y$/g.test(processed_results.restricted)) {
      let body = [
        'person_id',
        processed_results.person_id,
        'byu_id',
        byu_id,
        'net_id',
        processed_results.net_id,
        'updated_by_id',
        new_body.updated_by_id,
        'date_time_updated',
        new_body.date_time_updated,
        'created_by_id',
        processed_results.created_by_id,
        'date_time_created',
        processed_results.date_time_created,
        'callback_url',
        government_records_url,
        'surname',
        processed_results.surname,
        'rest_of_name',
        processed_results.rest_of_name,
        'first_name',
        processed_results.first_name,
        'middle_name',
        processed_results.middle_name,
        'suffix',
        processed_results.suffix,
        'preferred_first_name',
        processed_results.preferred_first_name,
        'sort_name',
        processed_results.sort_name,
        'home_town',
        processed_results.home_town,
        'home_state_code',
        processed_results.home_state_code,
        'home_country_code',
        processed_results.home_country_code,
        'deceased',
        processed_results.deceased,
        'sex',
        processed_results.sex,
        'display_name',
        processed_results.display_name,
        'prefix',
        ' ',
        'surname_position',
        ' '
      ];
      let event = eventy.Builder(header, body);
      event_frame.events.event.push(event);

      //start of event v2
      header[5] = event_type2;
      //get rid of prefix and surname position
      for (let i = 6; i--;) {
        body.pop();
      }
      body.unshift(processed_results.preferred_surname);
      body.unshift("preferred_surname");
      body.unshift(processed_results.preferred_name);
      body.unshift("preferred_name");
      body.unshift(processed_results.high_school_code);
      body.unshift("high_school_code");
      filters.push("identity_type");
      filters.push(identity_type);
      filters.push("employee_type");
      filters.push(processed_results.employee_type);
      filters.push("student_status");
      filters.push(processed_results.student_status);
      event = eventy.Builder(header, body, filters);
      event_frame.events.event.push(event);

      if (processed_results.from_ssn !== new_body.ssn) {
        event_type = "SSN Changed";
        header[5] = event_type;
        body = [
          'person_id',
          processed_results.person_id,
          'byu_id',
          byu_id,
          'net_id',
          processed_results.net_id,
          'updated_by_id',
          new_body.updated_by_id,
          'date_time_updated',
          new_body.date_time_updated,
          'created_by_id',
          processed_results.created_by_id,
          'date_time_created',
          processed_results.date_time_created,
          'callback_url',
          government_records_url
        ];
        event = eventy.Builder(header, body);
        event_frame.events.event.push(event);

        event_type2 = "SSN Changed v2";
        header[5] = event_type2;
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event)
      }

      if ((processed_results.from_citizenship_country_code !== "USA") && (new_body.citizenship_country_code === "USA")) {
        event_type = "Person Granted US Citizenship";
        header[5] = event_type;
        body = [
          'person_id',
          processed_results.person_id,
          'byu_id',
          byu_id,
          'net_id',
          processed_results.net_id,
          'citizenship_country_code',
          new_body.citizenship_country_code,
          'updated_by_id',
          new_body.updated_by_id,
          'date_time_updated',
          new_body.date_time_updated,
          'created_by_id',
          processed_results.created_by_id,
          'date_time_created',
          processed_results.date_time_created,
          'callback_url',
          government_records_url
        ];
        event = eventy.Builder(header, body);
        event_frame.events.event.push(event);

        event_type2 = "Person Granted US Citizenship v2";
        header[5] = event_type2;
        body.push('name_lnf');
        body.push(processed_results.sort_name);
        body.push('name_fnf');
        body.push(processed_results.name_fnf);
        body.push('preferred_name');
        body.push(processed_results.preferred_name);
        body.push('surname');
        body.push(processed_results.surname);
        body.push('preferred_surname');
        body.push(processed_results.preferred_surname);
        body.push('rest_of_name');
        body.push(processed_results.rest_of_name);
        body.push('preferred_first_name');
        body.push(processed_results.preferred_first_name);
        body.push('suffix');
        body.push(processed_results.suffix);
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event)
      }

      if ((processed_results.from_citizenship_country_code === "USA") && (new_body.citizenship_country_code !== "USA")) {
        event_type = "Person Un-granted US Citizenship";
        header[5] = event_type;
        body = [
          'person_id',
          processed_results.person_id,
          'byu_id',
          byu_id,
          'net_id',
          processed_results.net_id,
          'citizenship_country_code',
          new_body.citizenship_country_code,
          'updated_by_id',
          new_body.updated_by_id,
          'date_time_updated',
          new_body.date_time_updated,
          'created_by_id',
          processed_results.created_by_id,
          'date_time_created',
          processed_results.date_time_created,
          'callback_url',
          government_records_url
        ];
        event = eventy.Builder(header, body);
        event_frame.events.event.push(event);

        event_type2 = "Person Un-granted US Citizenship v2";
        header[5] = event_type2;
        body.push('name_lnf');
        body.push(processed_results.sort_name);
        body.push('name_fnf');
        body.push(processed_results.name_fnf);
        body.push('preferred_name');
        body.push(processed_results.preferred_name);
        body.push('surname');
        body.push(processed_results.surname);
        body.push('preferred_surname');
        body.push(processed_results.preferred_surname);
        body.push('rest_of_name');
        body.push(processed_results.rest_of_name);
        body.push('preferred_first_name');
        body.push(processed_results.preferred_first_name);
        body.push('suffix');
        body.push(processed_results.suffix);
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event)
      }
    }
    else {
      let body = [
        "person_id",
        " ",
        "byu_id",
        " ",
        "net_id",
        " ",
        "updated_by_id",
        " ",
        "date_time_updated",
        " ",
        "created_by_id",
        " ",
        "date_time_created",
        " ",
        "secure_url",
        secure_url,
        "surname",
        " ",
        "rest_of_name",
        " ",
        "first_name",
        " ",
        "middle_name",
        " ",
        "suffix",
        " ",
        "preferred_first_name",
        " ",
        "sort_name",
        " ",
        "home_town",
        " ",
        "home_state_code",
        " ",
        "home_country_code",
        " ",
        "deceased",
        " ",
        "sex",
        " ",
        "display_name",
        " ",
        "prefix",
        " ",
        "surname_position",
        " "
      ];
      let event = eventy.Builder(header, body);
      event_frame.events.event.push(event);

      //start of event v2
      header[5] = event_type2;
      //get rid of prefix and surname position
      for (let i = 6; i--;) {
        body.pop();
      }
      body.unshift(" ");
      body.unshift("preferred_surname");
      body.unshift(" ");
      body.unshift("preferred_name");
      body.unshift(" ");
      body.unshift("high_school_code");
      filters.push("restricted");
      filters.push(restricted);
      event = eventy.Builder(header, body, filters);
      event_frame.events.event.push(event);

      if (processed_results.from_ssn !== new_body.ssn) {
        event_type = "SSN Changed";
        header[5] = event_type;
        body = [
          "person_id",
          " ",
          "byu_id",
          " ",
          "net_id",
          " ",
          "updated_by_id",
          " ",
          "date_time_updated",
          " ",
          "created_by_id",
          " ",
          "date_time_created",
          " ",
          "secure_url",
          secure_url
        ];
        event = eventy.Builder(header, body);
        event_frame.events.event.push(event);

        event_type2 = "SSN Changed v2";
        header[5] = event_type2;
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event)
      }

      if ((processed_results.from_citizenship_country_code !== "USA") && (new_body.citizenship_country_code === "USA")) {
        event_type = "Person Granted US Citizenship";
        header[5] = event_type;
        body = [
          "person_id",
          " ",
          "byu_id",
          " ",
          "net_id",
          " ",
          "citizenship_country_code",
          " ",
          "updated_by_id",
          " ",
          "date_time_updated",
          " ",
          "created_by_id",
          " ",
          "date_time_created",
          " ",
          "secure_url",
          secure_url
        ];
        event = eventy.Builder(header, body);
        event_frame.events.event.push(event);

        event_type2 = "Person Granted US Citizenship v2";
        header[5] = event_type2;
        body.push("name_lnf");
        body.push(" ");
        body.push("name_fnf");
        body.push(" ");
        body.push("preferred_name");
        body.push(" ");
        body.push("surname");
        body.push(" ");
        body.push("preferred_surname");
        body.push(" ");
        body.push("rest_of_name");
        body.push(" ");
        body.push("preferred_first_name");
        body.push(" ");
        body.push("suffix");
        body.push(" ");
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event)
      }

      if ((processed_results.from_citizenship_country_code === "USA") &&
        (new_body.citizenship_country_code !== "USA")) {
        event_type = "Person Un-granted US Citizenship";
        header[5] = event_type;
        body = [
          "person_id",
          " ",
          "byu_id",
          " ",
          "net_id",
          " ",
          "citizenship_country_code",
          " ",
          "updated_by_id",
          " ",
          "date_time_updated",
          " ",
          "created_by_id",
          " ",
          "date_time_created",
          " ",
          "secure_url",
          secure_url
        ];
        event = eventy.Builder(header, body);
        event_frame.events.event.push(event);

        event_type2 = "Person Un-granted US Citizenship v2";
        header[5] = event_type2;
        body.push("name_lnf");
        body.push(" ");
        body.push("name_fnf");
        body.push(" ");
        body.push("preferred_name");
        body.push(" ");
        body.push("surname");
        body.push(" ");
        body.push("preferred_surname");
        body.push(" ");
        body.push("rest_of_name");
        body.push(" ");
        body.push("preferred_first_name");
        body.push(" ");
        body.push("suffix");
        body.push(" ");
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event)
      }
    }
    params.push(JSON.stringify(event_frame));
    await connection.execute(sql_query, params);

    console.log("ENQUEUE SQL", sql_query);
    console.log("ENQUEUE PARAMS", params);
    sql_query = db.enqueue;
    await connection.execute(sql_query, params)

  } catch (error) {
    console.error(error.stack);
    throw utils.Error(207, 'Government Record Updated, but event raising failed');
  }
}

exports.modifyGovernmentRecords = async (definitions, byu_id, body, authorized_byu_id, permissions) => {
  const connection = await db.getConnection();
  const new_body = processBody(authorized_byu_id, body);
  const can_update_dob = auth.canUpdateDoB(permissions);
  const is_lds_sync = auth.canIsLdsSync(permissions);
  const can_update_rel = auth.canUpdateReligion(permissions);

  if (!auth.canUpdateBasic(permissions) && !auth.canIsLdsSync(permissions)) {
    throw utils.Error(403, `User not authorized to update PERSON data`);
  }

  let sql_query = sql.sql.getGovernmentRecords;
  let params = [byu_id];
  const from_results = await connection.execute(sql_query, params);
  if (!from_results.rows.length ||
    (/^Y$/g.test(from_results.rows[0].restricted) &&
      !auth.hasRestrictedRights(permissions))) {
    throw utils.Error(404, 'Could not find BYU_ID in Person Table');
  }


  let processed_body = processFromResults(authorized_byu_id, from_results.rows[0]);

  const cit_c_dif = (new_body.citizenship_country_code !== processed_body.from_citizenship_country_code);
  const ssn_dif = (new_body.ssn !== processed_body.from_ssn ||
    new_body.ssn_verification_date !== processed_body.from_ssn_verification_date);
  const basic_dif = (new_body.visa_type !== processed_body.from_visa_type ||
    new_body.visa_type_source !== processed_body.from_visa_type_source ||
    new_body.i20_expiration_date !== processed_body.from_i20_expiration_date ||
    new_body.birth_country_code !== processed_body.from_birth_country_code);

  let error = false;
  let msg = '';
  if (cit_c_dif && !auth.canUpdateCitizenship(permissions)) {
    msg += `Not Authorized to update citizenship`;
    error = true;
  }
  if (ssn_dif && !auth.canUpdateSSN(permissions)) {
    msg += `Not Authorized to update SSN or SSN verification date`;
    error = true;
  }
  if (error) {
    throw utils.Error(403, msg);
  }

  if (cit_c_dif || ssn_dif || basic_dif) {
    sql_query = sql.modifyGovernmentRecords.update;
    params = [
      new_body.date_time_updated,
      new_body.updated_by_id,
      new_body.citizenship_country_code,
      new_body.birth_country_code,
      new_body.ssn,
      new_body.ssn_verification_date,
      new_body.visa_type,
      new_body.visa_type_source,
      new_body.i20_expiration_date,
      byu_id
    ];
    console.log(sql_query);
    console.log(params);
    await connection.execute(sql_query, params);
    sql_query = sql.modifyGovernmentRecords.logChange;
    let log_params = [
      processed_body.change_type,
      byu_id,
      new_body.date_time_updated,
      new_body.updated_by_id,
      processed_body.date_time_created,
      processed_body.created_by_id,
      processed_body.date_of_birth,
      processed_body.deceased,
      processed_body.date_of_death,
      processed_body.sex,
      processed_body.marital_status,
      processed_body.religion_code,
      processed_body.lds_unit_number,
      processed_body.from_citizenship_country_code,
      processed_body.from_birth_country_code,
      processed_body.home_town,
      processed_body.home_state_code,
      processed_body.home_country_code,
      processed_body.high_school_code,
      processed_body.restricted,
      processed_body.from_ssn,
      processed_body.from_ssn_verification_date,
      processed_body.from_visa_type,
      processed_body.from_i20_expiration_date,
      processed_body.from_visa_type_source,
      processed_body.lds_confirmation_date,
      processed_body.date_of_birth,
      processed_body.deceased,
      processed_body.date_of_death,
      processed_body.sex,
      processed_body.marital_status,
      processed_body.religion_code,
      processed_body.lds_unit_number,
      new_body.citizenship_country_code,
      new_body.birth_country_code,
      processed_body.home_town,
      processed_body.home_state_code,
      processed_body.home_country_code,
      processed_body.high_school_code,
      processed_body.restricted,
      new_body.ssn,
      new_body.ssn_verification_date,
      new_body.visa_type,
      new_body.i20_expiration_date,
      new_body.visa_type_source,
      processed_body.lds_confirmation_date,
    ];
    console.log(sql_query);
    console.log(log_params);
    await connection.execute(sql_query, log_params, { autoCommit: true });
    await governmentRecordChangedEvents(connection, byu_id, new_body, processed_body);
  }
  connection.close();

  params = [byu_id];
  sql_query = sql.sql.getGovernmentRecords;
  const results = await db.execute(sql_query, params);
  const cit_api_type = auth.canUpdateCitizenship(permissions) ? 'modifiable' : 'read-only';
  const api_type = auth.canUpdateBasic(permissions) ? 'modifiable' : 'read-only';
  const ssn_api_type = auth.canUpdateSSN(permissions) ? 'modifiable' : 'read-only';

  if (!auth.canViewSSN(permissions)) {
    return mapPublicDefinition(definitions, results.rows[0], cit_api_type, api_type)
  }
  return mapDBResultsToDefinition(definitions, results.rows[0], cit_api_type, api_type, ssn_api_type);
};
