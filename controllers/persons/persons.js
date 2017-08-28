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
const basic           = require('../basic/basic');
const addresses       = require('../addresses/addresses');
const auth            = require('../auth');
const db              = require('../db');
const sql             = require('./sql');
const Enforcer        = require('swagger-enforcer');

exports.getPersons = async function(definitions, query, permisisons) {
  let data = {};
  let params = [];
  let sql_query_select = sql.getPersons.sql.select;
  let sql_query_from = sql.getPersons.sql.from;
  let sql_query_where = sql.getPersons.sql.where;
  let request_query = query;
  let length = 0;

  if ("byu_id" in request_query) {
    let byu_id_query_array = request_query.byu_id.split(",");
    length = byu_id_query_array.length;
    sql_query_where += " and iam.person.byu_id in (";

    for (let i = 0; i < length; i++) {
      params.push(byu_id_query_array[i]);
      if (byu_id_query_array[i].search(/^[0-9]{9}$/) === -1) {
        throw new ClientError(409, "Incorrect URL: BYU_ID must be a 9 digit number with no spaces or dashes")
      }
      if (i === length - 1) {
        sql_query_where += ":byu" + i + ")"
      }
      else {
        sql_query_where += ":byu" + i + ","
      }
    }
  }

  if ("ssn" in request_query) {
    if (!auth.canLookupSSN(permisisons)) {
      throw new ClientError(403, "User not authorized to lookup by SSN")
    }
    let ssn_query_array = request_query.ssn.split(",");
    length = ssn_query_array.length;
    sql_query_where += " and iam.person.ssn in (";

    for (let i = 0; i < length; i++) {
      params.push(ssn_query_array[i]);
      if (ssn_query_array[i].search(/^[0-9]{9}$/) === -1) {
        throw new ClientError(409, "Incorrect URL: SSN must be a 9 digit number with no spaces or dashes")
      }
      if (i === length - 1) {
        sql_query_where += ":ssn" + i + ")"
      }
      else {
        sql_query_where += ":ssn" + i + ","
      }
    }
  }
  if ("surname" in request_query) {
    let surname = "%" + decodeURIComponent(request_query.surname) + "%";
    params.push(surname);
    sql_query_where += " and iam.person.surname like :s"
  }
  if ("rest_of_name" in request_query) {
    let rest_of_name = "%" + decodeURIComponent(request_query.rest_of_name) + "%";
    params.push(rest_of_name);
    sql_query_where += " and iam.person.rest_of_name like :ron"
  }
  if ("preferred_surname" in request_query) {
    let preferred_surname = "%" + decodeURIComponent(request_query.preferred_surname) + "%";
    params.push(surname);
    sql_query_where += " and iam.person.preferred_surname like :ps"
  }
  if ("preferred_first_name" in request_query) {
    let preferred_first_name = "%" + decodeURIComponent(request_query.preferred_first_name) + "%";
    params.push(preferred_first_name);
    sql_query_where += " and iam.person.preferred_first_name like :pf"
  }
  if ("sex" in request_query) {
    let sex = decodeURIComponent(request_query.sex);
    params.push(sex);
    sql_query_where += " and iam.person.sex = :g"
  }
  if ("deceased" in request_query) {
    let deceased = "%" + decodeURIComponent(request_query.deceased) + "%";
    params.push(deceased);
    sql_query_where += " and iam.person.deceased like :d"
  }
  if ("marital_status" in request_query) {
    let marital_status = "%" + decodeURIComponent(request_query.marital_status) + "%";
    params.push(marital_status);
    sql_query_where += " and iam.person.marital_status like :ms"
  }
  if ("religion_code" in request_query) {
    let religion_code = "%" + decodeURIComponent(request_query.religion_code) + "%";
    params.push(religion_code);
    sql_query_where += " and iam.person.religion_code like :r"
  }
  if ("citizenship_country_code" in request_query) {
    let citizenship_country_code = "%" + decodeURIComponent(request_query.citizenship_country_code) + "%";
    params.push(citizenship_country_code);
    sql_query_where += " and iam.person.citizenship_country_code like :ccc"
  }
  if ("home_town" in request_query) {
    let home_town = "%" + decodeURIComponent(request_query.home_town) + "%";
    params.push(home_town);
    sql_query_where += " and iam.person.home_town like :ht"
  }
  if ("home_state_code" in request_query) {
    let home_state_code = "%" + decodeURIComponent(request_query.home_state_code) + "%";
    params.push(home_state_code);
    sql_query_where += " and iam.person.home_state_code like :hsc"
  }
  if ("home_country_code" in request_query) {
    let home_country_code = "%" + decodeURIComponent(request_query.home_country_code) + "%";
    params.push(home_country_code);
    sql_query_where += " and iam.person.home_country_code like :hcc"
  }
  if ("restricted" in request_query) {
    let restricted = "%" + decodeURIComponent(request_query.restricted) + "%";
    params.push(restricted);
    sql_query_where += " and iam.person.restricted like :x"
  }
  if ("visa_type" in request_query) {
    let visa_type = "%" + decodeURIComponent(request_query.visa_type) + "%";
    params.push(visa_type);
    sql_query_where += " and iam.person.restricted like :vt"
  }
  if ("net_id" in request_query) {
    let net_id_query_array = request_query.net_id.split(",");

    sql_query_from += " left join iam.credential n" +
      " on iam.person.byu_id = n.byu_id";

    sql_query_where += " and n.credential_id in (";

    length = net_id_query_array.length;
    for (let i = 0; i < length; i++) {
      params.push(net_id_query_array[i]);
      if (net_id_query_array[i].search(/^[a-z][a-z0-9]{0,8}$/) === -1) {
        throw new ClientError(409, "Incorrect URL: NET_ID must be a 1 to 9 alphanumeric character string each net_id must be separated by a comma")
      }
      if (i === length - 1) {
        sql_query_where += ":net" + i + ")"
      }
      else {
        sql_query_where += ":net" + i + ","
      }
    }
    sql_query_where += " and n.credential_type = 'NET_ID'"
  }
  if ("credential_type" in request_query) {
    let credential_type = request_query.credential_type;

    if (credential_type !== "NET_ID") {
      if (auth.canViewBasic(permisisons)) {
        throw new ClientError(403, "User not authorized to lookup by " + credential_type)
      }
    }

    params.push(credential_type);

    sql_query_from += " left join iam.credential ct" +
      " on iam.person.byu_id = ct.byu_id";

    sql_query_where += " and ct.credential_type = :ct";
    if ("credential_id" in request_query) {
      let credential_id = request_query.credential_id;

      params.push(credential_id);
      sql_query_where += " and ct.credential_id = :cid"
    }
  }
  if (!("credential_type" in request_query) && ("credential_id" in request_query)) {
    throw new ClientError(409, "Invalid Query: You must include credential_type with credential_id")
  }
  if ("user_name" in request_query) {
    let user_name_query_array = query.user_name.split(",");

    sql_query_from += " left join iam.credential un" +
      " on iam.person.byu_id = un.byu_id";

    sql_query_where += " and un.user_name in (";

    length = user_name_query_array.length;
    for (let i = 0; i < length; i++) {
      params.push(user_name_query_array[i]);
      if (i === length - 1) {
        sql_query_where += " :un" + i + ")"
      }
      else {
        sql_query_where += " :un" + i + ","
      }
    }

  }
  if ("email_address" in request_query) {
    let email_address_query_array = query.email_address.split(",");

    sql_query_from += " left join iam.email_address ea" +
      " on iam.person.byu_id = ea.byu_id";

    sql_query_where += " and ea.email_address in (";

    length = email_address_query_array.length;
    for (let i = 0; i < length; i++) {
      params.push(email_address_query_array[i]);
      if (i === length - 1) {
        sql_query_where += " :ea" + i + ")"
      }
      else {
        sql_query_where += " :ea" + i + ","
      }
    }
  }
  if ("phone_number" in request_query) {
    let phone_number_query_array = query.phone_number.split(",");

    sql_query_from += " left join iam.phone_number pn" +
      " on iam.person.byu_id = pn.byu_id";

    sql_query_where += " and pn.phone_number in (";

    length = phone_number_query_array.length;
    for (let i = 0; i < length; i++) {
      params.push(phone_number_query_array[i]);
      if (i === length - 1) {
        sql_query_where += " :pn" + i + ")"
      }
      else {
        sql_query_where += " :pn" + i + ","
      }
    }
  }
  if ("employee_type" in request_query) {
    let employee_type = request_query.employee_type;
    for (let i = 3; i--;) {
      params.push(employee_type)
    }
    sql_query_from += " left join hr.per_warehouse pwh" +
      " on iam.person.byu_id = pwh.byu_id";

    sql_query_where += " and pwh.classification = substr(:et1, 1, 3)" +
      " and hr.per_warehouse.status = substr(:et2, 5, 2)" +
      " and hr.per_warehouse.standing = substr(:et3, 8, 3)"
  }
  if ("student_status" in request_query) {
    let class_standing;
    let reg_status;
    let reg_eligibility;
    let class_standing_set = false;
    switch (decodeURIComponent(request_query.student_status).toUpperCase()) {
      case "FRESHMAN":
        class_standing = "1";
        class_standing_set = true;
        break;
      case "SOPHOMORE":
        class_standing = "2";
        class_standing_set = true;
        break;
      case "JUNIOR":
        class_standing = "3";
        class_standing_set = true;
        break;
      case "SENIOR":
        class_standing = "4";
        class_standing_set = true;
        break;
      case "POST BACCALAUREATE NON DEGREE":
        class_standing = "6";
        class_standing_set = true;
        break;
      case "MASTERS PROGRAM":
        class_standing = "7";
        class_standing_set = true;
        break;
      case "DOCTORATE PROGRAM":
        class_standing = "8";
        class_standing_set = true;
        break;
      case "BGS":
        reg_status = "B";
        reg_eligibility = "BGS";
        break;
      case "AUDIT":
        reg_status = "A";
        reg_eligibility = "AO";
        break;
      case "CONCURRENT ENROLLMENT":
        reg_status = "2";
        reg_eligibility = "CH";
        break;
      case "VISITING STUDENT":
        reg_status = "V";
        reg_eligibility = "SO";
        break;
      case "ELC":
        reg_status = "E";
        reg_eligibility = "LC";
        break;
      case "EVENING SCHOOL":
        reg_status = "3";
        reg_eligibility = "CE";
        break;
      case "SALT LAKE CENTER STUDENT":
        reg_status = "3";
        reg_eligibility = "SL";
        break;
      default:
        class_standing = null;
        class_standing_set = true
    }
    sql_query_from += " left join ods.std_reg_eligibility sre" +
      " on iam.person.person_id = sre.person_id";

    if (class_standing_set) {
      params.push(class_standing);
      sql_query_where += " and sre.class_standing = :cs"
    }
    else {
      params.push(reg_status);
      params.push(reg_eligibility);
      sql_query_where += " and sre.reg_status = :rs" +
        " and sre.reg_eligibility = :re"
    }
  }
  const results = await db.execute(sql_query_select + sql_query_from + sql_query_where, params);
  const values = await Promise.all(results.rows.map(row => exports.getPerson(definitions, row.byu_id, query, permisisons)));
  const persons = Enforcer.applyTemplate(definitions.persons, definitions,
    {
      collection_size: results.rows.length, // TODO: Can we use the length of the results.rows? We may get results back with no addresses but have results.
      page_start: 0,
      page_end: results.rows.length,
      page_size: results.rows.length,
      default_page_size: 1,
      maximum_page_size: 100,
      persons_values: values
    });
  // TODO: Should we embellish the HATEOAS "self" links with the query parameters specified on this specific request?
  // TODO: Set :page_size in HATEOAS link to size of results from SQL query
  persons.values = values;
  return persons;
};

