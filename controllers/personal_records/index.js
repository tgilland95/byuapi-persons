"use strict";

var moment = require("moment-timezone");
var sql = require("./sql.js");
var eventBuilder = require("./../event.js");
var core = require("../../core.js");
var bluebird = require("bluebird");
var ClientError = core.ClientError;


var current_date_time;
var identity_type = "Person";
var byu_id;
var person_id;
var net_id;
var employee_type = "";
var student_status = "";
var primary_role = "";
var date_time_updated = "";
var updated_by_id;
var date_time_created;
var created_by_id;
var date_of_birth;
var deceased;
var date_of_death;
var sex;
var marital_status;
var religion_code;
var lds_unit_number;
var lds_confirmation_date;
var citizenship_country_code;
var birth_country_code;
var home_town;
var home_state_code;
var home_country_code;
var high_school_code;
var restricted;
var i20_expiration_date;
var surname;
var rest_of_name;
var first_name;
var middle_name;
var suffix;
var preferred_first_name;
var sort_name;
var display_name;
var preferred_surname;
var preferred_name;
var from_date_of_birth = "";
var from_deceased = " ";
var from_date_of_death = "";
var from_sex = " ";
var from_marital_status = " ";
var from_religion_code = " ";
var from_lds_unit_number = " ";
var from_lds_confirmation_date = "";

//This is a function used to find the authorizations allowed, but is generic.
function inArray(needle, haystack) {
  for (var i = haystack.length; i--;) {
    if (haystack[i] === needle) {
      return true
    }
  }
  return false
}

function isValidReligionCodes(religion_code) {
  var religionCode = require("../../meta/religions/religionCodes.js.json");
  var religion_codes = religionCode.items;

  for (var i = religion_codes.length; i--;) {
    if (religion_code === religion_codes[i].religion_code) {
      return true
    }
  }
  return false
}

function isValidLdsUnitCodes(lds_unit_number) {
  return true
  // var ldsUnitCode = require("../../meta/lds_unit_summaries/ldsUnitCodes.json");
  // var lds_unit_numbers = ldsUnitCode.items;
  //
  // for (var i = lds_unit_numbers.length; i--;) {
  //   if (lds_unit_number === lds_unit_numbers[i]["unit_number"]) {
  //     return true
  //   }
  // }
  // return false
}

//Performs the GET method
exports.get = function (connection, resources, request, response) {
  //Declare variables
  var params = [];
  //identify DEF.JSON file to be filled
  var def = resources.sub_resource_definitions["personal_records"];
  var sql_query = sql.getPersonalRecord.sql;

  //updates the URL to reflect the requested BYU_ID
  var links_map = {
    byu_id: request.params.resource_id[0]
  };
  core.updateHATEOASData(def.links, links_map);

  //add BYU_ID from the RESOURCE_ID in the url
  params.push(request.params.resource_id[0]);
  return connection["ces"].execute(sql_query, params)
    .then(function (results) {
      if (results.rows.length === 0) {
        throw new ClientError(404, 'BYU_ID not found in person')
      }
      if (results.rows[0].restricted === 'Y' && !inArray('person_restricted', request.params.auth)) {
        throw new ClientError(404, 'BYU_ID not found in person')
      }
      delete def.metadata.default_db;
      if (inArray("person_view_basic", request.params.auth)) {
        //fill in the METADATA of the DEF.JSON
        def.metadata.collection_size = results.rows.length;
        //process the data and fill in the DEF.JSON values and descriptions
        def = core.sqlmap.map_row(results.rows[0], def, sql.getPersonalRecord.map);
        def.metadata.validation_response.return_code = 200;
        def.date_time_updated["value"] = (results.rows[0].date_time_updated) ? moment(results.rows[0].date_time_updated)["format"]("YYYY-MM-DD HH:mm:ss.SSS") : "";
        def.date_time_created["value"] = (results.rows[0].date_time_created) ? moment(results.rows[0].date_time_created)["format"]("YYYY-MM-DD HH:mm:ss.SSS") : "";
        def.date_of_birth["value"] = (results.rows[0].date_of_birth) ? moment(results.rows[0].date_of_birth)["format"]("YYYY-MM-DD") : "";
        def.date_of_death["value"] = (results.rows[0].date_of_death) ? moment(results.rows[0].date_of_death)["format"]("YYYY-MM-DD") : "";
        def.lds_confirmation_date["value"] = (results.rows[0].lds_confirmation_date) ? moment(results.rows[0].lds_confirmation_date)["format"]("YYYY-MM-DD") : "";
        return def
      }
      else {
        if (results.rows.length === 0) {
          throw new ClientError(404, "Person not found")
        }
        def.metadata.collection_size = results.rows.length;
        def.metadata.validation_response.return_code = 203;
        def.metadata.validation_response.response = "User authorized to view PUBLIC DIRECTORY info only";
        return def
      }
    })
};

