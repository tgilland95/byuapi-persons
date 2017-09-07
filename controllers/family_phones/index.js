"use strict";

var moment = require("moment-timezone");
var sql = require("./sql.js");
var eventBuilder = require("./../event.js");
var core = require("../../core.js");
var Promise = require("bluebird");
var ClientError = core.ClientError;
var PhoneNumber = require("awesome-phonenumber");


var current_date_time;
var identity_type = "Person";
var change_type = "";
var byu_id = " ";
var person_id = " ";
var net_id = " ";
var employee_type = " ";
var student_status = " ";
var restricted = " ";
var date_time_updated = "";
var updated_by_id = " ";
var date_time_created = "";
var created_by_id = " ";
var phone_type = " ";
var phone_number = " ";
var from_country_code = " ";
var from_cell_flag = " ";
var from_contact_person = " ";
var from_relationship = " ";
var from_preferred_language_code = " ";
var from_verified_flag = " ";
var from_texts_okay = " ";
var from_phone_number = ' ';
var country_code = " ";
var cell_flag = " ";
var contact_person = " ";
var relationship = " ";
var preferred_language_code = " ";
var texts_okay = " ";
var verified_flag = " ";
var lookup_number = " ";
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

//This is a function used to find the authorizations allowed, but is generic.
function inArray(needle, haystack) {
  for (var i = haystack.length; i--;) {
    if (haystack[i] === needle) {
      return true
    }
  }
  return false
}

function GetIsoCode(country_code) {
  if (/^([?]{3}|UK|HK|EL|CW|SX|[A-Z]{3})$/g.test(country_code)) {
    var countryCode = require("../../meta/countries/countryCodes.json");
    var country_codes = countryCode.items;

    for (var i = country_codes.length; i--;) {
      if (country_code === country_codes[i].country_code) {
        return country_codes[i]["iso_code"]
      }
    }
  }
}

