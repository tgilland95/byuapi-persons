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
"use strict";
const Enforcer      = require('swagger-enforcer');
const utils         = require('../utils');
const func          = require('../shared_functions');
const sql           = require('./sql');
const auth          = require('../auth');

function mapDBResultsToDefinition(definitions, row, api_type) {
  return Enforcer.applyTemplate(definitions.basic, definitions,
    {
      byu_id: row.byu_id,
      person_id: row.byu_id,
      net_id: row.net_id,
      api_type: api_type,
      deceased: row.deceased,
      sex: row.sex,
      personal_email_address: row.personal_email_address,
      primary_phone_number: row.primary_phone_number,
      date_time_updated: row.date_time_updated.toISOString(),
      updated_by_id: row.updated_by_id,
      updated_by_name: row.updated_by_id,
      date_time_created: row.date_time_created.toISOString(),
      created_by_id: row.created_by_id,
      created_by_name: row.created_by_id,
      first_name: row.first_name,
      middle_name: row.middle_name,
      surname: row.surname,
      suffix: row.suffix,
      preferred_first_name: row.preferred_first_name,
      preferred_surname: row.preferred_surname,
      rest_of_name: row.rest_of_name,
      name_lnf: row.name_lnf,
      name_fnf: row.name_fnf,
      preferred_name: row.preferred_name,
      home_town: row.home_town,
      home_state_code: row.home_state_code,
      home_state_name: row.home_state_name,
      home_country_code: row.home_country_code,
      home_country_name: row.home_country_name,
      high_school_code: row.high_school_code,
      high_school_name: row.high_school_name,
      high_school_state_code: row.high_school_state_code,
      high_school_state_name: row.high_school_state_name,
      high_school_city: row.high_school_city,
      restricted: row.restricted,
      merge_in_process: row.merge_in_process
    }
  );
}

exports.getBasic = async function getBasic(definitions, byu_id, permissions) {
  const params = [byu_id];
  const sql_query = sql.sql.getBasic;
  const results = await func.executeSelect(sql_query, params);

  if (!results.rows.length ||
    (results.rows[0].restricted === 'Y' &&
      !auth.hasRestrictedRights(permissions))) {
    throw utils.Error(404, 'BYU_ID Not Found In Person Table')
  }

  // if (!auth.canViewBasic(permissions) &&
  //   address_type !== 'WRK' &&
  //   results.rows[0].primary_role !== 'Employee' &&
  //   results.rows[0].primary_role !== 'Faculty' &&
  //   results.rows[0].unlisted === 'Y') {
  //   throw utils.Error(403, 'Not Authorized To View Address')
  // }

  // const modifiable = auth.canUpdateContact(permissions) ? 'modifiable': 'read-only';
  const modifiable = 'read-only';

  return mapDBResultsToDefinition(definitions, results.rows[0], modifiable);
};

