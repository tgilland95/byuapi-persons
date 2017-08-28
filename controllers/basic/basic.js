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
const Enforcer      = require('swagger-enforcer');
const moment        = require('moment-timezone');
const auth          = require('../auth');
const db            = require('../db');
const sql           = require('./sql');
const utils         = require('../utils');

function mapDBResultsToDefinition(definitions, row, api_type) {
  return Enforcer.applyTemplate(definitions.basic, definitions,
    {
      byu_id: row.byu_id,
      person_id: row.byu_id,
      net_id: row.net_id || undefined,
      api_type: api_type,
      deceased: row.deceased,
      sex: row.sex,
      personal_email_address: row.personal_email_address,
      primary_phone_number: row.primary_phone_number,
      date_time_updated: row.date_time_updated ? row.date_time_updated.toISOString() : undefined,
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
      home_state_name: row.home_state_name || undefined,
      home_country_code: row.home_country_code,
      home_country_name: row.home_country_name,
      high_school_code: row.high_school_code,
      high_school_name: row.high_school_name || undefined,
      high_school_state_code: row.high_school_state_code || undefined,
      high_school_state_name: row.high_school_state_name || undefined,
      high_school_city: row.high_school_city || undefined,
      restricted: row.restricted,
      merge_in_process: row.merge_in_process
    }
  );
}

