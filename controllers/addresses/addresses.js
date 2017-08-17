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
 * @param return_message - string to pass as a message
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
      api_type: api_type,
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

  // TODO: Do we return an Error with a 404 or do we return an empty array with the response_validation set and require who is invoking this handle the HTTP response properly?

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

//Checks to see if the country input matches our list of known country codes
// if it does not then an error is returned
function isValidCountryCode(country_code) {
  if (country_code && country_code.match(/^([?]{3}|[A-Z]{3})$/)) {
    let countryCode = require("../../meta/countries/countryCodes.json");
    let country_codes = countryCode.items;

    for (let i = country_codes.length; i--;) {
      if (country_code === country_codes[i].country_code) {
        return true
      }
    }
  }
  else {
    return false
  }
}

//This function checks the state codes for USA, CAN, and AUS input by the user
// if the user has entered an invalid state code an error is returned
function isValidStateCode(state_code, country_code) {
  if ((!country_code) || (!state_code)) {
    return false
  }
  else if (((country_code === "USA") ||
      (country_code === "CAN") ||
      (country_code === "AUS")) &&
    state_code.match(/^([?]{2}|[A-Z]{2,5})$/)) {
    let stateCode = require("../../meta/states/stateCodes.json");
    let state_codes = stateCode.items;

    for (let i = state_codes.length; i--;) {
      if ((state_code === state_codes[i].state_code) &&
        (country_code === state_codes[i].country_code)) {
        return true
      }
    }
    return false
  }
  else {
    return true
  }
}


//This function validates the postal code input by the user for USA and CAN addresses
//  it does not check to see if it matches the city only that the code is possible
function isValidPostalCode(postal_code, country_code) {
  if (postal_code && country_code && (country_code === "USA") &&
    (postal_code.match(/^[0-9]{5}$/))) {
    return true
  }
  else {
    return (postal_code && country_code && (country_code === "CAN") &&
      postal_code.toString().replace(/\W+/g, '').match(/([ABCEGHJKLMNPRSTVXY]\d)([ABCEGHJKLMNPRSTVWXYZ]\d){2}/i))
  }
}

//This function is used in the PUT to validate an on campus building code
function isValidBuildingCode(building_code) {
  let buildingCode = require("../../meta/buildings/buildingCodes.json");
  let building_codes = buildingCode.items;

  for (let i = building_codes.length; i--;) {
    if (building_code && building_code === building_codes[i]["domain_value"]) {
      return true
    }
  }
  return false
}

var accepted_date_formats = [
  "YYYY-MM-DD HH:mm:ss.SSS",
  "YYYY-MM-DDTHH:mm:ss.SSSZ",
  "YYYY-MM-DD h:mm:ss.SSS A",
  "YYYY-MM-DD h:mm:ss.SSS a",
  "YYYY-MM-DD",
  "MM/DD/YYYY",
  "M/D/YY",
  "M/D/YYYY",
  "DD-MMM-YYYY",
  "DD-MMM-YY",
  "DD MMMM YYYY"
];

