"use strict";

var moment = require("moment-timezone");
var sql = require("./sql.js");
var eventBuilder = require("./../event.js");
var core = require("../../core.js");
var bluebird = require("bluebird");
var ClientError = core.ClientError;


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
var ethnicity_code = " ";
var from_primary_flag = " ";
var primary_flag = " ";
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
var ethnicity_elements = [
  "primary_flag"
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

function isValidEthnicityCode(ethnicity_code) {
  var ethnicityCodes = require("../../meta/ethnicities/ethnicityCodes.json");
  var ethnicity_codes = ethnicityCodes.items;

  if (ethnicity_code && ethnicity_code.match(/^[A-Z]{3}$/)) {
    for (var i = ethnicity_codes.length; i--;) {
      if (ethnicity_code === ethnicity_codes[i]["domain_value"]) {
        return true
      }
    }
  }
  else {
    return false
  }
}

//Performs the GET method
exports.get = function (connection, resources, request, response) {
  //Declare variables
  var params = [];
  //identify DEF.JSON file to be filled
  var def = resources.sub_resource_definitions["ethnicities"];
  var sql_query = sql.sql.getEthnicities;

  //updates the URL to reflect the requested BYU_ID
  var links_map = {
    byu_id: request.params.resource_id[0]
  };
  core.updateHATEOASData(def.links, links_map);

  //add BYU_ID from the RESOURCE_ID in the url
  params.push(request.params.resource_id[0]);
  //If there is a SUB_RESOURCE_ID perform the following:
  if (request.params.sub_resource_id) {
    if (!isValidEthnicityCode(request.params.sub_resource_id[0])) {
      throw new ClientError(409, "Incorrect URL: ethnicity_code is not recognized")
    }
    //grab the getEthnicity SQL from SQL.JS
    sql_query = sql.sql.getEthnicity;
    //add ETHNICITY_CODE to parameters for SQL query from SUB_RESOURCE_ID first array slot
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
      if (inArray("person_view_basic", request.params.auth)) {
        def.metadata.validation_response.return_code = 200;
        if (!results.rows[0].ethnicity_code && !request.params.sub_resource_id) {
          def.metadata.collection_size = 0;
          def.values.pop();
          return def
        }
        if (!results.rows[0].ethnicity_code && request.params.sub_resource_id) {
          throw new ClientError(404, request.params.sub_resource_id[0] + " ethnicity not found")
        }
        //fill in the METADATA of the DEF.JSON
        def.metadata.collection_size = results.rows.length;
        //process the data and fill in the DEF.JSON values and descriptions
        def.values = core.sqlmap.map_rows(results.rows, def.values[0], sql.sql.map);
        //updated the HATEOAS links
        core.sqlmap.map_results(results.rows, def, sql.sql.map, function (item) {
          links_map.ethnicity_code = item.ethnicity_code.value;
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
        throw new ClientError(403, "User authorized to view PUBLIC DIRECTORY info only")
      }
    })
};

exports.put = function (connection, resources, request, response) {
  byu_id = request.params.resource_id[0];
  ethnicity_code = request.params.sub_resource_id[0];
  primary_flag = (request.body.primary_flag && request.body.primary_flag === "Y") ? "Y" : "N";
  current_date_time = moment();
  updated_by_id = (!request.body.updated_by_id || (request.body.updated_by_id === " ")) ? request.verifiedJWTs.authorized_byu_id : request.body.updated_by_id;
  date_time_updated = (!request.body.date_time_updated || (request.body.date_time_updated === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](request.body.date_time_updated, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  created_by_id = (!request.body.created_by_id || (request.body.created_by_id === " ")) ? request.verifiedJWTs.authorized_byu_id : request.body.created_by_id;
  date_time_created = (!request.body.date_time_created || (request.body.date_time_created === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](request.body.date_time_created, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var log_params = [];

  if (!isValidEthnicityCode(ethnicity_code)) {
    throw new ClientError(409, "Invalid URL: ethnicity_code is not recognized")
  }

  var error = false;
  var msg = "Incorrect BODY: Missing\n";
  ethnicity_elements.forEach(function (item) {
    if (request.body[item] === undefined) {
      msg += "\n\"" + item + "\": \" \"";
      error = true
    }
    else if (request.body[item] === "") {
      request.body[item] = " "
    }
  });
  if (error) {
    throw new ClientError(409, msg)
  }
  if (!inArray("person_update_basic", request.params.auth)) {
    throw new ClientError(403, "User not authorized to update basic data")
  }

  var sql_query = sql.sql.fromEthnicity;
  var params = [
    ethnicity_code,
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

      change_type = (!results.rows[0].ethnicity_code) ? "A" : "C";
      from_primary_flag = (results.rows[0].primary_flag) ? results.rows[0].primary_flag : " ";

      log_params = [
        change_type,
        byu_id,
        ethnicity_code,
        date_time_updated,
        updated_by_id,
        date_time_created,
        created_by_id,
        from_primary_flag,
        primary_flag
      ];

      var is_different = false;
      if (primary_flag !== from_primary_flag) {
        is_different = true
      }

      if (is_different && !results.rows[0].ethnicity_code) {
        sql_query = sql.modifyEthnicity.create;
        params = [
          byu_id,
          ethnicity_code,
          date_time_updated,
          updated_by_id,
          date_time_created,
          created_by_id,
          primary_flag
        ];
        return connection["ces"].executeWithCommit(sql_query, params)
      }
      else if (is_different && results.rows[0].ethnicity_code) {
        //select new SQL query to update record
        sql_query = sql.modifyEthnicity.update;
        params = [
          date_time_updated,
          updated_by_id,
          primary_flag,
          byu_id,
          ethnicity_code
        ];
        return connection["ces"].executeWithCommit(sql_query, params)
      }
    })
    .then(function () {
      sql_query = sql.modifyEthnicity.logChange;
      return connection["ces"].executeWithCommit(sql_query, log_params)
    })
    .then(function () {
      return ethnicityEvents(connection)
    })
    .then(function () {
      return exports.get(connection, resources, request, response)
    })
};

exports.delete = function (connection, resources, request, response) {
  if (!isValidEthnicityCode(request.params.sub_resource_id[0])) {
    throw new ClientError(409, "Invalid URL: ethnicity_code is not recognized")
  }
  if (!inArray("person_update_basic", request.params.auth)) {
    throw new ClientError(403, "User not authorized to update basic data")
  }
  byu_id = request.params.resource_id[0];
  ethnicity_code = request.params.sub_resource_id[0];
  date_time_updated = moment()["tz"]("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  updated_by_id = request.verifiedJWTs.authorized_byu_id;
  change_type = "D";

  var sql_query = sql.sql.fromEthnicity;
  var params = [
    ethnicity_code,
    byu_id
  ];
  return connection["ces"].execute(sql_query, params)
    .then(function (results) {
      if (results.rows.length === 0) {
        throw new ClientError(404, "Could not find BYU_ID in Person Table")
      }
      if (!results.rows[0].ethnicity_code) {
        throw new ClientError(204, "")
      }
      person_id = (results.rows[0].person_id) ? results.rows[0].person_id : " ";
      net_id = (results.rows[0].net_id) ? results.rows[0].net_id : " ";
      employee_type = (results.rows[0].employee_type && results.rows[0].employee_type === "--") ? results.rows[0].employee_type : "Not An Employee";
      student_status = results.rows[0].student_status;
      restricted = (results.rows[0].restricted && results.rows[0].restricted === "Y") ? "Y" : "N";

      date_time_created = moment(results.rows[0].date_time_created, accepted_date_formats)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
      created_by_id = results.rows[0].created_by_id;
      from_primary_flag = (results.rows[0].primary_flag) ? results.rows[0].primary_flag : "N";
      primary_flag = " ";

      var log_params = [
        change_type,
        byu_id,
        ethnicity_code,
        date_time_updated,
        updated_by_id,
        date_time_created,
        created_by_id,
        from_primary_flag,
        primary_flag
      ];

      sql_query = sql.modifyEthnicity.delete;
      return connection["ces"].executeWithCommit(sql_query, params)
        .then(function () {
          sql_query = sql.modifyEthnicity.logChange;
          return connection["ces"].executeWithCommit(sql_query, log_params)
        })
        .then(function () {
          return ethnicityDeletedEvents(connection)
        })
    })
    .then(function () {
      return ""
    })
};

function ethnicityEvents(connection) {
  var source_dt = moment()['tz']("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var event_type = (change_type === "A") ? "Ethnicity Added" : "Ethnicity Changed";
  var event_type2 = (change_type === "A") ? "Ethnicity Added v2" : "Ethnicity Changed v2";
  var domain = "edu.byu";
  var entity = "BYU-IAM";
  var filters = [];
  var ethnicity_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id + "/ethnicities/" + ethnicity_code;
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
      "ethnicity_code",
      ethnicity_code,
      "primary_flag",
      primary_flag,
      "updated_by_id",
      updated_by_id,
      "date_time_updated",
      date_time_updated,
      "created_by_id",
      created_by_id,
      "date_time_created",
      date_time_created,
      "callback_url",
      ethnicity_url
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

    sql_query = sql.eventPersonEthnicity.raiseEvent;
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
    params = [ethnicity_url];
    return connection["ces"].execute(sql_query, params)
      .then(function (results) {
        if (results.rows.length === 0) {
          sql_query = sql.intermediaryId.put;
          params = [
            ethnicity_url,
            " ",    // actor
            " ",    // group_id
            created_by_id
          ];
          return connection["ces"].executeWithCommit(sql_query, params)
            .then(function () {
              sql_query = sql.intermediaryId.get;
              params = [ethnicity_url];
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
          "ethnicity_code",
          " ",
          "primary_flag",
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
        filters.push("restricted");
        filters.push(restricted);
        event = eventBuilder.eventBuilder(header, restricted_body, filters);
        event_frame.events.event.push(event);

        sql_query = sql.eventPersonEthnicity.raiseEvent;
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

function ethnicityDeletedEvents(connection) {
  var source_dt = moment()["tz"]("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var event_type = "Ethnicity Deleted";
  var event_type2 = "Ethnicity Deleted v2";
  var domain = "edu.byu";
  var entity = "BYU-IAM";
  var filters = [];
  var ethnicity_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id + "/ethnicities/" + ethnicity_code;
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
      "ethnicity_code",
      ethnicity_code,
      "callback_url",
      ethnicity_url
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

    var sql_query = sql.eventPersonEthnicity.raiseEvent;
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
    params.push(ethnicity_url);
    return connection["ces"].execute(sql_query, params)
      .then(function (results) {
        if (results.rows.length === 0) {
          sql_query = sql.intermediaryId.put;
          params = [
            ethnicity_url,
            " ",    // actor
            " ",    // group_id
            created_by_id
          ];
          return connection["ces"].executeWithCommit(sql_query, params)
            .then(function () {
              sql_query = sql.intermediaryId.get;
              params = [ethnicity_url];
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
          "ethnicity_code",
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

        sql_query = sql.eventPersonEthnicity.raiseEvent;
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