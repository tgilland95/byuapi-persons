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

function mapDBResultsToDefinition(definitions, row, birth_api_type, death_api_type, lds_api_type, rel_api_type) {
  return Enforcer.applyTemplate(definitions.personal_records, definitions,
    {
      cache_date_time: new Date().toISOString(),
      byu_id: row.byu_id,
      name: row.name,
      net_id: row.net_id,
      birth_api_type: (row.date_of_birth && birth_api_type === 'read-only') ? 'read-only' : 'modifiable',
      death_api_type: death_api_type,
      lds_api_type: (/^ $/g.test(row.lds_unit_number) || lds_api_type === 'modifiable') ? 'modifiable' : 'read-only',
      rel_api_type: (/^LDS$/g.test(row.religion_code) && rel_api_type === 'read-only') ? 'read-only' : 'modifiable',
      api_type: 'modifiable',
      date_time_updated: row.date_time_updated,
      updated_by_id: row.updated_by_id,
      updated_by_name: row.updated_by_name,
      date_time_created: row.date_time_created,
      created_by_id: row.created_by_id,
      created_by_name: row.created_by_name,
      date_of_birth: row.date_of_birth || undefined,
      date_of_death: row.date_of_death || undefined,
      deceased: /^Y$/g.test(row.deceased),
      sex: row.sex,
      lds_unit_number: row.lds_unit_number,
      lds_unit_name: row.lds_unit_name || undefined,
      parent_lds_unit_number: row.parent_lds_unit_number || undefined,
      parent_lds_unit_name: row.parent_lds_unit_name || undefined,
      lds_confirmation_date: row.lds_confirmation_date || undefined,
      religion_code: row.religion_code,
      religion_name: row.religion_name || undefined,
      marital_status: row.marital_status,
      marital_status_desc: row.marital_status_description
    }
  );
}

exports.getPersonalRecords = async function getBasic(definitions, byu_id, permissions) {
  const params = [byu_id];
  const sql_query = sql.sql.getPersonalRecords;
  const results = await db.execute(sql_query, params);
  const vital_api_type = auth.canUpdateDoB(permissions) ? 'modifiable' : 'read-only';
  const lds_api_type = auth.canIsLdsSync(permissions) ? 'modifiable' : 'read-only';
  const rel_api_type = auth.canUpdateReligion(permissions) ? 'modifiable' : 'read-only';

  console.log("Results", results);
  if (!results.rows.length ||
    (results.rows[0].restricted === 'Y' &&
      !auth.hasRestrictedRights(permissions))) {
    throw utils.Error(404, 'BYU_ID Not Found In Person Table')
  }

  if (!auth.canViewBasic(permissions)) {
    throw utils.Error(403, 'Not Authorized To View Personal Records');
  }

  return mapDBResultsToDefinition(definitions, results.rows[0], vital_api_type, vital_api_type, lds_api_type, rel_api_type);
};