exports.modifyAddress = async function (definitions, byu_id, address_type, body, authorized_byu_id, permissions) {

  let address_line_1 = body.address_line_1;
  let address_line_2 = body.address_line_2 || " ";
  let address_line_3 = body.address_line_3 || " ";
  let address_line_4 = body.address_line_4 || " ";
  let country_code   = body.country_code || "???";
  let room           = body.room || " ";
  let building       = body.building || " ";
  let city           = body.city || " ";
  let state_code     = body.state_code || "??";
  let postal_code    = body.postal_code || " ";
  let verified_flag  = body.verified_flag ? "Y" : "N";
  if (postal_code) {
    postal_code.trim()
  }
  let unlisted = body.unlisted ? "Y" : "N";
  let current_date_time = moment();
  let updated_by_id = (!body.updated_by_id || (body.updated_by_id === " ")) ? authorized_byu_id : body.updated_by_id;
  let date_time_updated = (!body.date_time_updated || (body.date_time_updated === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](body.date_time_updated, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  let created_by_id = (!body.created_by_id || (body.created_by_id === " ")) ? authorized_byu_id : body.created_by_id;
  let date_time_created = (!body.date_time_created || (body.date_time_created === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](body.date_time_created, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");

  let error = false;
  let msg = "Incorrect BODY: Missing\n";
  if (!isValidCountryCode(country_code)) {
    msg += "\n\tInvalid Country Code if unknown use, ???";
    error = true
  }
  if (!isValidStateCode(state_code, country_code)) {
    msg += "\n\tInvalid State Code if unknown use, ??";
    error = true
  }
  switch (country_code) {
    case "USA":
    case "CAN":
      if (!isValidPostalCode(postal_code, country_code)) {
        msg += "\n\tInvalid Postal Code";
        error = true
      }
      break;
    default:
      break
  }

  if (!isValidBuildingCode(building)) {
    msg += "\n\tInvalid Building Code";
    error = true
  }
  if (error) {
    throw new ClientError(409, msg)
  }
  if (!auth.canUpdatePersonContact(permissions)) {
    throw new ClientError(403, "User not authorized to update CONTACT data")
  }

  let params = [
    address_type,
    byu_id
  ];
  let sql_query = sql.sql.fromAddress;
  const from_results = await func.executeSelect(sql_query, params);
  if (from_results.rows.length === 0) {
    throw new ClientError(404, "Could not find BYU_ID in Person Table")
  }
  let person_id = (from_results.rows[0].person_id) ? from_results.rows[0].person_id : " ";
  let net_id = (from_results.rows[0].net_id) ? from_results.rows[0].net_id : " ";
  let employee_type = (from_results.rows[0].employee_type && from_results.rows[0].employee_type !== "--") ? from_results.rows[0].employee_type : "Not An Employee";
  let student_status = from_results.rows[0].student_status;
  let restricted = (from_results.rows[0].restricted && from_results.rows[0].restricted === "Y") ? "Y" : "N";
  created_by_id = (from_results.rows[0].created_by_id) ? from_results.rows[0].created_by_id : created_by_id;
  date_time_created = (from_results.rows[0].date_time_created) ? moment(from_results.rows[0].date_time_created, accepted_date_formats)["format"]("YYYY-MM-DD HH:mm:ss.SSS") : date_time_created;

  let change_type = (!from_results.rows[0].address_type) ? "A" : "C";
  let from_address_line_1 = (from_results.rows[0].address_line_1) ? from_results.rows[0].address_line_1 : " ";
  let from_address_line_2 = (from_results.rows[0].address_line_2) ? from_results.rows[0].address_line_2 : " ";
  let from_address_line_3 = (from_results.rows[0].address_line_3) ? from_results.rows[0].address_line_3 : " ";
  let from_address_line_4 = (from_results.rows[0].address_line_4) ? from_results.rows[0].address_line_4 : " ";
  let from_country_code = (from_results.rows[0].country_code) ? from_results.rows[0].country_code : " ";
  let from_room = (from_results.rows[0].room) ? from_results.rows[0].room : " ";
  let from_building = (from_results.rows[0].building) ? from_results.rows[0].building : " ";
  let from_city = (from_results.rows[0].city) ? from_results.rows[0].city : " ";
  let from_state_code = (from_results.rows[0].state_code) ? from_results.rows[0].state_code : " ";
  let from_postal_code = (from_results.rows[0].postal_code) ? from_results.rows[0].postal_code : " ";
  let from_unlisted = (from_results.rows[0].unlisted) ? from_results.rows[0].unlisted : " ";
  let from_verified_flag = (from_results.rows[0].verified_flag) ? from_results.rows[0].verified_flag : " ";

  let log_params = [
    change_type,
    byu_id,
    address_type,
    date_time_updated,
    updated_by_id,
    date_time_created,
    created_by_id,
    from_address_line_1,
    from_address_line_2,
    from_address_line_3,
    from_address_line_4,
    from_country_code,
    from_room,
    from_building,
    from_city,
    from_state_code,
    from_postal_code,
    from_unlisted,
    from_verified_flag,
    address_line_1,
    address_line_2,
    address_line_3,
    address_line_4,
    country_code,
    room,
    building,
    city,
    state_code,
    postal_code,
    unlisted,
    verified_flag
  ];

  let is_different = false;
  if ((address_line_1 !== from_address_line_1) ||
    (address_line_2 !== from_address_line_2) ||
    (address_line_3 !== from_address_line_3) ||
    (address_line_4 !== from_address_line_4) ||
    (country_code !== from_country_code) ||
    (room !== from_room) ||
    (building !== from_building) ||
    (city !== from_city) ||
    (state_code !== from_state_code) ||
    (postal_code !== from_postal_code) ||
    (unlisted !== from_unlisted)) {
    is_different = true
  }

  if (is_different && !from_results.rows[0].address_type) {
    sql_query = sql.modifyAddress.create;
    params = [
      byu_id,
      address_type,
      date_time_updated,
      updated_by_id,
      date_time_created,
      created_by_id,
      address_line_1,
      address_line_2,
      address_line_3,
      address_line_4,
      country_code,
      room,
      building,
      city,
      state_code,
      postal_code,
      unlisted,
      verified_flag
    ];

  } else if (is_different && from_results.rows[0].address_type) {
    sql_query = sql.modifyAddress.update;
    params = [
      date_time_updated,
      updated_by_id,
      address_line_1,
      address_line_2,
      address_line_3,
      address_line_4,
      country_code,
      room,
      building,
      city,
      state_code,
      postal_code,
      unlisted,
      verified_flag,
      byu_id,
      address_type
    ];
  }
  const update_results = await func.executeUpdate(sql_query, params);
  sql_query = sql.modifyAddress.logChange;
  const log_change_results = await func.executeUpdate(sql_query, log_params);
  // return addressEvents(connection)
  return await getAddress(definitions, byu_id, address_type, permissions);
};

// function addressEvents(connection) {
//   var source_dt = moment()['tz']("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
//   var event_type = (change_type === "A") ? "Address Added" : "Address Changed";
//   var event_type2 = (change_type === "A") ? "Address Added v2" : "Address Changed v2";
//   var domain = "edu.byu";
//   var entity = "BYU-IAM";
//   var filters = [];
//   var address_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id + "/addresses/" + address_type;
//   var secure_url = "https://api.byu.edu/domains/legacy/identity/secureurl/v1/";
//   var sql_query = "";
//   var params = [];
//   var event_frame = {
//     "events": {
//       "event": []
//     }
//   };
//   var header = [
//     "domain",
//     domain,
//     "entity",
//     entity,
//     "event_type",
//     event_type,
//     "source_dt",
//     source_dt,
//     "event_dt",
//     " ",
//     "event_id",
//     " "
//   ];
//   if (restricted !== "Y" && unlisted === "N") {
//     var body = [
//       "person_id",
//       person_id,
//       "byu_id",
//       byu_id,
//       "net_id",
//       net_id,
//       "address_type",
//       address_type,
//       "address_line_1",
//       address_line_1,
//       "address_line_2",
//       address_line_2,
//       "address_line_3",
//       address_line_3,
//       "address_line_4",
//       address_line_4,
//       "country_code",
//       country_code,
//       "city",
//       city,
//       "state_code",
//       state_code,
//       "postal_code",
//       postal_code,
//       "campus_address_f",
//       building,
//       "unlisted",
//       unlisted,
//       "updated_by_id",
//       updated_by_id,
//       "date_time_updated",
//       date_time_updated,
//       "created_by_id",
//       created_by_id,
//       "date_time_created",
//       date_time_created,
//       "callback_url",
//       address_url
//     ];
//     var event = eventBuilder.eventBuilder(header, body);
//     event_frame.events.event.push(event);
//
//     header[5] = event_type2;
//     body.push("verified_flag");
//     body.push(verified_flag);
//     filters.push("identity_type");
//     filters.push(identity_type);
//     filters.push("employee_type");
//     filters.push(employee_type);
//     filters.push("student_status");
//     filters.push(student_status);
//     event = eventBuilder.eventBuilder(header, body, filters);
//     event_frame.events.event.push(event);
//
//     sql_query = sql.eventPersonAddress.raiseEvent;
//     params.push(JSON.stringify(event_frame));
//     return connection["ces"].executeWithCommit(sql_query, params)
//       .then(function(){
//         sql_query = sql.enqueue.sql;
//         return connection["ces"].execute(sql_query, params)
//       })
//   }
//   else {
//     sql_query = sql.intermediaryId.get;
//     params = [address_url];
//     return connection["ces"].execute(sql_query, params)
//       .then(function (results) {
//         if (results.rows.length === 0) {
//           sql_query = sql.intermediaryId.put;
//           params = [
//             address_url,
//             " ",    // actor
//             " ",    // group_id
//             created_by_id
//           ];
//           return connection["ces"].executeWithCommit(sql_query, params)
//             .then(function () {
//               sql_query = sql.intermediaryId.get;
//               params = [address_url];
//               return connection["ces"].execute(sql_query, params)
//                 .then(function (results) {
//                   secure_url += results.rows[0]["intermediary_id"]
//                 })
//             })
//         }
//         else {
//           secure_url += results.rows[0]["intermediary_id"]
//         }
//         var restricted_body = [
//           "person_id",
//           " ",
//           "byu_id",
//           " ",
//           "net_id",
//           " ",
//           "address_type",
//           " ",
//           "address_line_1",
//           " ",
//           "address_line_2",
//           " ",
//           "address_line_3",
//           " ",
//           "address_line_4",
//           " ",
//           "country_code",
//           " ",
//           "city",
//           " ",
//           "state_code",
//           " ",
//           "postal_code",
//           " ",
//           "campus_address_f",
//           " ",
//           "unlisted",
//           unlisted,
//           "updated_by_id",
//           " ",
//           "date_time_updated",
//           " ",
//           "created_by_id",
//           " ",
//           "date_time_created",
//           " ",
//           "secure_url",
//           secure_url
//         ];
//         event = eventBuilder.eventBuilder(header, restricted_body);
//         event_frame.events.event.push(event);
//
//         header[5] = event_type2;
//         restricted_body.push("verified_flag");
//         restricted_body.push(" ");
//         filters.push("restricted");
//         filters.push(restricted);
//         event = eventBuilder.eventBuilder(header, restricted_body, filters);
//         event_frame.events.event.push(event);
//
//         sql_query = sql.eventPersonAddress.raiseEvent;
//         params = [JSON.stringify(event_frame)];
//         return connection["ces"].executeWithCommit(sql_query, params)
//           .then(function(){
//             sql_query = sql.enqueue.sql;
//             return connection["ces"].execute(sql_query, params)
//           })
//       })
//   }
// }
