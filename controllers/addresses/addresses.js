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

const Enforcer      = require('swagger-enforcer');
const utils         = require('../utils');
const func          = require('../shared_functions');
const sql           = require('./sql');
const auth          = require('../auth');

/**
 * A helper function that takes the swagger definition sql results and
 * returns a JSON object based on a map
 * @param definitions - Swagger
 * @param row - SQL Results
 * @param api_type - Whether the field is modifiable or read-only
 * @param return_code - 200 all info, 203 publicly available info
 * @returns {*}
 */
function mapDBResultsToDefinition(definitions, row, api_type, return_code, return_message) {
  return Enforcer.applyTemplate(definitions.address, definitions,
    {
      return_code: return_code,
      return_message: return_message,
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
      unlisted: row.unlisted === 'Y',
      verified_flag: row.verified_flag === 'Y',
    }
  );
}

/**
 * This function returns a JSON object with a person's address information as defined by the
 * swagger.
 * @param definitions - swagger information
 * @param byu_id - Nine digit number
 * @param address_type - MAL, RES, PRM, WRK
 * @param permissions - authorizations
 * @returns {Promise.<*>}
 */
exports.getAddress = async function getAddress(definitions, byu_id, address_type, permissions) {
  const params = [address_type, byu_id];
  const sql_query = sql.sql.getAddress;
  // Return code 203 lets the consumer know that there is more information that it is not
  // authorized to see
  const return_code = auth.canViewContact(permissions) ? 200 : 203;
  const return_message = auth.canViewContact(permissions) ? 'Success' : 'Public Info Only';
  const modifiable = auth.canViewContact(permissions) ? 'modifiable': 'read-only';
  const results = await func.executeSelect(sql_query, params);

  // If no results are returned or the record is restricted
  // and the entity retrieving the record does not belong
  // to the GRO.PERSON_GROUP.GROUP_ID.RESTRICTED then
  // return 404 person not found
  if (!results.rows.length ||
    (results.rows[0].restricted === 'Y' &&
      !auth.hasRestrictedRights(permissions))) {
    throw utils.Error(404, 'BYU_ID Not Found In Person Table')
  }

  // If the person exists but the type of address requested
  // does not exist then return 404 address not found
  if (!results.rows[0].address_type) {
    throw utils.Error(404, `${address_type} address not found`)
  }

  // If it is not self service and the entity retrieving the
  // record does not have the PERSON info area and the
  // address being retrieved does not belong to an employee
  // or faculty and it is not his or her work address
  // and if it is unlisted then throw a 403 Not Authorized
  if (!auth.canViewContact(permissions) &&
    address_type !== 'WRK' &&
    results.rows[0].primary_role !== 'Employee' &&
    results.rows[0].primary_role !== 'Faculty' &&
    results.rows[0].unlisted === 'Y') {
    throw utils.Error(403, 'Not Authorized To View Address')
  }

  return mapDBResultsToDefinition(definitions, results.rows[0], modifiable, return_code, return_message);
};

/**
 * Returns a person's address collection
 * @param definitions - Swagger
 * @param byu_id - Nine digit number
 * @param permissions - Authorizations
 * @returns {Promise.<*>}
 */
exports.getAddresses = async function getAddresses(definitions, byu_id, permissions) {
  const params = [byu_id];
  const sql_query = sql.sql.getAddresses;
  const results = await func.executeSelect(sql_query, params);

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
  // return all address information else if they are looking up an employee or faculty member
  // return the employee's or faculty's work address as long as it is not unlisted
  const values = (auth.canViewContact(permissions)) ? (
    results.rows.map(row => mapDBResultsToDefinition(definitions, row, 'modifiable', 200, 'Success'))
  ) : (
    results.rows.filter(row => (row.unlisted === 'N' && row.address_type === 'WRK' &&
      (row.primary_role === 'Employee' || row.primary_role === 'Faculty'))
    ).map(row => mapDBResultsToDefinition(definitions, row, 'read-only', 203, 'Public Info Only'))
  );

  const addresses = Enforcer.applyTemplate(definitions.addresses, definitions,
    {
      byu_id: byu_id,
      collection_size: results.rows.length, // TODO: Can we use the length of the results.rows? We may get results back with no addresses but have results.
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