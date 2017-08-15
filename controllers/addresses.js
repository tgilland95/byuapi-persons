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
const utils         = require('./utils');
const func          = require('./sql/shared_functions');
const sql           = require('./sql/addresses');
const auth          = require('./auth');

exports.getAddress = async function (definitions, byu_id, address_type, permissions) {
  const params = [address_type, byu_id];
  const sql_query = sql.sql.getAddress;
  const results = await func.executeSelect(sql_query, params);

  if (results.rows.length === 0) {
    throw utils.Error(404, "BYU_ID not found in person table")
  }

  if (results.rows[0].restricted === 'Y' && !auth.hasRestrictedRights(permissions)) {
    throw utils.Error(404, 'BYU_ID not found in person table')
  }

  if (!auth.canViewContact(permissions)) {
    throw utils.Error(403, 'Not Authorized to view contact')
  }

  if (!results.rows[0].address_type) {
    throw utils.Error(404, address_type + " address not found")
  }
  console.log("Enforcer Appy Template: ",Enforcer.applyTemplate.toString());
  const result = Enforcer.applyTemplate(definitions.address, definitions,
    {
      byu_id: byu_id,
      name: results.rows[0].name,
      address_type: address_type,
      address_api_type: "modifiable",
      collection_size: results.rows.length,
      page_start: 0,
      page_end: results.rows.length,
      page_size: results.rows.length,
      default_page_size: 1,
      maximum_page_size: 100,
      date_time_updated: results.rows[0].date_time_updated.toISOString(),
      updated_by_id: results.rows[0].updated_by_id,
      updated_by_name: results.rows[0].updated_by_name,
      date_time_created: results.rows[0].date_time_created.toISOString(),
      created_by_id: results.rows[0].created_by_id,
      created_by_name: results.rows[0].created_by_name || '',
      address_line_1: results.rows[0].address_line_1,
      address_line_2: results.rows[0].address_line_2,
      address_line_3: results.rows[0].address_line_3,
      address_line_4: results.rows[0].address_line_4,
      building_code: results.rows[0].building_code,
      building_name: results.rows[0].building_name,
      long_building_name: results.rows[0].long_building_name,
      room: results.rows[0].room,
      country_code: results.rows[0].country_code,
      country_name: results.rows[0].country_name,
      city: results.rows[0].city,
      state_code: results.rows[0].state_code,
      state_name: results.rows[0].state_name,
      postal_code: results.rows[0].postal_code,
      unlisted: results.rows[0].unlisted || 'N',
      verified_flag: results.rows[0].verified_flag || 'N',
    }
    );
  // console.log(result);
  return result;
};