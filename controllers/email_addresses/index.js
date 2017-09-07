"use strict";

var moment = require("moment-timezone");
var sql = require("./sql.js");
var eventBuilder = require("./../event.js");
var core = require("../../core.js");
var bluebird = require("bluebird");
var ClientError = core.ClientError;
var validator = require("email-validator");


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
var email_address_type = " ";
var from_email_address = " ";
var from_unlisted = " ";
var from_verified_flag = " ";
var email_address = " ";
var unlisted = " ";
var verified_flag = " ";
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
var email_address_elements = [
  "email_address",
  "unlisted",
  "verified_flag"
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


function isValidEmailAddressType(email_address_type) {
  var emailAddressTypes = require("../../meta/email_addresses/emailAddressTypes.json");
  var email_address_types = emailAddressTypes.items;

  for (var i = email_address_types.length; i--;) {
    if (email_address_type === email_address_types[i]["domain_value"]) {
      return true
    }
  }
  return false
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
  var def = resources.sub_resource_definitions["email_addresses"];
  var sql_query = sql.sql.getEmailAddresses;

  //updates the URL to reflect the requested BYU_ID
  var links_map = {
    byu_id: request.params.resource_id[0]
  };
  core.updateHATEOASData(def.links, links_map);

  //add BYU_ID from the RESOURCE_ID in the url
  params.push(request.params.resource_id[0]);
  //If there is a SUB_RESOURCE_ID perform the following:
  if (request.params.sub_resource_id) {
    //Error returned for missing or extra sub_resource_id(s)
    if (request.params.sub_resource_id.length !== 1) {
      throw new ClientError(409, "Incorrect URL: Missing or extra sub resource in URL use ADDRESS TYPE")
    }
    if (!isValidEmailAddressType(request.params.sub_resource_id[0])) {
      throw new ClientError(409, "Invalid URL: email_address_type is not PERSONAL, WORK, nor SECURITY")
    }
    //grab the getEmailAddress SQL from SQL.JS
    sql_query = sql.sql.getEmailAddress;
    //add EMAIL_ADDRESS_TYPE to parameters for SQL query from SUB_RESOURCE_ID first array slot
    params.unshift(request.params.sub_resource_id[0])
  }
  //execute the SQL_QUERY selected based off of IF statements using PARAMS array values
  return connection["ces"].execute(sql_query, params)
    .then(function (results) {
      if (results.rows.length === 0) {
        throw new ClientError(404, 'BYU_ID not found in person')
      }
      if (results.rows[0].restricted === 'Y' && !inArray('person_restricted', request.params.auth)) {
        throw new ClientError(404, 'BYU_ID not found in person')
      }
      delete def.metadata.default_db;
      if (inArray("person_view_contact", request.params.auth)) {
        def.metadata.validation_response.return_code = 200;
        if (!results.rows[0].email_address_type && !request.params.sub_resource_id) {
          def.metadata.collection_size = 0;
          def.values.pop();
          return def
        }
        if (!results.rows[0].email_address_type && request.params.sub_resource_id) {
          throw new ClientError(404, request.params.sub_resource_id[0] + " email address not found")
        }
        //fill in the METADATA of the DEF.JSON
        def.metadata.collection_size = results.rows.length;
        //process the data and fill in the DEF.JSON values and descriptions
        def.values = core.sqlmap.map_rows(results.rows, def.values[0], sql.sql.map);
        //updated the HATEOAS links
        core.sqlmap.map_results(results.rows, def, sql.sql.map, function (item) {
          links_map.email_address_type = item.email_address_type.value;
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
        // Keep WORK address for public directory
        var work_email_address = [];
        length = results.rows.length;
        for (var x = 0; x < length; x++) {
          if (results.rows[x].email_address_type === "WORK") {
            work_email_address.push(results.rows[x])
          }
        }
        results.rows = work_email_address;
        //if the query was good but no records exist return an empty object
        if (results.rows &&
          !results.rows[0].email_address_type &&
          !request.params.sub_resource_id) {
          def.metadata.validation_response.return_code = 200;
          def.values.pop();
          return def
        }
        if (results.rows &&
          !results.rows[0].email_address_type &&
          request.params.sub_resource_id) {
          throw new ClientError(404, request.params.sub_resource_id[0] + " email address not found")
        }
        if (results.rows &&
          ((results.rows[0]["primary_role"] === "Employee") ||
            (results.rows[0]["primary_role"] === "Faculty"))) {
          //process the data and fill in the DEF.JSON values and descriptions
          def.values = core.sqlmap.map_rows(results.rows, def.values[0], sql.sql.public_map);
          //updated the HATEOAS links
          core.sqlmap.map_results(results.rows, def, sql.sql.map, function (item) {
            links_map.email_address_type = item.email_address_type.value;
            core.updateHATEOASData(item.links, links_map)
          });
          for (i = def.values.length; i--;) {
            if (def.values[i].unlisted.value === "Y") {
              def.values[i].pop();
              def.values[i] = "Email Address Unlisted"
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
  email_address_type = request.params.sub_resource_id[0];
  email_address = request.body.email_address;
  verified_flag = (request.body.verified_flag && request.body.verified_flag === "Y") ? "Y" : "N";
  unlisted = (request.body.unlisted && request.body.unlisted === "Y") ? "Y" : "N";
  current_date_time = moment();
  updated_by_id = (!request.body.updated_by_id || (request.body.updated_by_id === " ")) ? request.verifiedJWTs.authorized_byu_id : request.body.updated_by_id;
  date_time_updated = (!request.body.date_time_updated || (request.body.date_time_updated === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](request.body.date_time_updated, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  created_by_id = (!request.body.created_by_id || (request.body.created_by_id === " ")) ? request.verifiedJWTs.authorized_byu_id : request.body.created_by_id;
  date_time_created = (!request.body.date_time_created || (request.body.date_time_created === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](request.body.date_time_created, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var log_params = [];

  if (!isValidEmailAddressType(request.params.sub_resource_id[0])) {
    throw new ClientError(409, "Invalid URL: email_address_type is not PERSONAL, WORK, nor SECURITY")
  }

  var error = false;
  var msg = "Incorrect BODY: Missing\n";
  email_address_elements.forEach(function (item) {
    if (request.body[item] === undefined) {
      if (item === "verified_flag") {
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
  if (validator.validate(email_address) === false) {
    msg += "\n\tInvalid email_address, unrecognized format";
    error = true
  }
  if (!isYesOrNo(unlisted)) {
    msg += "\n\tUnlisted must be set to 'Y' or 'N'";
    error = true
  }
  if (!isYesOrNo(verified_flag)) {
    msg += "\n\tverified_flag must be set to 'Y' or 'N'"
  }
  if (error) {
    throw new ClientError(409, msg)
  }
  if (!inArray("person_update_contact", request.params.auth)) {
    throw new ClientError(403, "User not authorized to update CONTACT data")
  }

  var sql_query = sql.sql.fromEmailAddress;
  var params = [
    email_address_type,
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

      change_type = (!results.rows[0].email_address_type) ? "A" : "C";
      from_email_address = (results.rows[0].email_address) ? results.rows[0].email_address : " ";
      from_unlisted = (results.rows[0].unlisted) ? results.rows[0].unlisted : " ";
      from_verified_flag = (results.rows[0].verified_flag) ? results.rows[0].verified_flag : " ";

      log_params = [
        change_type,
        byu_id,
        email_address_type,
        date_time_updated,
        updated_by_id,
        date_time_created,
        created_by_id,
        from_email_address,
        from_unlisted,
        from_verified_flag,
        email_address,
        unlisted,
        verified_flag
      ];

      var is_different = false;
      if ((email_address !== from_email_address) ||
        (verified_flag !== from_verified_flag) ||
        (unlisted !== from_unlisted)) {
        is_different = true
      }

      if (is_different && !results.rows[0].email_address_type) {
        sql_query = sql.modifyEmailAddress.create;
        params = [
          byu_id,
          email_address_type,
          date_time_updated,
          updated_by_id,
          date_time_created,
          created_by_id,
          email_address,
          unlisted,
          verified_flag
        ];
        return connection["ces"].executeWithCommit(sql_query, params)
      }
      else if (is_different && results.rows[0].email_address_type) {
        sql_query = sql.modifyEmailAddress.update;
        params = [
          date_time_updated,
          updated_by_id,
          email_address,
          unlisted,
          verified_flag,
          byu_id,
          email_address_type
        ];
        return connection["ces"].executeWithCommit(sql_query, params)
      }
    })
    .then(function () {
      sql_query = sql.modifyEmailAddress.logChange;
      return connection["ces"].executeWithCommit(sql_query, log_params)
    })
    .then(function () {
      return emailAddressEvents(connection)
    })
    .then(function () {
      return exports.get(connection, resources, request, response)
    })
};

exports.delete = function (connection, resources, request, response) {
  if (!isValidEmailAddressType(request.params.sub_resource_id[0])) {
    throw new ClientError(409, "Invalid URL: email_address_type is not PERSONAL, WORK, nor SECURITY")
  }
  if (!inArray("person_update_contact", request.params.auth)) {
    throw new ClientError(403, "User not authorized to update CONTACT data")
  }
  byu_id = request.params.resource_id[0];
  email_address_type = request.params.sub_resource_id[0];
  current_date_time = moment();
  date_time_updated = current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  updated_by_id = request.verifiedJWTs.authorized_byu_id;
  change_type = "D";

  var sql_query = sql.sql.fromEmailAddress;
  var params = [
    email_address_type,
    byu_id
  ];
  return connection["ces"].execute(sql_query, params)
    .then(function (results) {
      if (results.rows.length === 0) {
        throw new ClientError(404, "Could not find BYU_ID in Person Table")
      }
      if (!results.rows[0].email_address_type) {
        throw new ClientError(204, "")
      }
      person_id = (results.rows[0].person_id) ? results.rows[0].person_id : " ";
      net_id = (results.rows[0].net_id) ? results.rows[0].net_id : " ";
      employee_type = (results.rows[0].employee_type && results.rows[0].employee_type === "--") ? results.rows[0].employee_type : "Not An Employee";
      student_status = results.rows[0].student_status;
      restricted = (results.rows[0].restricted && results.rows[0].restricted === "Y") ? "Y" : "N";

      date_time_created = moment(results.rows[0].date_time_created, accepted_date_formats)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
      created_by_id = results.rows[0].created_by_id;
      from_email_address = (results.rows[0].email_address) ? results.rows[0].email_address : " ";
      from_unlisted = (results.rows[0].unlisted) ? results.rows[0].unlisted : " ";
      from_verified_flag = (results.rows[0].verified_flag) ? results.rows[0].verified_flag : " ";
      email_address = " ";
      unlisted = " ";
      verified_flag = " ";

      var log_params = [
        change_type,
        byu_id,
        email_address_type,
        date_time_updated,
        updated_by_id,
        date_time_created,
        created_by_id,
        from_email_address,
        from_unlisted,
        from_verified_flag,
        email_address,
        unlisted,
        verified_flag
      ];

      sql_query = sql.modifyEmailAddress.delete;
      //Run SQL and Commit changes to the database
      return connection["ces"].executeWithCommit(sql_query, params)
        .then(function () {
          sql_query = sql.modifyEmailAddress.logChange;
          return connection["ces"].executeWithCommit(sql_query, log_params)
        })
        .then(function () {
          return emailAddressDeletedEvents(connection)
        })
    })
    .then(function () {
      return ""
    })
};

function emailAddressEvents(connection) {
  var source_dt = moment()['tz']("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var event_type = (change_type === "A") ? "Email Address Added" : "Email Address Changed";
  var event_type2 = (change_type === "A") ? "Email Address Added v2" : "Email Address Changed v2";
  var domain = "edu.byu";
  var entity = "BYU-IAM";
  var filters = [];
  var email_address_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id + "/email_addresses/" + email_address_type;
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
      "email_address_type",
      email_address_type,
      "email_address",
      email_address,
      "verified_flag",
      verified_flag,
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
      email_address_url
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

    sql_query = sql.eventPersonEmailAddress.raiseEvent;
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
    params = [email_address_url];
    return connection["ces"].execute(sql_query, params)
      .then(function (results) {
        if (results.rows.length === 0) {
          sql_query = sql.intermediaryId.put;
          params = [
            email_address_url,
            " ",    // actor
            " ",    // group_id
            created_by_id
          ];
          return connection["ces"].executeWithCommit(sql_query, params)
            .then(function () {
              sql_query = sql.intermediaryId.get;
              params = [email_address_url];
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
          "email_address_type",
          " ",
          "email_address",
          " ",
          "verified_flag",
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

        sql_query = sql.eventPersonEmailAddress.raiseEvent;
        params = [JSON.stringify(event_frame)];
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
      })
  }
}

function emailAddressDeletedEvents(connection) {
  var source_dt = moment()['tz']("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var event_type = "Email Address Deleted";
  var event_type2 = "Email Address Deleted v2";
  var domain = "edu.byu";
  var entity = "BYU-IAM";
  var filters = [];
  var email_address_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id + "/email_addresses/" + email_address_type;
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
      "email_address_type",
      email_address_type,
      "callback_url",
      email_address_url
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

    var sql_query = sql.eventPersonEmailAddress.raiseEvent;
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
    params = [email_address_url];
    return connection["ces"].execute(sql_query, params)
      .then(function (results) {
        if (results.rows.length === 0) {
          sql_query = sql.intermediaryId.put;
          params = [
            email_address_url,
            " ",    // actor
            " ",    // group_id
            created_by_id
          ];
          return connection["ces"].executeWithCommit(sql_query, params)
            .then(function () {
              sql_query = sql.intermediaryId.get;
              params = [email_address_url];
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
          "email_address_type",
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

        sql_query = sql.eventPersonEmailAddress.raiseEvent;
        params = [JSON.stringify(event_frame)];
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
      })
  }
}