exports.getBasic = async function getBasic(definitions, byu_id, permissions) {
  // throw utils.Error(401, 'BYU_ID Not Found In Person Table');
  const params = [byu_id];
  const sql_query = sql.sql.getBasic;
  const results = await db.execute(sql_query, params);

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

exports.putBasic = async function putBasic(definitions, byu_id, authorized_byu_id, body, permissions) {
  let preferred_surname = (body.preferred_surname) ? body.preferred_surname : body.surname;
  let preferred_first_name = (body.preferred_first_name) ? body.preferred_first_name : body.first_name;
  let preferred_name = preferred_first_name + " " + preferred_surname;
  let middle_name = (body.middle_name) ? body.middle_name : " ";
  let suffix = (body.suffix) ? body.suffix : " ";
  let home_town = (body.home_town) ? body.home_town : " ";
  let home_state_code = (body.home_state_code) ? body.home_state_code : "??";
  let home_country_code = (body.home_country_code) ? body.home_country_code : "???";
  let high_school_code = (body.high_school_code) ? body.high_school_code : " ";
  let rest_of_name = (middle_name === " ") ? body.first_name : body.first_name + " " + middle_name;
  let sort_name = body.surname + ", " + rest_of_name;
  let current_date_time = moment();
  let updated_by_id = (!body.updated_by_id || (body.updated_by_id === " ")) ? authorized_byu_id : body.updated_by_id;
  let date_time_updated = (!body.date_time_updated || (body.date_time_updated === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](body.date_time_updated, utils.accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var log_name_params = [];
  var log_personal_params = [];

  var error = false;
  var msg = "Incorrect BODY: Missing ";
  if (!utils.isValidCountryCode(home_country_code)) {
    msg += "\n\tInvalid Country Code if unknown use, ???";
    error = true
  }
  if (!utils.isValidStateCode(home_state_code, home_country_code)) {
    msg += "\n\tInvalid State Code if unknown use, ??";
    error = true
  }
  if (!utils.isValidHighSchoolCode(high_school_code)) {
    msg += "\n\tIncorrect High School Code if you don't have one use, single space";
    error = true
  }
  if (error) {
    throw new utils.Error(409, msg)
  }
  if (!auth.canUpdatePersonBasic(permissions)) {
    throw new utils.Error(403, "User not authorized to update PERSON data")
  }

  return {};

  // var sql_query = sql.sql.fromPerson;
  // var params = [
  //   byu_id
  // ];
  // return connection["ces"].execute(sql_query, params)
  //   .then(function (results) {
  //     if (results.rows.length === 0) {
  //       throw new ClientError(404, "Could not find BYU_ID in Person Table")
  //     }
  //     if (results.rows[0].merge_in_process === "Y") {
  //       throw new ClientError(403, "User is not authorized to change a Person who is in process of being merged")
  //     }
  //     person_id = (results.rows[0].person_id) ? results.rows[0].person_id : " ";
  //     net_id = (results.rows[0].net_id) ? results.rows[0].net_id : " ";
  //     employee_type = (results.rows[0].employee_type && results.rows[0].employee_type !== "--") ? results.rows[0].employee_type : "Not An Employee";
  //     student_status = results.rows[0].student_status;
  //     primary_role = results.rows[0]["primary_role"];
  //     display_name = preferred_name;
  //     name_fnf = (results.rows[0].name_fnf) ? results.rows[0].name_fnf : " ";
  //     created_by_id = (results.rows[0].created_by_id) ? results.rows[0].created_by_id : created_by_id;
  //     date_time_created = (results.rows[0].date_time_created) ? moment(results.rows[0].date_time_created, utils.accepted_date_formats)["format"]("YYYY-MM-DD HH:mm:ss.SSS") : "";
  //
  //     change_type = "C";
  //     from_date_of_birth = (results.rows[0].date_of_birth) ? moment(results.rows[0].date_of_birth, utils.accepted_date_formats)["format"]("YYYY-MM-DD") : "";
  //     from_deceased = (results.rows[0].deceased) ? results.rows[0].deceased : " ";
  //     from_date_of_death = (results.rows[0].date_of_death) ? moment(results.rows[0].date_of_death, utils.accepted_date_formats)["format"]("YYYY-MM-DD") : "";
  //     from_sex = (results.rows[0].sex) ? results.rows[0].sex : " ";
  //     from_marital_status = (results.rows[0].marital_status) ? results.rows[0].marital_status : " ";
  //     from_religion_code = (results.rows[0].religion_code) ? results.rows[0].religion_code : " ";
  //     from_lds_unit_number = (results.rows[0].lds_unit_number) ? results.rows[0].lds_unit_number : " ";
  //     from_citizenship_country_code = (results.rows[0].citizenship_country_code) ? results.rows[0].citizenship_country_code : " ";
  //     from_birth_country_code = (results.rows[0].birth_country_code) ? results.rows[0].birth_country_code : " ";
  //     from_home_town = (results.rows[0].home_town) ? results.rows[0].home_town : " ";
  //     from_home_state_code = (results.rows[0].home_state_code) ? results.rows[0].home_state_code : " ";
  //     from_home_country_code = (results.rows[0].home_country_code) ? results.rows[0].home_country_code : " ";
  //     from_high_school_code = (results.rows[0].high_school_code) ? results.rows[0].high_school_code : " ";
  //     from_restricted = (results.rows[0].restricted) ? results.rows[0].restricted : " ";
  //     from_ssn = (results.rows[0].ssn) ? results.rows[0].ssn : " ";
  //     from_ssn_verification_date = (results.rows[0].ssn_verification_date) ? moment(results.rows[0].ssn_verification_date, utils.accepted_date_formats)["format"]("YYYY-MM-DD") : "";
  //     from_visa_type = (results.rows[0].visa_type) ? results.rows[0].visa_type : " ";
  //     from_i20_expiration_date = (results.rows[0].i20_expiration_date) ? moment(results.rows[0].i20_expiration_date, utils.accepted_date_formats)["format"]("YYYY-MM-DD") : "";
  //     from_visa_type_source = (results.rows[0].visa_type_source) ? results.rows[0].visa_type_source : " ";
  //     from_lds_confirmation_date = (results.rows[0].lds_confirmation_date) ? moment(results.rows[0].lds_confirmation_date, utils.accepted_date_formats)["format"]("YYYY-MM-DD") : "";
  //     date_of_birth = (results.rows[0].date_of_birth) ? moment(results.rows[0].date_of_birth, utils.accepted_date_formats)["format"]("YYYY-MM-DD") : "";
  //     deceased = (results.rows[0].deceased) ? results.rows[0].deceased : " ";
  //     date_of_death = (results.rows[0].date_of_death) ? moment(results.rows[0].date_of_death, utils.accepted_date_formats)["format"]("YYYY-MM-DD") : "";
  //     marital_status = (results.rows[0].marital_status) ? results.rows[0].marital_status : " ";
  //     religion_code = (results.rows[0].religion_code) ? results.rows[0].religion_code : " ";
  //     lds_unit_number = (results.rows[0].lds_unit_number) ? results.rows[0].lds_unit_number : " ";
  //     citizenship_country_code = (results.rows[0].citizenship_country_code) ? results.rows[0].citizenship_country_code : " ";
  //     birth_country_code = (results.rows[0].birth_country_code) ? results.rows[0].birth_country_code : " ";
  //     ssn = (results.rows[0].ssn) ? results.rows[0].ssn : " ";
  //     ssn_verification_date = (results.rows[0].ssn_verification_date) ? moment(results.rows[0].ssn_verification_date, utils.accepted_date_formats)["format"]("YYYY-MM-DD") : "";
  //     visa_type = (results.rows[0].visa_type) ? results.rows[0].visa_type : " ";
  //     i20_expiration_date = (results.rows[0].i20_expiration_date) ? moment(results.rows[0].i20_expiration_date, utils.accepted_date_formats)["format"]("YYYY-MM-DD") : "";
  //     visa_type_source = (results.rows[0].visa_type_source) ? results.rows[0].visa_type_source : " ";
  //     lds_confirmation_date = (results.rows[0].lds_confirmation_date) ? moment(results.rows[0].lds_confirmation_date, utils.accepted_date_formats)["format"]("YYYY-MM-DD") : "";
  //     from_surname = (results.rows[0].surname) ? results.rows[0].surname : " ";
  //     from_rest_of_name = (results.rows[0].rest_of_name) ? results.rows[0].rest_of_name : " ";
  //     from_suffix = (results.rows[0].suffix) ? results.rows[0].suffix : " ";
  //     from_preferred_first_name = (results.rows[0].preferred_first_name) ? results.rows[0].preferred_first_name : " ";
  //     from_preferred_surname = (results.rows[0].preferred_surname) ? results.rows[0].preferred_surname : " ";
  //     from_preferred_name = (results.rows[0].preferred_name) ? results.rows[0].preferred_name : " ";
  //     from_sort_name = (results.rows[0].sort_name) ? results.rows[0].sort_name : " ";
  //     from_first_name = (results.rows[0].first_name) ? results.rows[0].first_name : " ";
  //     from_middle_name = (results.rows[0].middle_name) ? results.rows[0].middle_name : " ";
  //
  //     log_name_params = [
  //       change_type,
  //       byu_id,
  //       date_time_updated,
  //       updated_by_id,
  //       date_time_created,
  //       created_by_id,
  //       from_surname,
  //       from_rest_of_name,
  //       from_suffix,
  //       from_preferred_first_name,
  //       from_preferred_surname,
  //       from_preferred_name,
  //       from_sort_name,
  //       from_first_name,
  //       from_middle_name,
  //       surname,
  //       rest_of_name,
  //       suffix,
  //       preferred_first_name,
  //       preferred_surname,
  //       preferred_name,
  //       sort_name,
  //       first_name,
  //       middle_name
  //     ];
  //     log_personal_params = [
  //       change_type,
  //       byu_id,
  //       date_time_updated,
  //       updated_by_id,
  //       date_time_created,
  //       created_by_id,
  //       from_date_of_birth,
  //       from_deceased,
  //       from_date_of_death,
  //       from_sex,
  //       from_marital_status,
  //       from_religion_code,
  //       from_lds_unit_number,
  //       from_citizenship_country_code,
  //       from_birth_country_code,
  //       from_home_town,
  //       from_home_state_code,
  //       from_home_country_code,
  //       from_high_school_code,
  //       from_restricted,
  //       from_ssn,
  //       from_ssn_verification_date,
  //       from_visa_type,
  //       from_i20_expiration_date,
  //       from_visa_type_source,
  //       from_lds_confirmation_date,
  //       date_of_birth,
  //       deceased,
  //       date_of_death,
  //       sex,
  //       marital_status,
  //       religion_code,
  //       lds_unit_number,
  //       citizenship_country_code,
  //       birth_country_code,
  //       home_town,
  //       home_state_code,
  //       home_country_code,
  //       high_school_code,
  //       restricted,
  //       ssn,
  //       ssn_verification_date,
  //       visa_type,
  //       i20_expiration_date,
  //       visa_type_source,
  //       lds_confirmation_date
  //     ];
  //
  //     var name_dif = false;
  //     var basic_dif = false;
  //     if ((from_surname !== surname) ||
  //       (from_first_name !== first_name) ||
  //       (from_middle_name !== middle_name)) {
  //       if (!inArray("person_update_name", request.params.auth)) {
  //         throw new ClientError(403, "User not authorized to update name")
  //       }
  //       name_dif = true
  //     }
  //     if ((from_home_town !== home_town) ||
  //       (from_home_state_code !== home_state_code) ||
  //       (from_home_country_code !== home_country_code) ||
  //       (from_high_school_code !== high_school_code) ||
  //       (from_preferred_surname !== preferred_surname) ||
  //       (from_preferred_first_name !== preferred_first_name) ||
  //       (from_suffix !== suffix) ||
  //       (from_sex !== sex) ||
  //       (from_restricted !== restricted)) {
  //       if (!inArray("person_update_basic", request.params.auth)) {
  //         throw new ClientError(403, "User not authorized")
  //       }
  //       basic_dif = true
  //     }
  //     if (name_dif || basic_dif) {
  //       sql_query = sql.modifyPerson.update;
  //       params = [
  //         date_time_updated,
  //         updated_by_id,
  //         surname,
  //         first_name,
  //         rest_of_name,
  //         preferred_surname,
  //         preferred_first_name,
  //         preferred_name,
  //         sort_name,
  //         middle_name,
  //         suffix,
  //         home_town,
  //         home_state_code,
  //         home_country_code,
  //         high_school_code,
  //         sex,
  //         restricted,
  //         byu_id
  //       ];
  //       return connection["ces"].executeWithCommit(sql_query, params)
  //         .then(function () {
  //           if (name_dif ||
  //             (from_preferred_surname !== preferred_surname) ||
  //             (from_preferred_first_name !== preferred_first_name) ||
  //             (from_suffix !== suffix)) {
  //             sql_query = sql.modifyPerson.logNameChange;
  //             return connection["ces"].executeWithCommit(sql_query, log_name_params)
  //           }
  //         })
  //         .then(function () {
  //           if ((from_home_town !== home_town) ||
  //             (from_home_state_code !== home_state_code) ||
  //             (from_home_country_code !== home_country_code) ||
  //             (from_high_school_code !== high_school_code) ||
  //             (from_sex !== sex) ||
  //             (from_restricted !== restricted)) {
  //             sql_query = sql.modifyPerson.logPersonalChange;
  //             return connection["ces"].executeWithCommit(sql_query, log_personal_params)
  //           }
  //         })
  //         .then(function () {
  //           return personChangedEvents(connection)
  //         })
  //     }
  //   })
  //   .then(function () {
  //     return exports.get(connection, resources, request)
  //   })

};