exports.put = function (connection, resources, request, response) {
  byu_id = request.params.resource_id[0];
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
  sex = request.body.sex;
  religion_code = request.body.religion_code;
  lds_unit_number = request.body.lds_unit_number;
  lds_confirmation_date = (!request.body.lds_confirmation_date || request.body.lds_confirmation_date === " ") ? "" : moment(request.body.lds_confirmation_date, accepted_date_formats)["format"]("YYYY-MM-DD");
  if (!request.body.date_of_birth || request.body.date_of_birth === " ") {
    date_of_birth = ""
  }
  else {
    date_of_birth = moment(request.body.date_of_birth, accepted_date_formats)["format"]("YYYY-MM-DD")
  }
  if (!request.body.date_of_death || request.body.date_of_death === " ") {
    date_of_death = ""
  }
  else {
    date_of_death = moment(request.body.date_of_death, accepted_date_formats)["format"]("YYYY-MM-DD")
  }
  if ((!request.body.deceased ||
      (request.body.deceased === " "))
    && !date_of_death) {
    deceased = "N"
  }
  else if (date_of_death) {
    deceased = "Y"
  }
  else {
    deceased = request.body.deceased
  }
  if (!request.body.marital_status || request.body.marital_status === " ") {
    marital_status = "?"
  }
  else {
    marital_status = request.body.marital_status
  }
  current_date_time = moment();
  updated_by_id = request.body.updated_by_id;
  if (!updated_by_id || (updated_by_id === " ")) {
    updated_by_id = request.verifiedJWTs.authorized_byu_id
  }
  date_time_updated = request.body.date_time_updated;
  if (!date_time_updated || (date_time_updated === " ")) {
    date_time_updated = current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS")
  }
  else {
    date_time_updated = moment["tz"](date_time_updated, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS")
  }
  var change_type;
  var auth = request.params.auth;


  var basic_elements = [
    "date_of_birth",
    "date_of_death",
    "lds_confirmation_date",
    "deceased",
    "sex",
    "marital_status",
    "religion_code",
    "lds_unit_number"
  ];
  var error = false;
  var msg = "Incorrect BODY: Missing ";
  basic_elements.forEach(function (item) {
    if (request.body[item] === undefined) {
      switch (item) {
        case "date_of_birth":
        case "date_of_death":
        case "lds_confirmation_date":
          msg += "\n\"" + item + "\": \"\",";
          break;
        case "lds_unit_number":
          msg += "\n\"" + item + "\": \" \"";
          break;
        default:
          msg += "\n\"" + item + "\": \" \","
      }
      error = true
    }
    else if (request.body[item] === "") {
      switch (request.body[item]) {
        case "date_of_death":
        case "date_of_birth":
        case "lds_confirmation_date":
          break;
        default:
          request.body[item] = " "
      }
    }
  });
  switch (sex) {
    case "M":
    case "F":
    case "?":
      break;
    default:
      msg += "\n\tsex must be M, F, or ?";
      error = true
  }
  switch (marital_status) {
    case "D":
    case "M":
    case "S":
    case "W":
    case "?":
      break;
    default:
      msg += "\n\tmarital_status must be D, M, S, W, or ?";
      error = true
  }
  switch (deceased) {
    case "Y":
    case "N":
      break;
    default:
      msg += "\n\tdeceased must be a space, Y, or N";
      error = true
  }
  if (date_of_birth &&
    (moment(date_of_birth, "YYYY-MM-DD") < moment("1850-01-01", "YYYY-MM-DD")) ||
    (moment(date_of_birth, "YYYY-MM-DD") > current_date_time)) {
    msg += "\n\tdate_of_birth must be after 1850 and before tomorrow";
    error = true
  }
  if (date_of_death &&
    ((moment(date_of_death, "YYYY-MM-DD") < moment(date_of_birth, "YYYY-MM-DD")) ||
      (moment(date_of_death, "YYYY-MM-DD") > current_date_time))) {
    msg += "\n\tdate_of_death must be after date_of_birth and before tomorrow";
    error = true
  }
  if (lds_confirmation_date &&
    ((moment(lds_confirmation_date, "YYYY-MM-DD") < moment(date_of_birth, "YYYY-MM-DD")) ||
      (moment(lds_confirmation_date, "YYYY-MM-DD") > current_date_time))) {
    msg += "\n\tlds_confirmation_date must be after date_of_birth and before tomorrow";
    error = true
  }
  if (!isValidReligionCodes(religion_code)) {
    msg += "\n\treligion_code is not recognized";
    error = true
  }
  if (!isValidLdsUnitCodes(lds_unit_number)) {
    msg += "\n\tlds_unit_number is not valid";
    error = true
  }
  if (error) {
    throw new ClientError(409, msg)
  }
  if (!inArray("person_update_basic", auth) && !inArray("person_is_lds_sync", auth)) {
    throw new ClientError(403, "User not authorized to update PERSON data")
  }
  return (function () {
    //build SQL query to check if BYU_ID has an address of the specified type
    var params = [];
    var sql_query = sql.getPersonalRecord.sql;
    params.push(byu_id);
    return connection["ces"].execute(sql_query, params)
      .then(function (results) {
        if (results.rows.length === 0) {
          throw new ClientError(404, "BYU_ID Not Found To Update, If this is a new person use POST")
        }
        change_type = "C";
        person_id = results.rows[0].person_id;
        net_id = results.rows[0].net_id;
        employee_type = results.rows[0].employee_type;
        student_status = results.rows[0].student_status;
        primary_role = results.rows[0].primary_role;
        preferred_name = results.rows[0].preferred_name;
        display_name = preferred_name;
        from_lds_confirmation_date = (results.rows[0].lds_confirmation_date === null) ? "" : results.rows[0].lds_confirmation_date;
        from_deceased = results.rows[0].deceased;
        from_religion_code = results.rows[0].religion_code;
        from_lds_unit_number = results.rows[0].lds_unit_number;
        if (results.rows[0].date_time_created) {
          date_time_created = moment(results.rows[0].date_time_created, accepted_date_formats)["format"]("YYYY-MM-DD HH:mm:ss.SSS")
        }
        else {
          date_time_created = date_time_updated
        }
        var created_by_id = results.rows[0].created_by_id;
        if (results.rows[0].date_of_birth) {
          from_date_of_birth = moment(results.rows[0].date_of_birth, accepted_date_formats)["startOf"]("day").format("YYYY-MM-DD")
        }
        else {
          from_date_of_birth = ""
        }
        if (!from_deceased || from_deceased === " ") {
          from_deceased = "N"
        }
        if (results.rows[0].date_of_death) {
          from_date_of_death = moment(results.rows[0].date_of_death, accepted_date_formats)["startOf"]("day").format("YYYY-MM-DD")
        }
        else {
          from_date_of_death = ""
        }
        if (!results.rows[0].sex || results.rows[0].sex === " ") {
          from_sex = "?"
        }
        else {
          from_sex = results.rows[0].sex
        }
        if (!results.rows[0].marital_status || results.rows[0].marital_status === " ") {
          from_marital_status = "?"
        }
        else {
          from_marital_status = results.rows[0].marital_status
        }
        citizenship_country_code = results.rows[0].citizenship_country_code;
        birth_country_code = results.rows[0].birth_country_code;
        home_town = results.rows[0].home_town;
        home_state_code = results.rows[0].home_state_code;
        home_country_code = results.rows[0].home_country_code;
        high_school_code = results.rows[0].high_school_code;
        restricted = results.rows[0].restricted;
        var ssn = results.rows[0].ssn;
        var ssn_verification_date;
        if (results.rows[0].ssn_verification_date) {
          ssn_verification_date = moment(results.rows[0].ssn_verification_date, accepted_date_formats)["format"]("YYYY-MM-DD")
        }
        else {
          ssn_verification_date = ""
        }
        var visa_type = results.rows[0].visa_type;
        if (!visa_type) {
          visa_type = " "
        }
        if (results.rows[0].i20_expiration_date) {
          i20_expiration_date = moment(results.rows[0].i20_expiration_date, accepted_date_formats)["format"]("YYYY-MM-DD")
        }
        else {
          i20_expiration_date = ""
        }

        var visa_type_source = results.rows[0].visa_type_source;
        if (!visa_type_source) {
          visa_type_source = " "
        }
        var DoD_dif = false;
        if ((date_of_death !== from_date_of_death) ||
          (date_of_birth !== from_date_of_birth) ||
          (deceased !== from_deceased) ||
          (sex !== from_sex)) {
          if (!inArray("person_update_DoB-DoD", auth)) {
            throw new ClientError(403, "User not authorized to update deceased, date_of_death, date_of_birth, or sex")
          }
          DoD_dif = true
        }
        var lds_unit_number_dif = false;
        if (results.rows[0].lds_unit_number !== lds_unit_number) {
          if (!inArray("person_update_lds", auth) && !inArray("person_is_lds_sync", auth)) {
            throw new ClientError(403, "User not authorized to update lds_unit_number")
          }
          lds_unit_number_dif = true
        }
        var lds_confirmation_date_dif = false;
        if (lds_confirmation_date !== from_lds_confirmation_date) {
          if (!inArray("person_update_lds", auth) && !inArray("person_is_lds_sync", auth)) {
            throw new ClientError(403, "User not authorized to update lds_confirmation_date")
          }
          lds_confirmation_date_dif = true;
        }
        var rel_code_dif = false;
        if (religion_code !== from_religion_code) {
          if (!inArray("person_update_religion", auth) && !inArray("person_is_lds_sync", auth)) {
            throw new ClientError(403, "User not authorized to update religion")
          }
          rel_code_dif = true
        }
        var married_dif = false;
        if (marital_status !== from_marital_status) {
          married_dif = true
        }

        if (!DoD_dif && !rel_code_dif && !married_dif && !lds_unit_number_dif && !lds_confirmation_date_dif) {
          return ""
        }
        else {
          //select new SQL query to update record
          sql_query = sql.modifyPersonalRecord.update;
          params = [];//clears out previous params
          params.push(date_time_updated);
          params.push(updated_by_id);
          params.push(date_of_birth);
          params.push(date_of_death);
          params.push(deceased);
          params.push(sex);
          params.push(marital_status);
          params.push(religion_code);
          params.push(lds_unit_number);
          console.log("XXXXXXXXXXXXXX;", lds_confirmation_date);
          params.push(lds_confirmation_date);
          params.push(byu_id);
          return connection["ces"].executeWithCommit(sql_query, params)
            .then(function () {
              if (rel_code_dif && inArray("person_is_lds_sync", auth)) {
                sql_query = ""
                  + "update pro.person "
                  + "set    religion_code = :RELIGION_CODE, "
                  + "       updated_by_id = '280262482', "
                  + "       date_time_updated = sysdate "
                  + "where  byu_id = :BYU_ID";
                params = [
                  religion_code,
                  byu_id
                ];
                return connection["ces"].executeWithCommit(sql_query, params)
              }
            })
            .then(function () {
              //select new SQL query to log changes
              sql_query = sql.modifyPersonalRecord.logChange;
              //params for change log
              params.pop();
              params.push(citizenship_country_code);
              params.push(birth_country_code);
              params.push(ssn);
              params.push(ssn_verification_date);
              params.push(visa_type);
              params.push(visa_type_source);
              params.push(i20_expiration_date);
              params.push(from_date_of_birth);
              params.push(from_deceased);
              params.push(from_date_of_death);
              params.push(from_sex);
              params.push(from_marital_status);
              params.push(from_religion_code);
              params.push(from_lds_unit_number);
              params.push(citizenship_country_code);
              params.push(birth_country_code);
              params.push(home_town);
              params.push(home_state_code);
              params.push(home_country_code);
              params.push(high_school_code);
              params.push(restricted);
              params.push(ssn);
              params.push(ssn_verification_date);
              params.push(visa_type);
              params.push(i20_expiration_date);
              params.push(visa_type_source);
              params.push(from_lds_confirmation_date);
              params.push(home_town);
              params.push(home_state_code);
              params.push(home_country_code);
              params.push(high_school_code);
              params.push(restricted);
              params.push(change_type);
              params.unshift(created_by_id);
              params.unshift(date_time_created);
              params.unshift(byu_id);
              return connection["ces"].executeWithCommit(sql_query, params)
            })
            .then(function () {
              return personalRecordChangedEvents(connection, request)
            })
        }
      })
      .then(function () {
        return exports.get(connection, resources, request, response)
      })
  })()
};

exports.delete = function () {
  throw new ClientError(405, "This information is attached to a person record therefore you may not delete it."
    + "\nUse PUT to update personal_record fields to \"\" or \" \" as appropriate.")
};

function personalRecordChangedEvents(connection) {
  var source_dt = moment()['tz']("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var event_type = "Person Changed";
  var event_type2 = "Person Changed v2";
  var domain = "edu.byu";
  var entity = "BYU-IAM";
  var filters = [];
  var identity_type = "PERSON";
  var basic_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id;
  var personal_records_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id + "/personal_records";
  var secure_url = "https://api.byu.edu/domains/legacy/identity/secureurl/v1/";
  var personal_records_secure_url = "";
  var event_frame = {
    "events": {
      "event": []
    }
  };
  var sql_query = sql.eventPerson.raiseEvent;
  var params = [];
  if (restricted !== "Y") {
    var header = [];
    header.push("domain");
    header.push(domain);
    header.push("entity");
    header.push(entity);
    header.push("event_type");
    header.push(event_type);
    header.push("source_dt");
    header.push(source_dt);
    header.push("event_dt");
    header.push(" ");
    header.push("event_id");
    header.push(" ");
    var body = [];
    body.push("person_id");
    body.push(person_id);
    body.push("byu_id");
    body.push(byu_id);
    body.push("net_id");
    body.push(net_id);
    body.push("updated_by_id");
    body.push(updated_by_id);
    body.push("date_time_updated");
    body.push(date_time_updated);
    body.push("created_by_id");
    body.push(created_by_id);
    body.push("date_time_created");
    body.push(date_time_created);
    body.push("callback_url");
    body.push(basic_url);
    body.push("surname");
    body.push(surname);
    body.push("rest_of_name");
    body.push(rest_of_name);
    body.push("first_name");
    body.push(first_name);
    body.push("middle_name");
    body.push(middle_name);
    body.push("suffix");
    body.push(suffix);
    body.push("preferred_first_name");
    body.push(preferred_first_name);
    body.push("sort_name");
    body.push(sort_name);
    body.push("home_town");
    body.push(home_town);
    body.push("home_state_code");
    body.push(home_state_code);
    body.push("home_country_code");
    body.push(home_country_code);
    body.push("deceased");
    body.push(deceased);
    body.push("sex");
    body.push(sex);
    body.push("display_name");
    body.push(display_name);
    body.push("prefix");
    body.push(" ");
    body.push("surname_position");
    body.push(" ");
    var event = eventBuilder.eventBuilder(header, body);
    event_frame.events.event.push(event);

    //start of event v2
    header[5] = event_type2;
    //get rid of prefix and surname position
    for (var i = 6; i--;) {
      body.pop();
    }
    body.unshift(preferred_surname);
    body.unshift("preferred_surname");
    body.unshift(preferred_name);
    body.unshift("preferred_name");
    body.unshift(high_school_code);
    body.unshift("high_school_code");
    filters.push("identity_type");
    filters.push(identity_type);
    filters.push("employee_type");
    filters.push(employee_type);
    filters.push("student_status");
    filters.push(student_status);
    event = eventBuilder.eventBuilder(header, body, filters);
    event_frame.events.event.push(event);

    if (from_date_of_birth !== date_of_birth) {
      event_type = "Birthday Changed";
      header[5] = event_type;
      body = [];
      body.push("person_id");
      body.push(person_id);
      body.push("byu_id");
      body.push(byu_id);
      body.push("net_id");
      body.push(net_id);
      body.push("updated_by_id");
      body.push(updated_by_id);
      body.push("date_time_updated");
      body.push(date_time_updated);
      body.push("created_by_id");
      body.push(created_by_id);
      body.push("date_time_created");
      body.push(date_time_created);
      body.push("callback_url");
      body.push(personal_records_url);
      event = eventBuilder.eventBuilder(header, body);
      event_frame.events.event.push(event);

      event_type2 = "Birthday Changed v2";
      header[5] = event_type2;
      event = eventBuilder.eventBuilder(header, body, filters);
      event_frame.events.event.push(event)
    }

    //deceased is set to yes if date_of_death is not null
    if ((from_deceased !== "Y") && (deceased === "Y")) {
      event_type = "Person Deceased";
      header[5] = event_type;
      body = [];
      body.push("person_id");
      body.push(person_id);
      body.push("byu_id");
      body.push(byu_id);
      body.push("net_id");
      body.push(net_id);
      body.push("deceased");
      body.push(deceased);
      body.push("date_of_death");
      body.push(date_of_death);
      body.push("updated_by_id");
      body.push(updated_by_id);
      body.push("date_time_updated");
      body.push(date_time_updated);
      body.push("created_by_id");
      body.push(created_by_id);
      body.push("date_time_created");
      body.push(date_time_created);
      body.push("callback_url");
      body.push(personal_records_url);
      event = eventBuilder.eventBuilder(header, body);
      event_frame.events.event.push(event);

      event_type2 = "Person Deceased v2";
      header[5] = event_type2;
      event = eventBuilder.eventBuilder(header, body, filters);
      event_frame.events.event.push(event)
    }

    if (((from_deceased === "Y") ||
        from_date_of_death) &&
      deceased === "N") {
      event_type = "Person Un-deceased";
      header[5] = event_type;
      body = [];
      body.push("person_id");
      body.push(person_id);
      body.push("byu_id");
      body.push(byu_id);
      body.push("net_id");
      body.push(net_id);
      body.push("deceased");
      body.push(deceased);
      body.push("updated_by_id");
      body.push(updated_by_id);
      body.push("date_time_updated");
      body.push(date_time_updated);
      body.push("created_by_id");
      body.push(created_by_id);
      body.push("date_time_created");
      body.push(date_time_created);
      body.push("callback_url");
      body.push(personal_records_url);
      event = eventBuilder.eventBuilder(header, body);
      event_frame.events.event.push(event);

      event_type2 = "Person Un-deceased v2";
      header[5] = event_type2;
      event = eventBuilder.eventBuilder(header, body, filters);
      event_frame.events.event.push(event)
    }

    if (from_marital_status !== "M" && marital_status === "M") {
      event_type = "Person Married";
      header[5] = event_type;
      body = [];
      body.push("person_id");
      body.push(person_id);
      body.push("byu_id");
      body.push(byu_id);
      body.push("net_id");
      body.push(net_id);
      body.push("updated_by_id");
      body.push(updated_by_id);
      body.push("date_time_updated");
      body.push(date_time_updated);
      body.push("created_by_id");
      body.push(created_by_id);
      body.push("date_time_created");
      body.push(date_time_created);
      body.push("callback_url");
      body.push(personal_records_url);
      event = eventBuilder.eventBuilder(header, body, filters);
      event_frame.events.event.push(event);

      if ((primary_role === "Employee" ||
          primary_role === "Faculty") &&
        employee_type.match(/(?=.*?-FT-)/)) {
        event_type2 = "Full-time Employee Married";
        header[5] = event_type2;
        event = eventBuilder.eventBuilder(header, body);
        event_frame.events.event.push(event)
      }
      if (primary_role === "Student") {
        event_type2 = "Student Married";
        header[5] = event_type2;
        event = eventBuilder.eventBuilder(header, body);
        event_frame.events.event.push(event)
      }

    }

    if (from_marital_status === "M" && marital_status !== "M") {
      event_type = "Person Un-married";
      header[5] = event_type;
      body = [];
      body.push("secure_url");
      body.push(personal_records_secure_url);
      event = eventBuilder.eventBuilder(header, body, filters);
      event_frame.events.event.push(event);

      if ((primary_role === "Employee" ||
          primary_role === "Faculty") &&
        employee_type.match(/(?=.*?-FT-)/)) {
        event_type2 = "Full-time Employee Un-married";
        header[5] = event_type2;
        event = eventBuilder.eventBuilder(header, body);
        event_frame.events.event.push(event)
      }
      if (primary_role === "Student") {
        event_type2 = "Student Un-married";
        header[5] = event_type2;
        event = eventBuilder.eventBuilder(header, body);
        event_frame.events.event.push(event)
      }

    }
    if (from_religion_code !== "LDS" && religion_code === "LDS") {
      event_type = "Person Converted to LDS";
      header[5] = event_type;
      body = [];
      body.push("secure_url");
      body.push(personal_records_secure_url);
      event = eventBuilder.eventBuilder(header, body);
      event_frame.events.event.push(event);

      event_type2 = "Person Converted to LDS v2";
      header[5] = event_type2;
      event = eventBuilder.eventBuilder(header, body, filters);
      event_frame.events.event.push(event)
    }

    if (from_religion_code === "LDS" && religion_code !== "LDS") {
      event_type = "Person Converted from LDS";
      header[5] = event_type;
      body = [];
      body.push("secure_url");
      body.push(personal_records_secure_url);
      event = eventBuilder.eventBuilder(header, body);
      event_frame.events.event.push(event);

      event_type2 = "Person Converted from LDS v2";
      header[5] = event_type2;
      event = eventBuilder.eventBuilder(header, body, filters);
      event_frame.events.event.push(event)
    }

    if (from_lds_unit_number !== lds_unit_number) {
      event_type = "LDS Unit Changed";
      header[5] = event_type;
      body = [];
      body.push("person_id");
      body.push(person_id);
      body.push("byu_id");
      body.push(byu_id);
      body.push("net_id");
      body.push(net_id);
      body.push("lds_unit_number");
      body.push(lds_unit_number);
      body.push("updated_by_id");
      body.push(updated_by_id);
      body.push("date_time_updated");
      body.push(date_time_updated);
      body.push("created_by_id");
      body.push(created_by_id);
      body.push("date_time_created");
      body.push(date_time_created);
      body.push("callback_url");
      body.push(personal_records_url);
      body.push(personal_records_secure_url);
      event = eventBuilder.eventBuilder(header, body);
      event_frame.events.event.push(event);

      event_type2 = "LDS Unit Changed v2";
      header[5] = event_type2;
      event = eventBuilder.eventBuilder(header, body, filters);
      event_frame.events.event.push(event)
    }
  }
  else {
    header = [];
    header.push("domain");
    header.push(domain);
    header.push("entity");
    header.push(entity);
    header.push("event_type");
    header.push(event_type);
    header.push("source_dt");
    header.push(source_dt);
    header.push("event_dt");
    header.push(" ");
    header.push("event_id");
    header.push(" ");
    body = [];
    body.push("person_id");
    body.push(" ");
    body.push("byu_id");
    body.push(" ");
    body.push("net_id");
    body.push(" ");
    body.push("updated_by_id");
    body.push(" ");
    body.push("date_time_updated");
    body.push(" ");
    body.push("created_by_id");
    body.push(" ");
    body.push("date_time_created");
    body.push(" ");
    body.push("callback_url");
    body.push(" ");
    body.push("surname");
    body.push(" ");
    body.push("rest_of_name");
    body.push(" ");
    body.push("first_name");
    body.push(" ");
    body.push("middle_name");
    body.push(" ");
    body.push("suffix");
    body.push(" ");
    body.push("preferred_first_name");
    body.push(" ");
    body.push("sort_name");
    body.push(" ");
    body.push("home_town");
    body.push(" ");
    body.push("home_state_code");
    body.push(" ");
    body.push("home_country_code");
    body.push(" ");
    body.push("deceased");
    body.push(" ");
    body.push("sex");
    body.push(" ");
    body.push("display_name");
    body.push(" ");
    body.push("prefix");
    body.push(" ");
    body.push("surname_position");
    body.push(" ");
    event = eventBuilder.eventBuilder(header, body);
    event_frame.events.event.push(event);

    //start of event v2
    header[5] = event_type2;
    //get rid of prefix and surname position
    for (i = 6; i--;) {
      body.pop();
    }
    body.unshift(" ");
    body.unshift("preferred_surname");
    body.unshift(" ");
    body.unshift("preferred_name");
    body.unshift(" ");
    body.unshift("high_school_code");
    filters.push("restricted");
    filters.push(restricted);
    event = eventBuilder.eventBuilder(header, body, filters);
    event_frame.events.event.push(event);

    if (from_date_of_birth !== date_of_birth) {
      event_type = "Birthday Changed";
      header[5] = event_type;
      body = [];
      body.push("person_id");
      body.push(" ");
      body.push("byu_id");
      body.push(" ");
      body.push("net_id");
      body.push(" ");
      body.push("updated_by_id");
      body.push(" ");
      body.push("date_time_updated");
      body.push(" ");
      body.push("created_by_id");
      body.push(" ");
      body.push("date_time_created");
      body.push(" ");
      body.push("secure_url");
      body.push(personal_records_secure_url);
      event = eventBuilder.eventBuilder(header, body);
      event_frame.events.event.push(event);

      event_type2 = "Birthday Changed v2";
      header[5] = event_type2;
      event = eventBuilder.eventBuilder(header, body, filters);
      event_frame.events.event.push(event)
    }

    //deceased is set to yes if date_of_death is not null
    if ((from_deceased !== "Y") && (deceased === "Y")) {
      event_type = "Person Deceased";
      header[5] = event_type;
      body = [];
      body.push("person_id");
      body.push(" ");
      body.push("byu_id");
      body.push(" ");
      body.push("net_id");
      body.push(" ");
      body.push("deceased");
      body.push(" ");
      body.push("date_of_death");
      body.push(" ");
      body.push("updated_by_id");
      body.push(" ");
      body.push("date_time_updated");
      body.push(" ");
      body.push("created_by_id");
      body.push(" ");
      body.push("date_time_created");
      body.push(" ");
      body.push("secure_url");
      body.push(personal_records_secure_url);
      event = eventBuilder.eventBuilder(header, body);
      event_frame.events.event.push(event);

      event_type2 = "Person Deceased v2";
      header[5] = event_type2;
      event = eventBuilder.eventBuilder(header, body, filters);
      event_frame.events.event.push(event)
    }

    if (((from_deceased === "Y") ||
        from_date_of_death) &&
      deceased === "N") {
      event_type = "Person Un-deceased";
      header[5] = event_type;
      body = [];
      body.push("person_id");
      body.push(" ");
      body.push("byu_id");
      body.push(" ");
      body.push("net_id");
      body.push(" ");
      body.push("deceased");
      body.push(" ");
      body.push("updated_by_id");
      body.push(" ");
      body.push("date_time_updated");
      body.push(" ");
      body.push("created_by_id");
      body.push(" ");
      body.push("date_time_created");
      body.push(" ");
      body.push("secure_url");
      body.push(personal_records_secure_url);
      event = eventBuilder.eventBuilder(header, body);
      event_frame.events.event.push(event);

      event_type2 = "Person Un-deceased v2";
      header[5] = event_type2;
      event = eventBuilder.eventBuilder(header, body, filters);
      event_frame.events.event.push(event)
    }

    if (from_marital_status !== "M" && marital_status === "M") {
      event_type = "Person Married";
      header[5] = event_type;
      body = [];
      body.push("person_id");
      body.push(" ");
      body.push("byu_id");
      body.push(" ");
      body.push("net_id");
      body.push(" ");
      body.push("updated_by_id");
      body.push(" ");
      body.push("date_time_updated");
      body.push(" ");
      body.push("created_by_id");
      body.push(" ");
      body.push("date_time_created");
      body.push(" ");
      body.push("secure_url");
      body.push(personal_records_secure_url);
      event = eventBuilder.eventBuilder(header, body, filters);
      event_frame.events.event.push(event);

      if ((primary_role === "Employee" ||
          primary_role === "Faculty") &&
        employee_type.match(/(?=.*?-FT-)/)) {
        event_type2 = "Full-time Employee Married";
        header[5] = event_type2;
        event = eventBuilder.eventBuilder(header, body);
        event_frame.events.event.push(event)
      }
      if (primary_role === "Student") {
        event_type2 = "Student Married";
        header[5] = event_type2;
        event = eventBuilder.eventBuilder(header, body);
        event_frame.events.event.push(event)
      }

    }

    if (from_marital_status === "M" && marital_status !== "M") {
      event_type = "Person Un-married";
      header[5] = event_type;
      body = [];
      body.push("secure_url");
      body.push(personal_records_secure_url);
      event = eventBuilder.eventBuilder(header, body, filters);
      event_frame.events.event.push(event);

      if ((primary_role === "Employee" ||
          primary_role === "Faculty") &&
        employee_type.match(/(?=.*?-FT-)/)) {
        event_type2 = "Full-time Employee Un-married";
        header[5] = event_type2;
        event = eventBuilder.eventBuilder(header, body);
        event_frame.events.event.push(event)
      }
      if (primary_role === "Student") {
        event_type2 = "Student Un-married";
        header[5] = event_type2;
        event = eventBuilder.eventBuilder(header, body);
        event_frame.events.event.push(event)
      }

    }
    if (from_religion_code !== "LDS" && religion_code === "LDS") {
      event_type = "Person Converted to LDS";
      header[5] = event_type;
      body = [];
      body.push("secure_url");
      body.push(personal_records_secure_url);
      event = eventBuilder.eventBuilder(header, body);
      event_frame.events.event.push(event);

      event_type2 = "Person Converted to LDS v2";
      header[5] = event_type2;
      event = eventBuilder.eventBuilder(header, body, filters);
      event_frame.events.event.push(event)
    }

    if (from_religion_code === "LDS" && religion_code !== "LDS") {
      event_type = "Person Converted from LDS";
      header[5] = event_type;
      body = [];
      body.push("secure_url");
      body.push(personal_records_secure_url);
      event = eventBuilder.eventBuilder(header, body);
      event_frame.events.event.push(event);

      event_type2 = "Person Converted from LDS v2";
      header[5] = event_type2;
      event = eventBuilder.eventBuilder(header, body, filters);
      event_frame.events.event.push(event)
    }

    if (from_lds_unit_number !== lds_unit_number) {
      event_type = "LDS Unit Changed";
      header[5] = event_type;
      body = [];
      body.push("person_id");
      body.push(" ");
      body.push("byu_id");
      body.push(" ");
      body.push("net_id");
      body.push(" ");
      body.push("lds_unit_number");
      body.push(" ");
      body.push("updated_by_id");
      body.push(" ");
      body.push("date_time_updated");
      body.push(" ");
      body.push("created_by_id");
      body.push(" ");
      body.push("date_time_created");
      body.push(" ");
      body.push("secure_url");
      body.push(personal_records_secure_url);
      event = eventBuilder.eventBuilder(header, body);
      event_frame.events.event.push(event);

      event_type2 = "LDS Unit Changed v2";
      header[5] = event_type2;
      event = eventBuilder.eventBuilder(header, body, filters);
      event_frame.events.event.push(event)
    }
  }
  params.push(JSON.stringify(event_frame));
  return connection["ces"].executeWithCommit(sql_query, params)
    .then(function () {
      console.log("ENQUEUE SQL", sql_query);
      console.log("ENQUEUE PARAMS", params);
      sql_query = sql.enqueue.sql;
      return connection["ces"].executeWithCommit(sql_query, params)
    })
    .catch(function (error) {
      console.error(error.stack);
      throw new ClientError(207, "Check ENQUEUE");
    })
}