function isValidName(name) {
  return (/^(?=.*?[A-Z])([A-Za-z'-]+ )*?[A-Za-z'-]+$/g.test(name))
}

function isValidLanguageCode(language_code) {
  if (/^([?]{2}|[A-Z]{2})$/g.test(language_code)) {
    var languageCodes = require("../../meta/languages/languageCodes.json");
    var language_codes = languageCodes.items;

    for (var i = language_codes.length; i--;) {
      if (language_code === language_codes[i]["domain_value"]) {
        return true
      }
    }
  }
  return false
}


//Performs the GET method
exports.get = function (connection, resources, request, response) {
  //Declare variables
  var params = [];
  //identify DEF.JSON file to be filled
  var def = resources.sub_resource_definitions["family_phones"];
  var sql_query = sql.sql.getFamilyPhones;

  //updates the URL to reflect the requested BYU_ID
  var links_map = {
    byu_id: request.params.resource_id[0]
  };
  core.updateHATEOASData(def.links, links_map);

  //add BYU_ID from the RESOURCE_ID in the url
  params.push(request.params.resource_id[0]);
  //If there is a SUB_RESOURCE_ID perform the following:
  if (request.params.sub_resource_id) {
    if (request.params.sub_resource_id.length !== 2 &&
      (request.params.sub_resource_id[0] !== "EMR" ||
        request.params.sub_resource_id[0] !== "PRM")) {
      throw new ClientError(409, "Incorrect URL: use ~/persons/v1/{{byu_id}}/{{phone_type}},XXX-XXX-XXXX\nNOTE: phone_type must be EMR or PRM")
    }
    //grab the getFamily Phone SQL from SQL.JS
    sql_query = sql.sql.getFamilyPhone;
    //add PHONE_NUMBER to parameters for SQL query from SUB_RESOURCE_ID second array slot
    params.unshift(decodeURI(request.params.sub_resource_id[1]).replace(/\D/g, ''));
    //add PHONE_TYPE to parameters for SQL query from SUB_RESOURCE_ID first array slot
    params.unshift(request.params.sub_resource_id[0])
  }
  //execute the SQL_QUERY selected based off of IF statements using PARAMS array values
  return connection["ces"].execute(sql_query, params)
    .then(function (results) {
      if (results.rows.length === 0) {
        throw new ClientError(404, "BYU_ID not found in person table")
      }
      if (results.rows[0].restricted === 'Y' && !inArray('person_restricted', request.params.auth)) {
        throw new ClientError(404, 'BYU_ID not found in person table')
      }
      delete def.metadata.default_db;
      if (inArray("person_view_contact", request.params.auth)) {
        def.metadata.validation_response.return_code = 200;
        if (!results.rows[0].phone_type && !request.params.sub_resource_id) {
          def.metadata.collection_size = 0;
          def.values.pop();
          return def
        }
        if (!results.rows[0].phone_type && request.params.sub_resource_id) {
          throw new ClientError(404, request.params.sub_resource_id[0] + " phone number not found")
        }
        //fill in the METADATA of the DEF.JSON
        def.metadata.collection_size = results.rows.length;
        //process the data and fill in the DEF.JSON values and descriptions
        def.values = core.sqlmap.map_rows(results.rows, def.values[0], sql.sql.map);
        //updated the HATEOAS links
        core.sqlmap.map_results(results.rows, def, sql.sql.map, function (item) {
          links_map.phone_type = item.phone_type.value;
          links_map.phone_number = item.phone_number.value;
          core.updateHATEOASData(item.links, links_map)
        });
        var length = def.values.length;
        for (var i = 0; i < length; i++) {
          def.values[i].date_time_updated["value"] = moment(results.rows[i].date_time_updated)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
          def.values[i].date_time_created["value"] = moment(results.rows[i].date_time_created)["format"]("YYYY-MM-DD HH:mm:ss.SSS")
        }
        return def
      }
      else {
        throw new ClientError(403, "User not authorized to view CONTACT data")
      }
    })
};

exports.put = function (connection, resources, request, response) {
  byu_id = request.params.resource_id[0];
  phone_type = request.params.sub_resource_id[0];
  lookup_number = decodeURI(request.params.sub_resource_id[1]).replace(/\D/g, '');
  phone_number = request.body.phone_number || lookup_number;
  country_code = request.body.country_code;
  cell_flag = (request.body.cell_flag && request.body.cell_flag === "Y") ? "Y" : "N";
  contact_person = request.body.contact_person;
  relationship = (request.body.relationship) ? request.body.relationship : " ";
  texts_okay = (request.body.texts_okay && request.body.texts_okay === "Y") ? "Y" : "N";
  preferred_language_code = (request.body.preferred_language_code) ? request.body.preferred_language_code : "EN";
  verified_flag = (request.body.verified_flag && request.body.verified_flag === "Y") ? "Y" : "N";
  current_date_time = moment();
  updated_by_id = (!request.body.updated_by_id || (request.body.updated_by_id === " ")) ? request.verifiedJWTs.authorized_byu_id : request.body.updated_by_id;
  date_time_updated = (!request.body.date_time_updated || (request.body.date_time_updated === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](request.body.date_time_updated, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  created_by_id = (!request.body.created_by_id || (request.body.created_by_id === " ")) ? request.verifiedJWTs.authorized_byu_id : request.body.created_by_id;
  date_time_created = (!request.body.date_time_created || (request.body.date_time_created === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](request.body.date_time_created, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var log_params = [];

  if (request.params.sub_resource_id.length !== 2 &&
    (phone_type !== "EMR" ||
      phone_type !== "PRM")) {
    throw new ClientError(409, "Incorrect URL: use ~/persons/v1/{{byu_id}}/{{phone_type}},XXX-XXX-XXXX\nNOTE: phone_type must be EMR or PRM")
  }

  var error = false;
  var msg = "Invalid Body:";
  if (!contact_person || !country_code) {
    msg += "\nMissing one of the following required fields:\n{\n\t\"country_code\": \"\",\n\t\"contact_person\": \" \"\n}";
    error = true
  }
  if (!isValidLanguageCode(preferred_language_code)) {
    msg += "\n\tpreferred_language_code is not valid please look up code in meta";
    error = true
  }
  if (error) {
    throw new ClientError(409, msg)
  }
  var pn = new PhoneNumber(phone_number, GetIsoCode(country_code));
  var valid = pn["isValid"]();
  var mobile = pn["isMobile"]();
  if (valid) {
    phone_number = pn["a"].number.national;
    if ((country_code === "USA") || (country_code === "CAN")) {
      phone_number = phone_number.replace(/\D/g, "").replace(/([0-9]{3})([0-9]{3})([0-9]{4}$)/g, "$1-$2-$3")
    }
  }
  else {
    texts_okay = "N"
  }
  if (mobile) {
    cell_flag = "Y"
  }
  if (!isValidName(relationship)) {
    relationship = "Unknown"
  }
  if (!inArray("person_update_contact", request.params.auth)) {
    throw new ClientError(403, "User not authorized to update CONTACT data")
  }

  var sql_query = sql.sql.fromFamilyPhone;
  var params = [
    phone_type,
    lookup_number,
    byu_id
  ];
  return connection["ces"].execute(sql_query, params)
    .then(function (results) {
      if (results.rows.length === 0) {
        throw new ClientError(404, "Could not find BYU_ID in Person Table")
      }
      person_id = (results.rows[0].person_id) ? results.rows[0].person_id : " ";
      net_id = (results.rows[0].net_id) ? results.rows[0].net_id : " ";
      employee_type = (results.rows[0].employee_type && results.rows[0].employee_type !== "--") ? results.rows[0].employee_type : "Not An Employee";
      student_status = results.rows[0].student_status;
      restricted = (results.rows[0].restricted && results.rows[0].restricted === "Y") ? "Y" : "N";
      created_by_id = (results.rows[0].created_by_id) ? results.rows[0].created_by_id : created_by_id;
      date_time_created = (results.rows[0].date_time_created) ? moment(results.rows[0].date_time_created, accepted_date_formats)["format"]("YYYY-MM-DD HH:mm:ss.SSS") : date_time_created;

      change_type = (!results.rows[0].phone_number) ? "A" : "C";
      from_cell_flag = (results.rows[0].cell_flag && results.rows[0]) ? results.rows[0].cell_flag : " ";
      from_contact_person = (results.rows[0].contact_person) ? results.rows[0].contact_person : " ";
      from_relationship = (results.rows[0].relationship) ? results.rows[0].relationship : " ";
      from_country_code = (results.rows[0].country_code) ? results.rows[0].country_code : " ";
      from_texts_okay = (results.rows[0].texts_okay) ? results.rows[0].texts_okay : " ";
      from_preferred_language_code = (results.rows[0].preferred_language_code) ? results.rows[0].preferred_language_code : " ";
      from_verified_flag = (results.rows[0].verified_flag) ? results.rows[0].verified_flag : " ";
      from_phone_number = results.rows[0].phone_number || ' ';

      log_params = [
        change_type,
        byu_id,
        phone_type,
        lookup_number,
        date_time_updated,
        updated_by_id,
        date_time_created,
        created_by_id,
        from_phone_number,
        from_country_code,
        from_cell_flag,
        from_contact_person,
        from_relationship,
        from_preferred_language_code,
        from_verified_flag,
        from_texts_okay,
        phone_number,
        country_code,
        cell_flag,
        contact_person,
        relationship,
        preferred_language_code,
        texts_okay,
        verified_flag
      ];
      console.log('LOG PARAMS', log_params);

      var is_different = false;
      if (
        (cell_flag !== from_cell_flag) ||
        (contact_person !== from_contact_person) ||
        (relationship !== from_relationship) ||
        (country_code !== from_country_code) ||
        (texts_okay !== from_texts_okay) ||
        (preferred_language_code !== from_preferred_language_code) ||
        (verified_flag !== from_verified_flag) ||
        (phone_number !== from_phone_number)) {
        is_different = true
      }

      if (is_different && !results.rows[0].phone_number) {
        sql_query = sql.modifyFamilyPhone.create;
        params = [
          byu_id,
          phone_type,
          phone_number,
          country_code,
          date_time_updated,
          updated_by_id,
          date_time_created,
          created_by_id,
          cell_flag,
          contact_person,
          relationship,
          texts_okay,
          preferred_language_code,
          verified_flag,
          lookup_number
        ];
        return connection["ces"].executeWithCommit(sql_query, params)
      }
      else if (is_different && results.rows[0].phone_number) {
        sql_query = sql.modifyFamilyPhone.update;
        params = [
          date_time_updated,
          updated_by_id,
          cell_flag,
          contact_person,
          relationship,
          texts_okay,
          country_code,
          preferred_language_code,
          verified_flag,
          phone_number,
          byu_id,
          phone_type,
          lookup_number
        ];
        return connection["ces"].executeWithCommit(sql_query, params)
      }
    })
    .then(function () {
      sql_query = sql.modifyFamilyPhone.logChange;
      return connection["ces"].executeWithCommit(sql_query, log_params)
    })
    .then(function () {
      return familyPhoneEvents(connection)
    })
    .then(function () {
      return exports.get(connection, resources, request, response)
    })
};

exports.delete = function (connection, resources, request, response) {
  byu_id = request.params.resource_id[0];
  phone_type = request.params.sub_resource_id[0];
  lookup_number = decodeURI(request.params.sub_resource_id[1]).replace(/\D/g, '');
  if (request.params.sub_resource_id.length !== 2 &&
    (phone_type !== "EMR" ||
      phone_type !== "PRM")) {
    throw new ClientError(409, "Incorrect URL: use ~/persons/v1/{{byu_id}}/{{phone_type}},XXX-XXX-XXXX\nNOTE: phone_type must be EMR or PRM")
  }
  if (!inArray("person_update_contact", request.params.auth)) {
    throw new ClientError(403, "User not authorized to update CONTACT data")
  }
  date_time_updated = moment()["tz"]("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  updated_by_id = request.verifiedJWTs.authorized_byu_id;
  change_type = "D";

  var sql_query = sql.sql.fromFamilyPhone;
  var params = [
    phone_type,
    lookup_number,
    byu_id
  ];
  return connection["ces"].execute(sql_query, params)
    .then(function (results) {
      if (results.rows.length === 0) {
        throw new ClientError(404, "Could not find BYU_ID in Person Table")
      }
      if (!results.rows[0].phone_number) {
        throw new ClientError(204, "")
      }
      person_id = (results.rows[0].person_id) ? results.rows[0].person_id : " ";
      net_id = (results.rows[0].net_id) ? results.rows[0].net_id : " ";
      employee_type = (results.rows[0].employee_type && results.rows[0].employee_type === "--") ? results.rows[0].employee_type : "Not An Employee";
      student_status = results.rows[0].student_status;
      restricted = (results.rows[0].restricted && results.rows[0].restricted === "Y") ? "Y" : "N";

      date_time_created = moment(results.rows[0].date_time_created, accepted_date_formats)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
      created_by_id = results.rows[0].created_by_id;
      from_cell_flag = (results.rows[0].cell_flag) ? results.rows[0].cell_flag : " ";
      from_contact_person = (results.rows[0].contact_person) ? results.rows[0].contact_person : " ";
      from_relationship = (results.rows[0].relationship) ? results.rows[0].relationship : " ";
      from_country_code = (results.rows[0].country_code) ? results.rows[0].country_code : " ";
      from_texts_okay = (results.rows[0].texts_okay) ? results.rows[0].texts_okay : " ";
      from_preferred_language_code = (results.rows[0].preferred_language_code) ? results.rows[0].preferred_language_code : " ";
      from_verified_flag = (results.rows[0].verified_flag) ? results.rows[0].verified_flag : " ";
      from_phone_number = results.rows[0].phone_number || ' ';
      country_code = " ";
      cell_flag = " ";
      contact_person = " ";
      relationship = " ";
      preferred_language_code = " ";
      texts_okay = " ";
      verified_flag = " ";
      lookup_number = ' ';

      var log_params = [
        change_type,
        byu_id,
        phone_type,
        lookup_number,
        date_time_updated,
        updated_by_id,
        date_time_created,
        created_by_id,
        from_phone_number,
        from_country_code,
        from_cell_flag,
        from_contact_person,
        from_relationship,
        from_preferred_language_code,
        from_verified_flag,
        from_texts_okay,
        phone_number,
        country_code,
        cell_flag,
        contact_person,
        relationship,
        preferred_language_code,
        texts_okay,
        verified_flag
      ];

      sql_query = sql.modifyFamilyPhone.delete;
      return connection["ces"].executeWithCommit(sql_query, params)
        .then(function () {
          sql_query = sql.modifyFamilyPhone.logChange;
          return connection["ces"].executeWithCommit(sql_query, log_params)
        })
        .then(function () {
          return familyPhoneDeletedEvents(connection)
        })
    })
    .then(function () {
      return ""
    })
};

function familyPhoneEvents(connection) {
  var source_dt = moment()['tz']("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var event_type = (change_type === "A") ? "Family Phone Added" : "Family Phone Changed";
  var event_type2 = (change_type === "A") ? "Family Phone Added v2" : "Family Phone Changed v2";
  var domain = "edu.byu";
  var entity = "BYU-IAM";
  var filters = [];
  var family_phone_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id + "/family_phones/" + phone_type + "," + lookup_number;
  var secure_url = "https://api.byu.edu/domains/legacy/identity/secureurl/v1/";
  var sql_query = "";
  var params = [];
  var event_frame = {
    "events": {
      "event": []
    }
  };
  var header = [
    "domain",
    domain,
    "entity",
    entity,
    "event_type",
    event_type,
    "source_dt",
    source_dt,
    "event_dt",
    " ",
    "event_id",
    " "
  ];
  if (restricted !== "Y") {
    var body = [
      "person_id",
      person_id,
      "byu_id",
      byu_id,
      "net_id",
      net_id,
      "phone_type",
      phone_type,
      "lookup_number",
      lookup_number,
      "phone_number",
      phone_number,
      "cell_flag",
      cell_flag,
      "contact_person",
      contact_person,
      "relationship",
      relationship,
      "country_code",
      country_code,
      "preferred_language_code",
      preferred_language_code,
      "updated_by_id",
      updated_by_id,
      "date_time_updated",
      date_time_updated,
      "created_by_id",
      created_by_id,
      "date_time_created",
      date_time_created,
      "callback_url",
      family_phone_url
    ];
    var event = eventBuilder.eventBuilder(header, body);
    event_frame.events.event.push(event);

    header[5] = event_type2;
    body.push("verified_flag");
    body.push(verified_flag);
    filters.push("identity_type");
    filters.push(identity_type);
    filters.push("employee_type");
    filters.push(employee_type);
    filters.push("student_status");
    filters.push(student_status);
    event = eventBuilder.eventBuilder(header, body, filters);
    event_frame.events.event.push(event);

    sql_query = sql.eventPersonFamilyPhone.raiseEvent;
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
  else {
    sql_query = sql.intermediaryId.get;
    params = [family_phone_url];
    return connection["ces"].execute(sql_query, params)
      .then(function (results) {
        if (results.rows.length === 0) {
          sql_query = sql.intermediaryId.put;
          params = [
            family_phone_url,
            " ",    // actor
            " ",    // group_id
            created_by_id
          ];
          return connection["ces"].executeWithCommit(sql_query, params)
            .then(function () {
              sql_query = sql.intermediaryId.get;
              params = [family_phone_url];
              return connection["ces"].execute(sql_query, params)
                .then(function (results) {
                  secure_url += results.rows[0]["intermediary_id"]
                })
            })
        }
        else {
          secure_url += results.rows[0]["intermediary_id"]
        }
        var restricted_body = [
          "person_id",
          " ",
          "byu_id",
          " ",
          "net_id",
          " ",
          "phone_type",
          " ",
          "lookup_number",
          " ",
          "phone_number",
          " ",
          "cell_flag",
          " ",
          "contact_person",
          " ",
          "relationship",
          " ",
          "country_code",
          " ",
          "preferred_language_code",
          " ",
          "updated_by_id",
          " ",
          "date_time_updated",
          " ",
          "created_by_id",
          " ",
          "date_time_created",
          " ",
          "secure_url",
          secure_url
        ];
        event = eventBuilder.eventBuilder(header, restricted_body);
        event_frame.events.event.push(event);

        header[5] = event_type2;
        restricted_body.push("verified_flag");
        restricted_body.push(" ");
        filters.push("restricted");
        filters.push(restricted);
        event = eventBuilder.eventBuilder(header, restricted_body, filters);
        event_frame.events.event.push(event);

        sql_query = sql.eventPersonFamilyPhone.raiseEvent;
        params = [JSON.stringify(event_frame)];
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
      })
  }
}

function familyPhoneDeletedEvents(connection) {
  var source_dt = moment()["tz"]("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var event_type = "Address Deleted";
  var event_type2 = "Address Deleted v2";
  var domain = "edu.byu";
  var entity = "BYU-IAM";
  var filters = [];
  var family_phone_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id + "/family_phones/" + phone_type + "," + lookup_number;
  var secure_url = "https://api.byu.edu/domains/legacy/identity/secureurl/v1/";
  var event_frame = {
    "events": {
      "event": []
    }
  };
  var header = [
    "domain",
    domain,
    "entity",
    entity,
    "event_type",
    event_type,
    "source_dt",
    source_dt,
    "event_dt",
    " ",
    "event_id",
    " "
  ];

  if (restricted !== "Y") {
    var body = [
      "person_id",
      person_id,
      "byu_id",
      byu_id,
      "net_id",
      net_id,
      "phone_type",
      phone_type,
      "callback_url",
      family_phone_url
    ];
    var event = eventBuilder.eventBuilder(header, body);
    event_frame.events.event.push(event);

    header[5] = event_type2;
    filters = [
      "identity_type",
      identity_type,
      "employee_type",
      employee_type,
      "student_status",
      student_status
    ];
    event = eventBuilder.eventBuilder(header, body, filters);
    event_frame.events.event.push(event);

    var sql_query = sql.eventPersonFamilyPhone.raiseEvent;
    var params = [JSON.stringify(event_frame)];
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
  else {
    sql_query = sql.intermediaryId.get;
    params = [family_phone_url];
    return connection["ces"].execute(sql_query, params)
      .then(function (results) {
        if (results.rows.length === 0) {
          sql_query = sql.intermediaryId.put;
          params = [
            family_phone_url,
            " ",    // actor
            " ",    // group_id
            created_by_id
          ];
          return connection["ces"].executeWithCommit(sql_query, params)
            .then(function () {
              sql_query = sql.intermediaryId.get;
              params = [family_phone_url];
              return connection["ces"].execute(sql_query, params)
                .then(function (results) {
                  secure_url += results.rows[0]["intermediary_id"]
                })
            })
        }
        else {
          secure_url += results.rows[0]["intermediary_id"]
        }
        var restricted_body = [
          "person_id",
          " ",
          "byu_id",
          " ",
          "net_id",
          " ",
          "phone_type",
          " ",
          "secure_url",
          secure_url
        ];
        event = eventBuilder.eventBuilder(header, restricted_body);
        event_frame.events.event.push(event);

        header[5] = event_type2;
        filters.push("restricted");
        filters.push(restricted);
        event = eventBuilder.eventBuilder(header, restricted_body, filters);
        event_frame.events.event.push(event);

        sql_query = sql.eventPersonFamilyPhone.raiseEvent;
        params = [JSON.stringify(event_frame)];
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
      })
  }
}