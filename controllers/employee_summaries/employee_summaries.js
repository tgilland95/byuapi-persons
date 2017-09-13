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

function mapDBResultsToDefinition(definitions, row) {
  return Enforcer.applyTemplate(definitions.employee_summaries, null,
    {
      byu_id: row.byu_id,
      name: row.name,
      employee_type: row.employee_type,
      employee_type_desc: row.employee_type_desc,
      department: row.department,
      job_title: row.job_title,
      job_desc: row.job_desc,
      hire_date: row.hire_date,
      reports_to_id: row.reports_to_id,
      reports_to_name: row.reports_to_name,
    }
  );
}

function mapDBResultsToPublicDefinition(definitions, row) {
  return Enforcer.applyTemplate(definitions.employee_summaries, null,
    {
      validation_response_code: 203,
      validation_response_message: 'Public Info Only',
      byu_id: row.byu_id,
      name: row.name,
      department: row.department,
      job_title: row.job_title,
      job_desc: row.job_desc,
    }
  );
}

exports.getEmployeeSummaries = async function getEmployeeSummaries(definitions, byu_id, permissions) {
  const params = [byu_id];
  const sql_query = sql.getEmployeeSummaries;
  console.log("SQL", sql_query);
  const results = await db.execute(sql_query, params);
  console.log("EMPLOYEE RESULTS", results);
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
  if (!results.rows[0].employee_type) {
    throw utils.Error(404, 'Employee record not found')
  }

  // If it is not self service and the entity retrieving the
  // record does not have the PERSON info area and the
  // employee being retrieved does not belong to an employee
  // or faculty and it is not his or her work address
  // and if it is unlisted then throw a 403 Not Authorized
  if (!auth.canViewBasic(permissions) &&
    results.rows[0].primary_role !== 'Employee' &&
    results.rows[0].primary_role !== 'Faculty') {
    throw utils.Error(403, 'Not Authorized To View Address')
  }

  if (auth.canViewBasic(permissions)) {
    console.log("FULL RETURN");
    return mapDBResultsToDefinition(definitions, results.rows[0]);
  }else if (/^(Employee|Faculty)$/g.test(results.rows[0].primary_role)) {
    console.log("LIMITED RETURN");
    return mapDBResultsToPublicDefinition(definitions, results.rows[0]);
  }
};