function processBody(authorized_byu_id, body) {
  let current_date_time = moment();
  current_date_time = current_date_time.clone().tz('America/Denver');
  let new_body = {};
  new_body.religion_code = body.religion_code || '???';
  new_body.lds_unit_number = body.lds_unit_number || ' ';
  new_body.lds_confirmation_date = body.lds_confirmation_date || '';
  new_body.date_of_birth = body.date_of_birth || '';
  new_body.date_of_death = body.date_of_death || '';
  new_body.deceased = (!body.deceased && !body.date_of_death) ? 'N' : 'Y';
  new_body.marital_status = body.marital_status || '?';
  new_body.updated_by_id = (!body.updated_by_id || !body.updated_by_id.trim()) ? authorized_byu_id : body.updated_by_id;
  if (!body.date_time_updated || !body.date_time_updated.trim()) {
    new_body.date_time_updated = current_date_time.format('YYYY-MM-DD HH:mm:ss.SSS');
  } else {
    new_body.date_time_updated = moment.tz(body.date_time_updated, 'America/Danmarkshavn');
    new_body.date_time_updated = new_body.date_time_updated.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
  }

  let error = false;
  let msg = `Invalid Body:`;
  if (new_body.date_of_birth && (moment.tz(new_body.date_of_birth, 'YYYY-MM-DD', 'America/Denver') > current_date_time.endOf('day') ||
      moment(new_body.date_of_birth, 'YYYY-MM-DD') < moment('1850-01-01', 'YYYY-MM-DD'))) {
    msg += `\n\tdate_of_birth must be after 1850 and before tomorrow`;
    error = true;
  }

  if (new_body.date_of_death && (moment(new_body.date_of_death, 'YYYY-MM-DD', 'America/Denver') > current_date_time.endOf('day') ||
      moment(new_body.date_of_death, 'YYYY-MM-DD') < moment(new_body.date_of_birth, 'YYYY-MM-DD'))) {
    msg += `\n\tdate_of_death must be after date_of_birth and before tomorrow`;
    error = true;
  }

  if (new_body.lds_confirmation_date && (moment.tz(new_body.lds_confirmation_date, 'YYYY-MM-DD', 'America/Denver') > current_date_time.endOf('day') ||
      (new_body.date_of_birth && moment(new_body.lds_confirmation_date, 'YYYY-MM-DD') < moment(new_body.date_of_birth, 'YYYY-MM-DD').add(8, 'years')))) {
    msg += `\n\tlds_confirmation_date must be after 8th birthday and before tomorrow`;
    error = true;
  }

  if (!utils.isValidReligionCode(new_body.religion_code)) {
    msg += `\n\t${new_body.religion_code} is an invalid religion code.`;
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
  process_results.person_id = from_results.person_id;
  process_results.net_id = from_results.net_id;
  process_results.employee_type = from_results.employee_type;
  process_results.student_status = from_results.student_status;
  process_results.restricted = from_results.restricted || ' ';
  process_results.primary_role = from_results.primary_role;
  process_results.preferred_name = from_results.preferred_name || ' ';
  process_results.display_name = from_results.preferred_name;
  process_results.from_lds_confirmation_date = from_results.lds_confirmation_date || '';
  process_results.from_deceased = from_results.deceased || ' ';
  process_results.from_religion_code = from_results.religion_code || ' ';
  process_results.from_lds_unit_number = from_results.lds_unit_number || ' ';
  process_results.date_time_created = date_time_created || current_date_time;
  process_results.created_by_id = from_results.created_by_id || authorized_byu_id;
  process_results.from_date_of_birth = from_results.date_of_birth || '';
  process_results.from_date_of_death = from_results.date_of_death || '';
  process_results.sex = from_results.sex || '';
  process_results.from_marital_status = from_results.marital_status || ' ';
  process_results.citizenship_country_code = from_results.citizenship_country_code || ' ';
  process_results.birth_country_code = from_results.birth_country_code || ' ';
  process_results.home_town = from_results.home_town || ' ';
  process_results.home_state_code = from_results.home_state_code || ' ';
  process_results.home_country_code = from_results.home_country_code || ' ';
  process_results.high_school_code = from_results.high_school_code || ' ';
  process_results.ssn = from_results.ssn || ' ';
  process_results.ssn_verification_date = from_results.ssn_verification_date || '';
  process_results.visa_type = from_results.visa_type || ' ';
  process_results.i20_expiration_date = from_results.i20_expiration_date || '';
  process_results.visa_type_source = from_results.visa_type_source || ' ';

  return process_results;
}

async function personalRecordChangedEvents(connection, byu_id, new_body, processed_results) {
  try {
    const source_dt = new Date().toISOString();
    let event_type = 'Person Changed';
    let event_type2 = 'Person Changed v2';
    const domain = 'edu.byu';
    const entity = 'BYU-IAM';
    let filters = [];
    const identity_type = 'Person';
    const personal_records_url = `https://api.byu.edu/byuapi/persons/v1/${byu_id}/personal_records`;
    let secure_url = `https://api.byu.edu/domains/legacy/identity/secureurl/v1/`;
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
        personal_records_url,
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
      body.unshift('preferred_surname');
      body.unshift(processed_results.preferred_name);
      body.unshift('preferred_name');
      body.unshift(processed_results.high_school_code);
      body.unshift('high_school_code');
      filters.push('identity_type');
      filters.push(identity_type);
      filters.push('employee_type');
      filters.push(processed_results.employee_type);
      filters.push('student_status');
      filters.push(processed_results.student_status);
      event = eventy.Builder(header, body, filters);
      event_frame.events.event.push(event);

      if (processed_results.from_date_of_birth !== new_body.date_of_birth) {
        event_type = 'Birthday Changed';
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
          personal_records_url
        ];
        event = eventy.Builder(header, body);
        event_frame.events.event.push(event);

        event_type2 = 'Birthday Changed v2';
        header[5] = event_type2;
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event)
      }

      //deceased is set to yes if date_of_death is not null
      if (!/^Y$/g.test(processed_results.from_deceased) &&
        /^Y$/g.test(new_body.deceased)) {
        event_type = 'Person Deceased';
        header[5] = event_type;
        body = [
          'person_id',
          processed_results.person_id,
          'byu_id',
          byu_id,
          'net_id',
          processed_results.net_id,
          'deceased',
          new_body.deceased,
          'date_of_death',
          new_body.date_of_death,
          'updated_by_id',
          new_body.updated_by_id,
          'date_time_updated',
          new_body.date_time_updated,
          'created_by_id',
          processed_results.created_by_id,
          'date_time_created',
          processed_results.date_time_created,
          'callback_url',
          personal_records_url
        ];
        event = eventy.Builder(header, body);
        event_frame.events.event.push(event);

        event_type2 = 'Person Deceased v2';
        header[5] = event_type2;
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event)
      }

      if (
        (/^Y$/g.test(processed_results.from_deceased) ||
          processed_results.from_date_of_death) &&
        !/^Y$/g.test(new_body.deceased)) {
        event_type = 'Person Un-deceased';
        header[5] = event_type;
        body = [
          'person_id',
          processed_results.person_id,
          'byu_id',
          byu_id,
          'net_id',
          processed_results.net_id,
          'deceased',
          new_body.deceased,
          'updated_by_id',
          new_body.updated_by_id,
          'date_time_updated',
          new_body.date_time_updated,
          'created_by_id',
          processed_results.created_by_id,
          'date_time_created',
          processed_results.date_time_created,
          'callback_url',
          personal_records_url
        ];
        event = eventy.Builder(header, body);
        event_frame.events.event.push(event);

        event_type2 = 'Person Un-deceased v2';
        header[5] = event_type2;
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event)
      }

      if (!/^M$/g.test(processed_results.from_marital_status) &&
        /^M$/g.test(new_body.marital_status)) {
        event_type = 'Person Married';
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
          personal_records_url
        ];
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event);

        if (/^(Employee|Faculty)$/g.test(processed_results.primary_role) &&
          /(?=.*?-FT-)/g.test(processed_results.employee_type)) {
          event_type2 = 'Full-time Employee Married';
          header[5] = event_type2;
          event = eventy.Builder(header, body);
          event_frame.events.event.push(event)
        }
        if (/^Student$/g.test(processed_results.primary_role)) {
          event_type2 = 'Student Married';
          header[5] = event_type2;
          event = eventy.Builder(header, body);
          event_frame.events.event.push(event)
        }

      }

      if (/^M$/g.test(processed_results.from_marital_status) &&
        !/^M$/g.test(new_body.marital_status)) {
        event_type = 'Person Un-married';
        header[5] = event_type;
        body = [];
        body.push('secure_url');
        body.push(secure_url);
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event);

        if (/^(Employee|Faculty)$/g.test(processed_results.primary_role) &&
          /(?=.*?-FT-)/g.test(processed_results.employee_type)) {
          event_type2 = 'Full-time Employee Un-married';
          header[5] = event_type2;
          event = eventy.Builder(header, body);
          event_frame.events.event.push(event)
        }
        if (/^Student$/g.test(processed_results.primary_role)) {
          event_type2 = 'Student Un-married';
          header[5] = event_type2;
          event = eventy.Builder(header, body);
          event_frame.events.event.push(event)
        }

      }
      if (!/^LDS$/g.test(processed_results.from_religion_code) &&
        /^LDS$/g.test(new_body.religion_code)) {
        event_type = 'Person Converted to LDS';
        header[5] = event_type;
        body = [];
        body.push('secure_url');
        body.push(secure_url);
        event = eventy.Builder(header, body);
        event_frame.events.event.push(event);

        event_type2 = 'Person Converted to LDS v2';
        header[5] = event_type2;
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event)
      }

      if (/^LDS$/g.test(processed_results.from_religion_code) &&
        !/^LDS$/g.test(new_body.religion_code)) {
        event_type = 'Person Converted from LDS';
        header[5] = event_type;
        body = [];
        body.push('secure_url');
        body.push(secure_url);
        event = eventy.Builder(header, body);
        event_frame.events.event.push(event);

        event_type2 = 'Person Converted from LDS v2';
        header[5] = event_type2;
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event)
      }

      if (processed_results.from_lds_unit_number !== new_body.lds_unit_number) {
        event_type = 'LDS Unit Changed';
        header[5] = event_type;
        body = [
          'person_id',
          processed_results.person_id,
          'byu_id',
          byu_id,
          'net_id',
          processed_results.net_id,
          'lds_unit_number',
          new_body.lds_unit_number,
          'updated_by_id',
          new_body.updated_by_id,
          'date_time_updated',
          new_body.date_time_updated,
          'created_by_id',
          processed_results.created_by_id,
          'date_time_created',
          processed_results.date_time_created,
          'callback_url',
          personal_records_url,
          secure_url
        ];
        event = eventy.Builder(header, body);
        event_frame.events.event.push(event);

        event_type2 = 'LDS Unit Changed v2';
        header[5] = event_type2;
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event)
      }
    }
    else {
      let body = [
        'person_id',
        ' ',
        'byu_id',
        ' ',
        'net_id',
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
        secure_url,
        'surname',
        ' ',
        'rest_of_name',
        ' ',
        'first_name',
        ' ',
        'middle_name',
        ' ',
        'suffix',
        ' ',
        'preferred_first_name',
        ' ',
        'sort_name',
        ' ',
        'home_town',
        ' ',
        'home_state_code',
        ' ',
        'home_country_code',
        ' ',
        'deceased',
        ' ',
        'sex',
        ' ',
        'display_name',
        ' ',
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
      body.unshift(' ');
      body.unshift('preferred_surname');
      body.unshift(' ');
      body.unshift('preferred_name');
      body.unshift(' ');
      body.unshift('high_school_code');
      filters.push('restricted');
      filters.push(processed_results.restricted);
      event = eventy.Builder(header, body, filters);
      event_frame.events.event.push(event);

      if (processed_results.from_date_of_birth !== new_body.date_of_birth) {
        event_type = 'Birthday Changed';
        header[5] = event_type;
        body = [
          'person_id',
          ' ',
          'byu_id',
          ' ',
          'net_id',
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
        event = eventy.Builder(header, body);
        event_frame.events.event.push(event);

        event_type2 = 'Birthday Changed v2';
        header[5] = event_type2;
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event)
      }

      //deceased is set to yes if date_of_death is not null
      if (!/^Y$/g.test(processed_results.from_deceased) &&
        /^Y$/g.test(new_body.deceased)) {
        event_type = 'Person Deceased';
        header[5] = event_type;
        body = [
          'person_id',
          ' ',
          'byu_id',
          ' ',
          'net_id',
          ' ',
          'deceased',
          ' ',
          'date_of_death',
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
        event = eventy.Builder(header, body);
        event_frame.events.event.push(event);

        event_type2 = 'Person Deceased v2';
        header[5] = event_type2;
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event)
      }

      if ((/^Y$/g.test(processed_results.from_deceased) ||
          new_body.from_date_of_death) &&
        /^N$/g.test(new_body.deceased)) {
        event_type = 'Person Un-deceased';
        header[5] = event_type;
        body = [
          'person_id',
          ' ',
          'byu_id',
          ' ',
          'net_id',
          ' ',
          'deceased',
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
        event = eventy.Builder(header, body);
        event_frame.events.event.push(event);

        event_type2 = 'Person Un-deceased v2';
        header[5] = event_type2;
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event)
      }

      if (!/^M$/g.test(processed_results.from_marital_status) &&
        /^M$/g.test(new_body.marital_status)) {
        event_type = 'Person Married';
        header[5] = event_type;
        body = [
          'person_id',
          ' ',
          'byu_id',
          ' ',
          'net_id',
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
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event);

        if (/^(Employee|Faculty)$/g.test(processed_results.primary_role) &&
          /(?=.*?-FT-)/g.test(processed_results.employee_type)) {
          event_type2 = 'Full-time Employee Married';
          header[5] = event_type2;
          event = eventy.Builder(header, body);
          event_frame.events.event.push(event)
        }
        if (/^Student$/g.test(processed_results.primary_role)) {
          event_type2 = 'Student Married';
          header[5] = event_type2;
          event = eventy.Builder(header, body);
          event_frame.events.event.push(event)
        }

      }

      if (/^M$/g.test(processed_results.from_marital_status) &&
        !/^M$/g.test(new_body.marital_status)) {
        event_type = 'Person Un-married';
        header[5] = event_type;
        body = [
          'secure_url',
          secure_url
        ];
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event);

        if (/^(Employee|Faculty)$/g.test(processed_results.primary_role) &&
          /(?=.*?-FT-)/g.test(processed_results.employee_type)) {
          event_type2 = 'Full-time Employee Un-married';
          header[5] = event_type2;
          event = eventy.Builder(header, body);
          event_frame.events.event.push(event)
        }
        if (/^Student$/g.test(processed_results.primary_role)) {
          event_type2 = 'Student Un-married';
          header[5] = event_type2;
          event = eventy.Builder(header, body);
          event_frame.events.event.push(event)
        }

      }
      if (!/^LDS$/g.test(processed_results.from_religion_code) &&
        /^LDS$/g.test(new_body.religion_code)) {
        event_type = 'Person Converted to LDS';
        header[5] = event_type;
        body = [
          'secure_url',
          secure_url
        ];
        event = eventy.Builder(header, body);
        event_frame.events.event.push(event);

        event_type2 = 'Person Converted to LDS v2';
        header[5] = event_type2;
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event)
      }

      if (/^LDS$/g.test(processed_results.from_religion_code) &&
        !/^LDS$/g.test(new_body.religion_code)) {
        event_type = 'Person Converted from LDS';
        header[5] = event_type;
        body = [
          'secure_url',
          secure_url
        ];
        event = eventy.Builder(header, body);
        event_frame.events.event.push(event);

        event_type2 = 'Person Converted from LDS v2';
        header[5] = event_type2;
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event)
      }

      if (processed_results.from_lds_unit_number !== new_body.lds_unit_number) {
        event_type = 'LDS Unit Changed';
        header[5] = event_type;
        body = [
          'person_id',
          ' ',
          'byu_id',
          ' ',
          'net_id',
          ' ',
          'lds_unit_number',
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
        event = eventy.Builder(header, body);
        event_frame.events.event.push(event);

        event_type2 = 'LDS Unit Changed v2';
        header[5] = event_type2;
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
    throw utils.Error(207, 'Personal Record Updated, but event raising failed');
  }
}

