"use strict";

var moment = require("moment-timezone");
var sql = require("./sql.js");
var eventBuilder = require("./../event.js");
var core = require("../../core.js");
var bluebird = require("bluebird");
var ClientError = core.ClientError;


var current_date_time;
var byu_id;
var date_time_updated;
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
var visa_type;
var i20_expiration_date;
var visa_type_source;
var person_id;
var net_id;
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
var employee_type;
var student_status;
var primary_role;
var name_fnf;
var ssn;
var ssn_verification_date;
var from_ssn;
var from_ssn_verification_date;
var from_citizenship_country_code;
var from_birth_country_code;
var from_i20_expiration_date;

//This is a function used to find the authorizations allowed, but is generic.
function inArray(needle, haystack) {
  for (var i = haystack.length; i--;) {
    if (haystack[i] === needle) {
      return true
    }
  }
  return false
}

//Checks to see if the country input matches our list of known country codes
// if it does not then an error is returned
function isValidCountryCode(country_code) {
  if (/^([?]{3}|UK|HK|EL|CW|SX|[A-Z]{3})$/.test(country_code)) {
    var countryCode = require("../../meta/countries/countryCodes.json");
    var country_codes = countryCode.items;

    for (var i = country_codes.length; i--;) {
      if (country_code === country_codes[i].country_code) {
        return true
      }
    }
  }
  else {
    return false
  }
}

function isValidVisaStatuses(visa_type) {
    return true
  // var visaStatus = require("../../meta/visa_statuses/visaStatuses.json");
  // var visa_statuses = visaStatus.items;
  // if (visa_type) {
  //   for (var i = visa_statuses.length; i--;) {
  //     if (visa_type === visa_statuses[i]["domain_value"]) {
  //       return true
  //     }
  //   }
  //   return false
  // }
  // else {
  //   return true
  // }
}

function isValidVisaTypeSource(visa_type_source) {
  switch (visa_type_source) {
    case "ADM":
    case "FSA":
    case "HR":
    case "INTL":
    case " ":
    case "":
      return true;
    default:
      return false
  }
}

//Performs the GET method
exports.get = function (connection, resources, request, response) {
  //Declare variables
  var params = [];
  //identify DEF.JSON file to be filled
  var def = resources.sub_resource_definitions["government_records"];
  var sql_query = sql.getGovernmentRecords.sql;

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
        def = core.sqlmap.map_row(results.rows[0], def, sql.getGovernmentRecords.map);
        def.metadata.validation_response.return_code = 200;
        if (!inArray("person_view_ssn", request.params.auth)) {
          def.metadata.validation_response.return_code = 203;
          def.metadata.validation_response.response = "User not authorized to view SSN data";
          def.ssn.value = "";
          def.ssn_verification_date.value = ""
        }
        //display the DEF.JSON filled out
        def.date_time_updated.value = moment(results.rows[0].date_time_updated)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
        def.date_time_created.value = moment(results.rows[0].date_time_created)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
        return def
      }
      else {
        if (results.rows.length === 0) {
          throw new ClientError(404, "Person not found")
        }
        def = core.sqlmap.map_row(results.rows[0], def, sql.getGovernmentRecords.public_map);
        def.metadata.collection_size = results.rows.length;
        def.metadata.validation_response.return_code = 203;
        def.metadata.validation_response.response = "User authorized to view PUBLIC DIRECTORY info only";
        return def
      }
    })
};

