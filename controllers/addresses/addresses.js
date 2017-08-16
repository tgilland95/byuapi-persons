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
  return Enforcer.applyTemplate(definitions.address, definitions,
    {
      byu_id: row.byu_id,
      name: row.name,
      address_type: row.address_type,
      address_api_type: api_type,
      date_time_updated: row.date_time_updated.toISOString(),
      updated_by_id: row.updated_by_id,
      updated_by_name: row.updated_by_name,
      date_time_created: row.date_time_created.toISOString(),
      created_by_id: row.created_by_id,
      created_by_name: row.created_by_name || '',
      address_line_1: row.address_line_1,
      address_line_2: row.address_line_2,
      address_line_3: row.address_line_3,
      address_line_4: row.address_line_4,
      building_code: row.building_code,
      building_name: row.building_name,
      long_building_name: row.long_building_name,
      room: row.room,
      country_code: row.country_code,
      country_name: row.country_name,
      city: row.city,
      state_code: row.state_code,
      state_name: row.state_name,
      postal_code: row.postal_code,
      unlisted: row.unlisted || 'N', // TODO: switch to boolean in Swagger
      verified_flag: row.verified_flag || 'N' // TODO: switch to boolean in Swagger
    }
  );
}

exports.getAddress =  async function getAddress(definitions, byu_id, address_type, permissions) {
  const params = [address_type, byu_id];
  const sql_query = sql.sql.getAddress;
  const results = await func.executeSelect(sql_query, params);

  if (!results.rows.length ||
    (results.rows[0].restricted === 'Y' &&
      !auth.hasRestrictedRights(permissions))) {
    throw utils.Error(404, 'BYU_ID Not Found In Person Table')
  }

  if (!results.rows[0].address_type) {
    throw utils.Error(404, `${address_type} address not found`)
  }

  if (!auth.canViewContact(permissions) &&
    address_type !== 'WRK' &&
    results.rows[0].primary_role !== 'Employee' &&
    results.rows[0].primary_role !== 'Faculty' &&
    results.rows[0].unlisted === 'Y') {
    throw utils.Error(403, 'Not Authorized To View Address')
  }

  return mapDBResultsToDefinition(definitions, results.rows[0], "modifiable");
};

exports.getAddresses = async function getAddresses(definitions, byu_id, permissions) {
  const params = [byu_id];
  const sql_query = sql.sql.getAddresses;
  let values = [];
  const results = await func.executeSelect(sql_query, params);

  if (!results.rows.length ||
    (results.rows[0].restricted === 'Y' &&
      !auth.hasRestrictedRights(permissions))) {
    throw utils.Error(404, 'BYU_ID Not Found In Person Table')
  }

  if (auth.canViewContact(permissions)) {
     values = results.rows
      .map(row => mapDBResultsToDefinition(definitions, row, "modifiable"));
  } else {
     values = results.rows
      .filter(row => {
        return (row.unlisted === 'N' &&
          row.address_type === 'WRK' &&
          (row.primary_role === 'Employee' ||
            row.primary_role === 'Faculty' ))
      })
      .map(row => mapDBResultsToDefinition(definitions, row, "modifiable"));
  }

  console.log(values);

  const addresses = Enforcer.applyTemplate(definitions.addresses, definitions,
    {
      byu_id: byu_id,
      collection_size: results.rows.length,
      page_start: 0,
      page_end: results.rows.length,
      page_size: results.rows.length,
      default_page_size: 1,
      maximum_page_size: 100,
      addresses_values: values
    });
  addresses.values = values;
  return addresses;
};