exports.modifyPersonalRecords = async (definitions, byu_id, body, authorized_byu_id, permissions) => {
  const connection = await db.getConnection();
  const new_body = processBody(authorized_byu_id, body);
  const can_update_dob = auth.canUpdateDoB(permissions);
  const is_lds_sync = auth.canIsLdsSync(permissions);
  const can_update_rel = auth.canUpdateReligion(permissions);

  if (!auth.canUpdateBasic(permissions) && !auth.canIsLdsSync(permissions)) {
    throw utils.Error(403, `User not authorized to update PERSON data`);
  }

  let sql_query = sql.sql.getPersonalRecords;
  let params = [byu_id];
  const from_results = await connection.execute(sql_query, params);
  if (!from_results.rows.length ||
    (from_results.rows[0].restricted === 'Y' &&
      !auth.hasRestrictedRights(permissions))) {
    throw utils.Error(404, 'Could not find BYU_ID in Person Table');
  }


  let processed_body = processFromResults(authorized_byu_id, from_results.rows[0]);

  let vitals_dif = (
    new_body.date_of_birth !== processed_body.from_date_of_birth ||
    new_body.date_of_death !== processed_body.from_date_of_death ||
    new_body.deceased !== processed_body.deceased);

  if (vitals_dif && !can_update_dob) {
    throw utils.Error(403, `User not authorized to update date_of_birth, date_of_death, or deceased`);
  }

  let lds_dif = (
    new_body.lds_unit_number !== processed_body.from_lds_unit_number ||
    new_body.lds_confirmation_date !== processed_body.from_lds_confirmation_date);

  if (lds_dif && !is_lds_sync) {
    throw utils.Error(403, `User not authorized to update lds_unit_number or lds_confirmation_date`);
  }

  let rel_dif = (new_body.religion_code !== processed_body.from_religion_code);

  if (rel_dif && !can_update_rel) {
    throw utils.Error(403, `User not authorized to update religion_code`);
  }

  let married_dif = (new_body.marital_status !== processed_body.from_marital_status);

  if (vitals_dif || lds_dif || rel_dif || married_dif) {
    sql_query = sql.modifyPersonalRecord.update;
    params = [
      new_body.date_time_updated,
      new_body.updated_by_id,
      new_body.date_of_birth,
      new_body.date_of_death,
      new_body.deceased,
      new_body.marital_status,
      new_body.religion_code,
      new_body.lds_unit_number,
      new_body.lds_confirmation_date,
      byu_id
    ];
    console.log(sql_query);
    console.log(params);
    await connection.execute(sql_query, params);
    sql_query = sql.modifyPersonalRecord.logChange;
    let log_params = [
      processed_body.change_type,
      byu_id,
      new_body.date_time_updated,
      new_body.updated_by_id,
      processed_body.date_time_created,
      processed_body.created_by_id,
      processed_body.from_date_of_birth,
      processed_body.from_deceased,
      processed_body.from_date_of_death,
      processed_body.sex,
      processed_body.from_marital_status,
      processed_body.from_religion_code,
      processed_body.from_lds_unit_number,
      processed_body.citizenship_country_code,
      processed_body.birth_country_code,
      processed_body.home_town,
      processed_body.home_state_code,
      processed_body.home_country_code,
      processed_body.high_school_code,
      processed_body.restricted,
      processed_body.ssn,
      processed_body.ssn_verification_date,
      processed_body.visa_type,
      processed_body.i20_expiration_date,
      processed_body.visa_type_source,
      processed_body.from_lds_confirmation_date,
      new_body.date_of_birth,
      new_body.deceased,
      new_body.date_of_death,
      processed_body.sex,
      new_body.marital_status,
      new_body.religion_code,
      new_body.lds_unit_number,
      processed_body.citizenship_country_code,
      processed_body.birth_country_code,
      processed_body.home_town,
      processed_body.home_state_code,
      processed_body.home_country_code,
      processed_body.high_school_code,
      processed_body.restricted,
      processed_body.ssn,
      processed_body.ssn_verification_date,
      processed_body.visa_type,
      processed_body.i20_expiration_date,
      processed_body.visa_type_source,
      new_body.lds_confirmation_date,
    ];
    console.log(sql_query);
    console.log(log_params);
    await connection.execute(sql_query, log_params, { autoCommit: true });
    await personalRecordChangedEvents(connection, byu_id, new_body, processed_body);
  }

  params = [byu_id];
  sql_query = sql.sql.getPersonalRecords;
  const results = await connection.execute(sql_query, params);
  connection.close();
  const vital_api_type = can_update_dob ? 'modifiable': 'read-only';
  const lds_api_type = is_lds_sync ? 'modifiable': 'read-only';
  const rel_api_type = can_update_rel ? 'modifiable': 'read-only';

  return mapDBResultsToDefinition(definitions, results.rows[0], vital_api_type, vital_api_type, lds_api_type, rel_api_type);
};