exports.getPerson = async function (definitions, byu_id, query, permissions) {
  const promises = [];
  const result = {};

  if(query.field_sets.includes('basic')){
    promises.push(basic.getBasic(definitions, byu_id, permissions).then(function (basic_result) {
      result.basic = basic_result;
    })
      .catch(function (error) {
        let basic = Enforcer.applyTemplate(definitions.basic, null,
          {
            byu_id: byu_id,
            validation_response_code: error.status || 500,
            validation_response_message: error.message || 'Internal Server Error'
          }, { ignoreMissingRequired: false });
        result.basic = basic;
      }));
  }
  if(query.field_sets.includes('addresses')) {
    promises.push(addresses.getAddresses(definitions, byu_id, permissions).then(function (addresses_result) {
      result.addresses = addresses_result;
    })
      .catch(function (error) {
        let addresses = {values: []};
        addresses.metadata = Enforcer.applyTemplate(definitions.sub_level_metadata, null,
          {
            validation_response_code: error.status || 500,
            validation_response_message: error.message || 'Internal Server Error'
          });
        result.addresses = addresses;
      }));
  }
  await Promise.all(promises);
  return result;
};

exports.modifyPerson = async function (definitions, byu_id, authorized_byu_id, body, permissions) {
  return basic.putBasic(definitions, byu_id, authorized_byu_id, body, permissions);
};