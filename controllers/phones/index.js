"use strict";

var moment = require("moment-timezone");
var sql = require("./sql.js");
var eventBuilder = require("./../event.js");
var core = require("../../core.js");
var bluebird = require("bluebird");
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
var phone_number = " ";
var from_country_code = " ";
var from_cell_flag = " ";
var from_time_code = " ";
var from_texts_okay = " ";
var from_unlisted = " ";
var from_primary_flag = " ";
var from_tty = " ";
var from_verified_flag = " ";
var from_work_flag = " ";
var country_code = " ";
var cell_flag = " ";
var time_code = " ";
var texts_okay = " ";
var unlisted = " ";
var primary_flag = " ";
var tty = " ";
var verified_flag = " ";
var work_flag = " ";
var from_phone_number = ' ';
var lookup_number = ' ';
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
var phone_elements = [
  "country_code",
  "cell_flag",
  "time_code",
  "texts_okay",
  "primary_flag",
  "tty",
  "unlisted",
  "verified_flag",
  "work_flag"
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
  if (country_code && country_code.match(/^([?]{3}|[A-Z]{3})$/)) {
    var countryCode = require("../../meta/countries/countryCodes.json");
    var country_codes = countryCode.items;

    for (var i = country_codes.length; i--;) {
      if (country_code === country_codes[i].country_code) {
        return country_codes[i]["iso_code"]
      }
    }
  }
}

