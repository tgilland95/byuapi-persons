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
const common_sql = require('./sql/common_sql');
const sql = require('./sql/addresses');
const utils         = require('./utils');
const func = require('../shared_functions');
const moment = require("moment");
const Enforcer = require('swagger-enforcer');
const auth = require('./auth');

exports.getAddresses = async function (definitions, byu_id) {
  def.metadata.validation_response.return_code = 200;
  if (!results.rows[0].address_type && !request.params.sub_resource_id) {
    def.metadata.collection_size = 0;
    def.values.pop();
    return def
  }
}
exports.getAddress = async function (definitions, byu_id, address_type) {
  const result = Enforcer.enforce(definitions.address, definitions);
  const params = [address_type, byu_id];
  const sql_query = sql.sql.getAddress;
  const results = await func.executeSelect(sql_query, params);

  if (results.rows.length === 0) {
    throw utils.Error(404, "BYU_ID not found in person table")
  }

  if (results.rows[0].restricted === 'Y' && auth.hasRestrictedRights(req)) {
    throw utils.Error(404, 'BYU_ID not found in person table')
  }

  if (auth.canViewContact(req)) {

    if (!results.rows[0].address_type) {
      throw utils.Error(404, address_type + " address not found")
    }

    Enforcer.injectParameters(result, {
      byu_id: byu_id,
      collection_size: results.rows.length,
      date_time_created: moment(results.rows[0].date_time_created).format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
      date_time_updated: moment(results.rows[0].date_time_updated).format("YYYY-MM-DDTHH:mm:ss.SSSZ")
    });
  }
  else {
    throw utils.Error(501, 'Not Implemented');
    /*// Keep WRK address for public directory
    var work_address = [];
    for (var x = results.rows.length; x--;) {
      if (results.rows[x].address_type === "WRK") {
        work_address.push(results.rows[x])
      }
    }
    results.rows = work_address;
    //if the query was good but no records exist return an empty object
    if (results.rows[0] &&
      !results.rows[0].address_type &&
      !request.params.sub_resource_id) {
      def.metadata.validation_response.return_code = 200;
      def.values.pop();
      return def
    }
    if (results.rows[0] &&
      !results.rows[0].address_type &&
      request.params.sub_resource_id) {
      throw utils.Error(404, address_type + " address not found")
    }
    if (results.rows[0] &&
      ((results.rows[0]["primary_role"] === "Employee") ||
      (results.rows[0]["primary_role"] === "Faculty"))) {
      //process the data and fill in the DEF.JSON values and descriptions
      def.values = core.sqlmap.map_rows(results.rows, def.values[0], sql.sql.public_map);
      //updated the HATEOAS links
      core.sqlmap.map_results(results.rows, def, sql.sql.map, function (item) {
        links_map.address_type = item.address_type.value;
        core.updateHATEOASData(item.links, links_map)
      });
      for (i = def.values.length; i--;) {
        if (def.values[i].unlisted.value === "Y") {
          def.values[i].pop();
          def.values[i] = "Address Unlisted"
        }
      }
      def.metadata.collection_size = results.rows.length;
      def.metadata.validation_response.return_code = 203;
      def.metadata.validation_response.response = "User authorized to view PUBLIC DIRECTORY info only";
      return def
    }
    else {
      throw utils.Error(403, "User authorized to view PUBLIC DIRECTORY info only")
    }*/
  }
};