exports.put = function (connection, resources, request, response) {
  var req_body = request.body;
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
  citizenship_country_code = req_body.citizenship_country_code;
  birth_country_code = req_body.birth_country_code;
  ssn = req_body.ssn;
  ssn_verification_date = req_body.ssn_verification_date;
  if (ssn_verification_date) {
    ssn_verification_date = moment["tz"](ssn_verification_date, accepted_date_formats, "America/Denver").startOf("day").format("YYYY-MM-DD")
  }
  visa_type = req_body.visa_type;
  if (!visa_type) {
    visa_type = " "
  }
  visa_type_source = req_body.visa_type_source;
  if (!visa_type_source) {
    visa_type_source = " "
  }
  i20_expiration_date = req_body.i20_expiration_date;
  if (i20_expiration_date) {
    i20_expiration_date = moment["tz"](i20_expiration_date, accepted_date_formats, "America/Denver").endOf("day").format("YYYY-MM-DD")
  }
  current_date_time = moment();
  updated_by_id = req_body.updated_by_id;
  if (!updated_by_id || (updated_by_id === " ")) {
    updated_by_id = request.verifiedJWTs.authorized_byu_id
  }
  date_time_updated = req_body.date_time_updated;
  if (!date_time_updated || (date_time_updated === " ")) {
    date_time_updated = current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS")
  }
  else {
    date_time_updated = moment["tz"](date_time_updated, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS")
  }
  var change_type;
  var auth = request.params.auth;


  var basic_elements = [
    "citizenship_country_code",
    "birth_country_code",
    "ssn",
    "ssn_verification_date",
    "visa_type",
    "visa_type_source",
    "i20_expiration_date"
  ];
  var error = false;
  var msg = "Incorrect BODY: Missing ";
  basic_elements.forEach(function (item) {
    if (req_body[item] === undefined) {
      switch (item) {
        case "ssn":
        case "ssn_verification_date":
        case "visa_type":
        case "visa_type_source":
          msg += "\n\"" + item + "\": \"\",";
          break;
        case "i20_expiration_date":
          msg += "\n\"" + item + "\": \"\"";
          break;
        default:
          msg += "\n\"" + item + "\": \" \","
      }
      error = true
    }
    else if (req_body[item] === "") {
      switch (req_body[item]) {
        case "ssn_verification_date":
        case "ssn":
        case "visa_type_source":
        case "visa_type":
        case "i20_expiration_date":
          break;
        default:
          req_body[item] = " "
      }
    }
  });
  if (!isValidVisaTypeSource(visa_type_source)) {
    msg += "\n\tInvalid Body: Visa Type Source must be 'ADM' 'FSA' 'HR' 'INTL' space or null";
    error = true
  }
  if (ssn && !ssn.match(/^( |[0-9]{9})$/)) {
    msg += "Incorrect URL: SSN must be a 9 digit number with no spaces or dashes";
    error = true
  }
  if (ssn_verification_date &&
    (moment["tz"](ssn_verification_date, "YYYY-MM-DD", "America/Denver") < moment["tz"]("2004-01-01", "YYYY-MM-DD", "America/Denver")) ||
    (moment["tz"](ssn_verification_date, "YYYY-MM-DD", "America/Denver") > moment["tz"]("America/Denver"))) {
    msg += "\n\tssn_verification_date must be after 2004 and before tomorrow";
    error = true
  }
  if (!isValidCountryCode(citizenship_country_code)) {
    msg += "\n\tcitizenship_country_code is invalid";
    error = true
  }
  if (!isValidCountryCode(birth_country_code)) {
    msg += "\n\tbirth_country_code is invalid";
    error = true
  }
  if (!isValidVisaStatuses(visa_type)) {
    msg += "\n\tvisa_type is invalid";
    error = true
  }
  if (error) {
    throw new ClientError(409, msg)
  }
  if (!inArray("person_update_basic", auth)) {
    throw new ClientError(403, "User not authorized to update PERSON data")
  }
  return (function () {
    //build SQL query to check if BYU_ID has an address of the specified type
    var params = [];
    var sql_query = sql.getGovernmentRecords.sql;
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
        name_fnf = results.rows[0].name_fnf;
        if (results.rows[0].date_time_created) {
          date_time_created = moment(results.rows[0].date_time_created, accepted_date_formats)["format"]("YYYY-MM-DD HH:mm:ss.SSS")
        }
        else {
          date_time_created = date_time_updated
        }
        var created_by_id = results.rows[0].created_by_id;
        if (results.rows[0].date_of_birth) {
          date_of_birth = moment(results.rows[0].date_of_birth, accepted_date_formats)["startOf"]("day").format("YYYY-MM-DD")
        }
        else {
          date_of_birth = ""
        }
        if (!results.rows[0].deceased || results.rows[0].deceased === " ") {
          deceased = "N"
        }
        if (results.rows[0].date_of_death) {
          date_of_death = moment(results.rows[0].date_of_death, accepted_date_formats)["startOf"]("day").format("YYYY-MM-DD")
        }
        else {
          date_of_death = ""
        }
        if (!results.rows[0].sex || results.rows[0].sex === " ") {
          sex = "?"
        }
        else {
          sex = results.rows[0].sex
        }
        if (!results.rows[0].marital_status || results.rows[0].marital_status === " ") {
          marital_status = "?"
        }
        else {
          marital_status = results.rows[0].marital_status
        }
        religion_code = results.rows[0].religion_code;
        lds_unit_number = results.rows[0].lds_unit_number;
        from_citizenship_country_code = results.rows[0].citizenship_country_code;
        from_birth_country_code = results.rows[0].birth_country_code;
        home_town = results.rows[0].home_town;
        home_state_code = results.rows[0].home_state_code;
        home_country_code = results.rows[0].home_country_code;
        high_school_code = results.rows[0].high_school_code;
        restricted = results.rows[0].restricted;
        from_ssn = results.rows[0].ssn;
        if (results.rows[0].ssn_verification_date) {
          from_ssn_verification_date = moment(results.rows[0].ssn_verification_date, "YYYY-MM-DD HH:mm:ss")["format"]("YYYY-MM-DD")
        }
        else {
          from_ssn_verification_date = ""
        }
        var from_visa_type = results.rows[0].visa_type;
        if (!from_visa_type) {
          from_visa_type = " "
        }
        if (results.rows[0].i20_expiration_date) {
          from_i20_expiration_date = moment(results.rows[0].i20_expiration_date, "YYYY-MM-DD HH:mm:ss")["format"]("YYYY-MM-DD")
        }
        else {
          from_i20_expiration_date = ""
        }

        var from_visa_type_source = results.rows[0].visa_type_source;
        if (!from_visa_type_source) {
          from_visa_type_source = " "
        }
        if (results.rows[0].lds_confirmation_date) {
          lds_confirmation_date = moment(results.rows[0].lds_confirmation_date, "YYYY-MM-DD HH:mm:ss")["format"]("YYYY-MM-DD")
        }
        else {
          lds_confirmation_date = ""
        }
        var citizen_dif = false;
        if (from_citizenship_country_code !== citizenship_country_code) {
          if (!inArray("person_update_citizenship", auth)) {
            throw new ClientError(403, "User not authorized to update citizenship")
          }
          citizen_dif = true
        }
        var birth_dif = false;
        if (from_birth_country_code !== birth_country_code) {
          birth_dif = true
        }
        var ssn_dif = false;
        if ((from_ssn !== ssn) ||
          (from_ssn_verification_date !== ssn_verification_date)) {
          if (!inArray("person_update_ssn", request.params.auth)) {
            throw new ClientError(403, "User not authorized to update SSN")
          }
          ssn_dif = true
        }
        if (!ssn_dif && !citizen_dif && !birth_dif &&
          (from_visa_type === visa_type) &&
          (from_visa_type_source === visa_type_source) &&
          (from_i20_expiration_date === i20_expiration_date)) {
          return ""
        }
        else {
          //select new SQL query to update record
          sql_query = sql.modifyGovernmentRecords.update;
          params = [];//clears out previous params
          params.push(date_time_updated);
          params.push(updated_by_id);
          params.push(citizenship_country_code);
          params.push(birth_country_code);
          params.push(ssn);
          params.push(ssn_verification_date);
          params.push(visa_type);
          params.push(visa_type_source);
          params.push(i20_expiration_date);
          params.push(byu_id);
          return connection["ces"].executeWithCommit(sql_query, params)
            .then(function () {
              //select new SQL query to log changes
              sql_query = sql.modifyGovernmentRecords.logChange;
              //params for change log
              params.pop();
              params.push(date_of_birth);
              params.push(deceased);
              params.push(date_of_death);
              params.push(sex);
              params.push(marital_status);
              params.push(religion_code);
              params.push(lds_unit_number);
              params.push(from_citizenship_country_code);
              params.push(from_birth_country_code);
              params.push(home_town);
              params.push(home_state_code);
              params.push(home_country_code);
              params.push(high_school_code);
              params.push(restricted);
              params.push(from_ssn);
              params.push(from_ssn_verification_date);
              params.push(from_visa_type);
              params.push(from_i20_expiration_date);
              params.push(from_visa_type_source);
              params.push(lds_confirmation_date);
              params.push(date_of_birth);
              params.push(deceased);
              params.push(date_of_death);
              params.push(sex);
              params.push(marital_status);
              params.push(religion_code);
              params.push(lds_unit_number);
              params.push(home_town);
              params.push(home_state_code);
              params.push(home_country_code);
              params.push(high_school_code);
              params.push(restricted);
              params.push(lds_confirmation_date);
              params.push(change_type);
              params.unshift(created_by_id);
              params.unshift(date_time_created);
              params.unshift(byu_id);
              return connection["ces"].executeWithCommit(sql_query, params)
                .then(function () {
                  return governmentRecordsChangedEvents(connection, request)
                })
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
    + "\nUse PUT to update government_record fields to \"\" or \" \" as appropriate.")
};

function governmentRecordsChangedEvents(connection) {
  var source_dt = moment()['tz']("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var event_type = "Person Changed";
  var event_type2 = "Person Changed v2";
  var domain = "edu.byu";
  var entity = "BYU-IAM";
  var filters = [];
  var identity_type = "PERSON";
  var basic_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id;
  var government_records_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id + "/government_records";
  var secure_url = "https://api.byu.edu/domains/legacy/identity/secureurl/v1/";
  var government_records_secure_url = "";
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

    if (from_ssn !== ssn) {
      event_type = "SSN Changed";
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
      body.push(government_records_url);
      event = eventBuilder.eventBuilder(header, body);
      event_frame.events.event.push(event);

      event_type2 = "SSN Changed v2";
      header[5] = event_type2;
      event = eventBuilder.eventBuilder(header, body, filters);
      event_frame.events.event.push(event)
    }

    if ((from_citizenship_country_code !== "USA") && (citizenship_country_code === "USA")) {
      event_type = "Person Granted US Citizenship";
      header[5] = event_type;
      body = [];
      body.push("person_id");
      body.push(person_id);
      body.push("byu_id");
      body.push(byu_id);
      body.push("net_id");
      body.push(net_id);
      body.push("citizenship_country_code");
      body.push(citizenship_country_code);
      body.push("updated_by_id");
      body.push(updated_by_id);
      body.push("date_time_updated");
      body.push(date_time_updated);
      body.push("created_by_id");
      body.push(created_by_id);
      body.push("date_time_created");
      body.push(date_time_created);
      body.push("callback_url");
      body.push(government_records_url);
      event = eventBuilder.eventBuilder(header, body);
      event_frame.events.event.push(event);

      event_type2 = "Person Granted US Citizenship v2";
      header[5] = event_type2;
      body.push("name_lnf");
      body.push(sort_name);
      body.push("name_fnf");
      body.push(name_fnf);
      body.push("preferred_name");
      body.push(preferred_name);
      body.push("surname");
      body.push(surname);
      body.push("preferred_surname");
      body.push(preferred_surname);
      body.push("rest_of_name");
      body.push(rest_of_name);
      body.push("preferred_first_name");
      body.push(preferred_first_name);
      body.push("suffix");
      body.push(suffix);
      event = eventBuilder.eventBuilder(header, body, filters);
      event_frame.events.event.push(event)
    }

    if ((from_citizenship_country_code === "USA") && (citizenship_country_code !== "USA")) {
      event_type = "Person Un-granted US Citizenship";
      header[5] = event_type;
      body = [];
      body.push("person_id");
      body.push(person_id);
      body.push("byu_id");
      body.push(byu_id);
      body.push("net_id");
      body.push(net_id);
      body.push("citizenship_country_code");
      body.push(citizenship_country_code);
      body.push("updated_by_id");
      body.push(updated_by_id);
      body.push("date_time_updated");
      body.push(date_time_updated);
      body.push("created_by_id");
      body.push(created_by_id);
      body.push("date_time_created");
      body.push(date_time_created);
      body.push("callback_url");
      body.push(government_records_url);
      event = eventBuilder.eventBuilder(header, body);
      event_frame.events.event.push(event);

      event_type2 = "Person Un-granted US Citizenship v2";
      header[5] = event_type2;
      body.push("name_lnf");
      body.push(sort_name);
      body.push("name_fnf");
      body.push(name_fnf);
      body.push("preferred_name");
      body.push(preferred_name);
      body.push("surname");
      body.push(surname);
      body.push("preferred_surname");
      body.push(preferred_surname);
      body.push("rest_of_name");
      body.push(rest_of_name);
      body.push("preferred_first_name");
      body.push(preferred_first_name);
      body.push("suffix");
      body.push(suffix);
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
    body.push("secure_url");
    body.push(secure_url);
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

    if (from_ssn !== ssn) {
      event_type = "SSN Changed";
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
      body.push(government_records_secure_url);
      event = eventBuilder.eventBuilder(header, body);
      event_frame.events.event.push(event);

      event_type2 = "SSN Changed v2";
      header[5] = event_type2;
      event = eventBuilder.eventBuilder(header, body, filters);
      event_frame.events.event.push(event)
    }

    if ((from_citizenship_country_code !== "USA") && (citizenship_country_code === "USA")) {
      event_type = "Person Granted US Citizenship";
      header[5] = event_type;
      body = [];
      body.push("person_id");
      body.push(" ");
      body.push("byu_id");
      body.push(" ");
      body.push("net_id");
      body.push(" ");
      body.push("citizenship_country_code");
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
      body.push(government_records_secure_url);
      event = eventBuilder.eventBuilder(header, body);
      event_frame.events.event.push(event);

      event_type2 = "Person Granted US Citizenship v2";
      header[5] = event_type2;
      body.push("name_lnf");
      body.push(" ");
      body.push("name_fnf");
      body.push(" ");
      body.push("preferred_name");
      body.push(" ");
      body.push("surname");
      body.push(" ");
      body.push("preferred_surname");
      body.push(" ");
      body.push("rest_of_name");
      body.push(" ");
      body.push("preferred_first_name");
      body.push(" ");
      body.push("suffix");
      body.push(" ");
      event = eventBuilder.eventBuilder(header, body, filters);
      event_frame.events.event.push(event)
    }

    if ((from_citizenship_country_code === "USA") && (citizenship_country_code !== "USA")) {
      event_type = "Person Un-granted US Citizenship";
      header[5] = event_type;
      body = [];
      body.push("person_id");
      body.push(" ");
      body.push("byu_id");
      body.push(" ");
      body.push("net_id");
      body.push(" ");
      body.push("citizenship_country_code");
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
      body.push(government_records_secure_url);
      event = eventBuilder.eventBuilder(header, body);
      event_frame.events.event.push(event);

      event_type2 = "Person Un-granted US Citizenship v2";
      header[5] = event_type2;
      body.push("name_lnf");
      body.push(" ");
      body.push("name_fnf");
      body.push(" ");
      body.push("preferred_name");
      body.push(" ");
      body.push("surname");
      body.push(" ");
      body.push("preferred_surname");
      body.push(" ");
      body.push("rest_of_name");
      body.push(" ");
      body.push("preferred_first_name");
      body.push(" ");
      body.push("suffix");
      body.push(" ");
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
      return connection["ces"].executeWithCommit(sql_query, params).catch(function (error) {
        console.error(error.stack);
        throw new ClientError(207, "Check ENQUEUE");
      })
    }).catch(function (error) {
      console.error(error.stack);
      throw new ClientError(207, "Check ENQUEUE");
    })
}