function isYesOrNo(value) {
  switch (value) {
    case "Y":
    case "N":
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
  var def = resources.sub_resource_definitions["phones"];
  var sql_query = sql.sql.getPhones;

  //updates the URL to reflect the requested BYU_ID
  var links_map = {
    byu_id: request.params.resource_id[0]
  };
  core.updateHATEOASData(def.links, links_map);

  //add BYU_ID from the RESOURCE_ID in the url
  params.push(request.params.resource_id[0]);
  //If there is a SUB_RESOURCE_ID perform the following:
  if (request.params.sub_resource_id) {
    //grab the getPhone SQL from SQL.JS
    sql_query = sql.sql.getPhone;
    //add PHONE_NUMBER to parameters for SQL query from SUB_RESOURCE_ID first array slot
    params.unshift(decodeURI(request.params.sub_resource_id[0]).replace(/\D/g, ''));
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
        if (!results.rows[0].phone_number && !request.params.sub_resource_id) {
          def.metadata.collection_size = 0;
          def.values.pop();
          return def
        }
        if (!results.rows[0].phone_number && request.params.sub_resource_id) {
          throw new ClientError(404, decodeURI(request.params.sub_resource_id[0]) + " phone number not found")
        }
        //fill in the METADATA of the DEF.JSON
        def.metadata.collection_size = results.rows.length;
        //process the data and fill in the DEF.JSON values and descriptions
        def.values = core.sqlmap.map_rows(results.rows, def.values[0], sql.sql.map);
        //updated the HATEOAS links
        core.sqlmap.map_results(results.rows, def, sql.sql.map, function (item) {
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
        // Keep WRK numbers for public directory
        var work_number = [];
        for (var x = results.rows.length; x--;) {
          if (results.rows[x].work_flag === "Y") {
            work_number.push(results.rows[x]);
          }
        }
        results.rows = work_number;
        //if the query was good but no records exist return an empty object
        if (results.rows &&
          !results.rows[0].phone_number &&
          !request.params.sub_resource_id) {
          def.metadata.validation_response.return_code = 200;
          def.values.pop();
          return def
        }
        if (results.rows &&
          !results.rows[0].phone_number &&
          request.params.sub_resource_id) {
          throw new ClientError(404, decodeURI(request.params.sub_resource_id[0]) + " phone number not found")
        }
        if (results.rows &&
          ((results.rows[0]["primary_role"] === "Employee") ||
            (results.rows[0]["primary_role"] === "Faculty"))) {
          //process the data and fill in the DEF.JSON values and descriptions
          def.values = core.sqlmap.map_rows(results.rows, def.values[0], sql.sql.public_map);
          //updated the HATEOAS links
          core.sqlmap.map_results(results.rows, def, sql.sql.map, function (item) {
            links_map.phone_number = item.phone_number.value;
            core.updateHATEOASData(item.links, links_map)
          });
          for (i = def.values.length; i--;) {
            if (def.values[i].unlisted.value === "Y") {
              def.values[i].phone_number.value = "phone unlisted"
            }
          }
          def.metadata.collection_size = results.rows.length;
          def.metadata.validation_response.return_code = 203;
          def.metadata.validation_response.response = "User authorized to view PUBLIC DIRECTORY info only";
          return def
        }
        else {
          throw new ClientError(403, "User authorized to view PUBLIC DIRECTORY info only")
        }
      }
    })
};

exports.put = function (connection, resources, request, response) {
  byu_id = request.params.resource_id[0];
  lookup_number = decodeURI(request.params.sub_resource_id[0]).replace(/\D/g, '');
  phone_number = request.body.phone_number || lookup_number;
  country_code = request.body.country_code;
  cell_flag = (request.body.cell_flag && request.body.cell_flag === "Y") ? "Y" : "N";
  time_code = (request.body.time_code) ? request.body.time_code : "Mountain";
  texts_okay = (request.body.texts_okay && request.body.texts_okay === "Y") ? "Y" : "N";
  primary_flag = (request.body.primary_flag && request.body.primary_flag === "Y") ? "Y" : "N";
  tty = (request.body.tty && request.body.tty === "Y") ? "Y" : "N";
  unlisted = (request.body.unlisted && request.body.unlisted === "Y") ? "Y" : "N";
  verified_flag = (request.body.verified_flag && request.body.verified_flag === "Y") ? "Y" : "N";
  work_flag = (request.body.work_flag && request.body.work_flag === "Y") ? "Y" : "N";
  current_date_time = moment();
  updated_by_id = (!request.body.updated_by_id || (request.body.updated_by_id === " ")) ? request.verifiedJWTs.authorized_byu_id : request.body.updated_by_id;
  date_time_updated = (!request.body.date_time_updated || (request.body.date_time_updated === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](request.body.date_time_updated, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  created_by_id = (!request.body.created_by_id || (request.body.created_by_id === " ")) ? request.verifiedJWTs.authorized_byu_id : request.body.created_by_id;
  date_time_created = (!request.body.date_time_created || (request.body.date_time_created === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](request.body.date_time_created, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var log_params = [];

  var error = false;
  var msg = "Incorrect BODY: Missing ";
  phone_elements.forEach(function (item) {
    if (request.body[item] === undefined) {
      if (item === "work_flag") {
        msg += "\n\"" + item + "\": \" \"\n"
      }
      else {
        msg += "\n\"" + item + "\": \" \","
      }
      error = true
    }
    else if (request.body[item] === "") {
      request.body[item] = " "
    }
  });
  phone_elements.forEach(function (item) {
    switch (item) {
      case "texts_okay":
      case "verified_flag":
      case "cell_flag":
        if (!isYesOrNo(request.body[item])) {
          msg += "\n\t" + item + " must be 'Y' or 'N'";
          error = true
        }
        break;
      default:
        break
    }
  });
  if (error) {
    throw new ClientError(409, msg)
  }
  var pn = new PhoneNumber(phone_number, GetIsoCode(country_code));
  var valid = pn["isValid"]();
  var mobile = pn["isMobile"]();
  if (valid) {
    phone_number = pn["a"].number.national;
    if ((country_code === "USA") || (country_code === "CAN")) {
      phone_number = phone_number.replace(/\D/g, "").replace(/([0-9]{3})([0-9]{3})([0-9]{4}$)/gi, "$1-$2-$3")
    }
  }
  else {
    texts_okay = "N"
  }
  if (mobile) {
    cell_flag = "Y"
  }
  if (!inArray("person_update_contact", request.params.auth)) {
    throw new ClientError(403, "User not authorized to update CONTACT data")
  }

  var sql_query = sql.sql.fromPhone;
  var params = [
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
      from_country_code = (results.rows[0].country_code) ? results.rows[0].country_code : " ";
      from_cell_flag = (results.rows[0].cell_flag) ? results.rows[0].cell_flag : " ";
      from_time_code = (results.rows[0].time_code) ? results.rows[0].time_code : " ";
      from_texts_okay = (results.rows[0].texts_okay) ? results.rows[0].texts_okay : " ";
      from_unlisted = (results.rows[0].unlisted) ? results.rows[0].unlisted : " ";
      from_primary_flag = (results.rows[0].primary_flag) ? results.rows[0].primary_flag : " ";
      from_tty = (results.rows[0].tty) ? results.rows[0].tty : " ";
      from_verified_flag = (results.rows[0].verified_flag) ? results.rows[0].verified_flag : " ";
      from_work_flag = (results.rows[0].work_flag) ? results.rows[0].work_flag : " ";
      from_phone_number = results.rows[0].phone_number || " ";

      log_params = [
        change_type,
        byu_id,
        lookup_number,
        date_time_updated,
        updated_by_id,
        date_time_created,
        created_by_id,
        from_phone_number,
        from_country_code,
        from_cell_flag,
        from_time_code,
        from_texts_okay,
        from_unlisted,
        from_primary_flag,
        from_tty,
        from_verified_flag,
        from_work_flag,
        phone_number,
        country_code,
        cell_flag,
        time_code,
        texts_okay,
        unlisted,
        primary_flag,
        tty,
        verified_flag,
        work_flag
      ];

      var is_different = false;
      if ((cell_flag !== from_cell_flag) ||
        (time_code !== from_time_code) ||
        (texts_okay !== from_texts_okay) ||
        (country_code !== from_country_code) ||
        (primary_flag !== from_primary_flag) ||
        (tty !== from_tty) ||
        (unlisted !== from_unlisted) ||
        (verified_flag !== from_verified_flag) ||
        (work_flag !== from_work_flag) ||
        (phone_number !== from_phone_number)) {
        is_different = true
      }

      if (is_different && !results.rows[0].phone_number) {
        sql_query = sql.modifyPhone.create;
        params = [
          byu_id,
          phone_number,
          country_code,
          date_time_updated,
          updated_by_id,
          date_time_created,
          created_by_id,
          cell_flag,
          time_code,
          texts_okay,
          unlisted,
          primary_flag,
          tty,
          verified_flag,
          work_flag,
          lookup_number
        ];
        return connection["ces"].executeWithCommit(sql_query, params)
      }
      else if (is_different && results.rows[0].phone_number) {
        sql_query = sql.modifyPhone.update;
        params = [
          date_time_updated,
          updated_by_id,
          cell_flag,
          time_code,
          texts_okay,
          country_code,
          primary_flag,
          tty,
          unlisted,
          verified_flag,
          work_flag,
          phone_number,
          byu_id,
          lookup_number
        ];
        return connection["ces"].executeWithCommit(sql_query, params)
      }
    })
    .then(function () {
      sql_query = sql.modifyPhone.logChange;
      return connection["ces"].executeWithCommit(sql_query, log_params)
    })
    .then(function () {
      return phoneEvents(connection)
    })
    .then(function () {
      return exports.get(connection, resources, request, response)
    })
};

exports.delete = function (connection, resources, request, response) {
  if (!inArray("person_update_contact", request.params.auth)) {
    throw new ClientError(403, "User not authorized to update CONTACT data")
  }
  byu_id = request.params.resource_id[0];
  lookup_number = decodeURI(request.params.sub_resource_id[0]).replace(/\D/g,'');
  current_date_time = moment();
  date_time_updated = current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  updated_by_id = request.verifiedJWTs.authorized_byu_id;
  change_type = "D";

  var sql_query = sql.sql.fromPhone;
  var params = [
    lookup_number,
    byu_id
  ];
  return connection["ces"].execute(sql_query, params)
    .then(function (results) {
      if (results.rows.length === 0) {
        throw new ClientError(404, "Could not find BYU_ID in Person Table")
      }
      if (!results.rows[0].lookup_number) {
        throw new ClientError(204, "")
      }
      person_id = (results.rows[0].person_id) ? results.rows[0].person_id : " ";
      net_id = (results.rows[0].net_id) ? results.rows[0].net_id : " ";
      employee_type = (results.rows[0].employee_type && results.rows[0].employee_type === "--") ? results.rows[0].employee_type : "Not An Employee";
      student_status = results.rows[0].student_status;
      restricted = (results.rows[0].restricted && results.rows[0].restricted === "Y") ? "Y" : "N";

      date_time_created = moment(results.rows[0].date_time_created, accepted_date_formats)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
      created_by_id = results.rows[0].created_by_id;
      from_country_code = (results.rows[0].country_code) ? results.rows[0].country_code : " ";
      from_cell_flag = (results.rows[0].cell_flag) ? results.rows[0].cell_flag : " ";
      from_time_code = (results.rows[0].time_code) ? results.rows[0].time_code : " ";
      from_texts_okay = (results.rows[0].texts_okay) ? results.rows[0].texts_okay : " ";
      from_unlisted = (results.rows[0].unlisted) ? results.rows[0].unlisted : " ";
      from_primary_flag = (results.rows[0].primary_flag) ? results.rows[0].primary_flag : " ";
      from_tty = (results.rows[0].tty) ? results.rows[0].tty : " ";
      from_verified_flag = (results.rows[0].verified_flag) ? results.rows[0].verified_flag : " ";
      from_work_flag = (results.rows[0].work_flag) ? results.rows[0].work_flag : " ";
      from_phone_number = results.rows[0].phone_number || ' ';
      country_code = " ";
      cell_flag = " ";
      time_code = " ";
      texts_okay = " ";
      unlisted = " ";
      primary_flag = " ";
      tty = " ";
      verified_flag = " ";
      work_flag = " ";

      var log_params = [
        change_type,
        byu_id,
        lookup_number,
        date_time_updated,
        updated_by_id,
        date_time_created,
        created_by_id,
        from_phone_number,
        from_country_code,
        from_cell_flag,
        from_time_code,
        from_texts_okay,
        from_unlisted,
        from_primary_flag,
        from_tty,
        from_verified_flag,
        from_work_flag,
        phone_number,
        country_code,
        cell_flag,
        time_code,
        texts_okay,
        unlisted,
        primary_flag,
        tty,
        verified_flag,
        work_flag
      ];

      sql_query = sql.modifyPhone.delete;
      //Run SQL and Commit changes to the database
      return connection["ces"].executeWithCommit(sql_query, params)
        .then(function () {
          sql_query = sql.modifyPhone.logChange;
          return connection["ces"].executeWithCommit(sql_query, log_params)
        })
        .then(function () {
          return phoneDeletedEvents(connection)
        })
    })
    .then(function () {
      return ""
    })
};

function phoneEvents(connection) {
  var source_dt = moment()['tz']("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var event_type = (change_type === "A") ? "Phone Number Added" : "Phone Number Changed";
  var event_type2 = (change_type === "A") ? "Phone Number Added v2" : "Phone Number Changed v2";
  var domain = "edu.byu";
  var entity = "BYU-IAM";
  var filters = [];
  var phone_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id + "/phones/" + lookup_number;
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
  if (restricted !== "Y" && unlisted === "N") {
    var body = [
      "person_id",
      person_id,
      "byu_id",
      byu_id,
      "net_id",
      net_id,
      "lookup_number",
      lookup_number,
      "phone_number",
      phone_number,
      "cell_flag",
      cell_flag,
      "time_code",
      time_code,
      "texts_okay",
      texts_okay,
      "country_code",
      country_code,
      "primary_flag",
      primary_flag,
      "tty",
      tty,
      "unlisted",
      unlisted,
      "updated_by_id",
      updated_by_id,
      "date_time_updated",
      date_time_updated,
      "created_by_id",
      created_by_id,
      "date_time_created",
      date_time_created,
      "callback_url",
      phone_url
    ];
    var event = eventBuilder.eventBuilder(header, body);
    event_frame.events.event.push(event);

    header[5] = event_type2;
    filters.push("identity_type");
    filters.push(identity_type);
    filters.push("employee_type");
    filters.push(employee_type);
    filters.push("student_status");
    filters.push(student_status);
    event = eventBuilder.eventBuilder(header, body, filters);
    event_frame.events.event.push(event);

    sql_query = sql.eventPersonPhone.raiseEvent;
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
    params = [phone_url];
    return connection["ces"].execute(sql_query, params)
      .then(function (results) {
        if (results.rows.length === 0) {
          sql_query = sql.intermediaryId.put;
          params = [
            phone_url,
            " ",    // actor
            " ",    // group_id
            created_by_id
          ];
          return connection["ces"].executeWithCommit(sql_query, params)
            .then(function () {
              sql_query = sql.intermediaryId.get;
              params = [phone_url];
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
          "lookup_number",
          " ",
          "phone_number",
          " ",
          "cell_flag",
          " ",
          "time_code",
          " ",
          "texts_okay",
          " ",
          "country_code",
          " ",
          "primary_flag",
          " ",
          "tty",
          " ",
          "unlisted",
          unlisted,
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
        filters.push("restricted");
        filters.push(restricted);
        event = eventBuilder.eventBuilder(header, restricted_body, filters);
        event_frame.events.event.push(event);

        sql_query = sql.eventPersonPhone.raiseEvent;
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

function phoneDeletedEvents(connection) {
  var source_dt = moment()['tz']("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var event_type = "Phone Number Deleted";
  var event_type2 = "Phone Number Deleted v2";
  var domain = "edu.byu";
  var entity = "BYU-IAM";
  var filters = [];
  var phone_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id + "/phones/" + lookup_number;
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

  if (restricted !== "Y" && unlisted === "N") {
    var body = [
      "person_id",
      person_id,
      "byu_id",
      byu_id,
      "net_id",
      net_id,
      "lookup_number",
      lookup_number,
      "phone_number",
      phone_number,
      "callback_url",
      phone_url
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

    var sql_query = sql.eventPersonPhone.raiseEvent;
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
    params = [phone_url];
    return connection["ces"].execute(sql_query, params)
      .then(function (results) {
        if (results.rows.length === 0) {
          sql_query = sql.intermediaryId.put;
          params = [
            phone_url,
            " ",    // actor
            " ",    // group_id
            created_by_id
          ];
          return connection["ces"].executeWithCommit(sql_query, params)
            .then(function () {
              sql_query = sql.intermediaryId.get;
              params = [phone_url];
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
          "lookup_number",
          " ",
          "phone_number",
          " ",
          "unlisted",
          unlisted,
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
        event = eventBuilder.eventBuilder(header, body);
        event_frame.events.event.push(event);

        header[5] = event_type2;
        filters.push("restricted");
        filters.push(restricted);
        event = eventBuilder.eventBuilder(header, body, filters);
        event_frame.events.event.push(event);

        sql_query = sql.eventPersonPhone.raiseEvent;
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