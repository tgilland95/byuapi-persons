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
var related_id = " ";
var from_relationship_type = " ";
var from_date_time_verified = "";
var from_verified_by_id = " ";
var relationship_type = " ";
var date_time_verified = "";
var verified_by_id = " ";
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
var relationship_elements = [
  "relationship_type",
  "date_time_verified",
  "verified_by_id"
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

function validateRelatedId(related_id) {
  if (!related_id.match(/^[0-9]{9}$/)) {
    throw new ClientError(409, "Invalid URL: RELATED_ID must be a 9 digit number with no spaces or dashes")
  }
}

//Performs the GET method
exports.get = function (connection, resources, request, response) {
  //Declare variables
  var params = [];
  //identify DEF.JSON file to be filled
  var def = resources.sub_resource_definitions.relationships;
  var sql_query = sql.sql.getRelationships;

  //updates the URL to reflect the requested BYU_ID
  var links_map = {
    byu_id: request.params.resource_id[0]
  };
  core.updateHATEOASData(def.links, links_map);

  //add BYU_ID from the RESOURCE_ID in the url
  params.push(request.params.resource_id[0]);
  //If there is a SUB_RESOURCE_ID perform the following:
  if (request.params.sub_resource_id) {
    validateRelatedId(request.params.sub_resource_id[0]);
    //grab the getRelationship SQL from SQL.JS
    sql_query = sql.sql.getRelationship;
    //add RELATED_ID to parameters for SQL query from SUB_RESOURCE_ID first array slot
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
      //checks the restricted status of related persons and removes them if user is not authorized to see them
      if (!inArray('person_restricted_other', request.params.auth)) {
        for (var i = 0; i < results.rows.length; i++) {
          if (results.rows[i]["related_restricted"] === 'Y') {
            if (results.rows.length === 1) {
              results.rows[i].related_id = null
            }
            else {
              results.rows.splice(i, 1);
              i--
            }
          }
        }
      }
      delete def.metadata.default_db;
      if (inArray("person_view_relationship", request.params.auth)) {
        def.metadata.validation_response.return_code = 200;
        if (!results.rows[0].related_id && !request.params.sub_resource_id) {
          def.metadata.collection_size = 0;
          def.values.pop();
          return def
        }
        if (!results.rows[0].related_id && request.params.sub_resource_id) {
          throw new ClientError(404, request.params.sub_resource_id[0] + " address not found")
        }
        //fill in the METADATA of the DEF.JSON
        def.metadata.collection_size = results.rows.length;
        //process the data and fill in the DEF.JSON values and descriptions
        def.values = core.sqlmap.map_rows(results.rows, def.values[0], sql.sql.map);
        //updated the HATEOAS links
        core.sqlmap.map_results(results.rows, def, sql.sql.map, function (item) {
          links_map.related_id = item.related_id.value;
          core.updateHATEOASData(item.links, links_map)
        });
        var length = def.values.length;
        for (i = 0; i < length; i++) {
          def.values[i].date_time_updated["value"] = moment(results.rows[i].date_time_updated)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
          def.values[i].date_time_created["value"] = moment(results.rows[i].date_time_created)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
          def.values[i].date_time_verified["value"] = (results.rows[i].date_time_verified) ? moment(results.rows[i].date_time_verified)["format"]("YYYY-MM-DD HH:mm:ss.SSS") : ""
        }
        return def
      }
      else {
        throw new ClientError(403, "User not authorized to view RELATIONSHIP data")
      }
    })
};

exports.put = function (connection, resources, request, response) {
  byu_id = request.params.resource_id[0];
  related_id = request.params.sub_resource_id[0];
  relationship_type = request.body.relationship_type;
  current_date_time = moment();
  updated_by_id = (!request.body.updated_by_id || (request.body.updated_by_id === " ")) ? request.verifiedJWTs.authorized_byu_id : request.body.updated_by_id;
  date_time_updated = (!request.body.date_time_updated || (request.body.date_time_updated === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](request.body.date_time_updated, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  created_by_id = (!request.body.created_by_id || (request.body.created_by_id === " ")) ? request.verifiedJWTs.authorized_byu_id : request.body.created_by_id;
  date_time_created = (!request.body.date_time_created || (request.body.date_time_created === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](request.body.date_time_created, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  verified_by_id = (request.body.verified_by_id) ? request.body.verified_by_id : " ";
  date_time_verified = (!request.body.date_time_verified || request.body.date_time_verified === " ") ? "" : moment["tz"](request.body.date_time_verified, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var log_params = [];

  validateRelatedId(request.params.sub_resource_id[0]);

  var error = false;
  var msg = "Incorrect BODY: Missing ";
  relationship_elements.forEach(function (item) {
    if (request.body[item] === undefined) {
      msg += "\n\"" + item + "\": \" \", ";
      error = true
    }
    else if (request.body[item] === "") {
      request.body[item] = " "
    }
  });
  switch (relationship_type) {
    case "CHILD":
    case "RESPONSIBLE_IDENTITY":
    case "CONTACT_IDENTITY":
    case "GRANDCHILD":
    case "PARENT":
    case "SPOUSE":
    case "GRANDPARENT":
    case "FORMER SPOUSE":
      break;
    default:
      msg += "\n\tInvalid Body: Invalid RELATIONSHIP_TYPE (NOTE: case sensitive)";
      error = true
  }
  if (date_time_verified && (date_time_verified > current_date_time)) {
    msg += "\n\tdate_time_verified may not be in the future";
    error = true
  }
  if (!verified_by_id.match(/^( |[0-9]{9})$/)) {
    msg += "\n\tverified_by_id must be a nine character numeric string or a space";
    error = true
  }
  if (error) {
    throw new ClientError(409, msg)
  }
  if (!inArray("person_update_relationship", request.params.auth)) {
    throw new ClientError(403, "User not authorized")
  }

  var sql_query = sql.sql.fromRelationship;
  var params = [
    related_id,
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

      change_type = (!results.rows[0].related_id) ? "A" : "C";
      from_verified_by_id = (results.rows[0].verified_by_id) ? results.rows[0].verified_by_id : " ";
      from_date_time_verified = (results.rows[0].date_time_verified) ? moment["tz"](results.rows[0].date_time_verified, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : "";
      from_relationship_type = (results.rows[0].relationship_type) ? results.rows[0].relationship_type : " ";

      log_params = [
        change_type,
        byu_id,
        related_id,
        from_relationship_type,
        from_date_time_verified,
        from_verified_by_id,
        relationship_type,
        date_time_verified,
        verified_by_id,
        date_time_updated,
        updated_by_id,
        date_time_created,
        created_by_id
      ];

      var is_different = false;
      if ((relationship_type !== from_relationship_type) ||
        (verified_by_id !== from_verified_by_id) ||
        (date_time_verified !== from_date_time_verified)) {
        is_different = true
      }

      if (is_different && !results.rows[0].related_id) {
        //SQL to add record
        sql_query = sql.modifyRelationship.create;
        params = [
          byu_id,
          relationship_type,
          related_id,
          date_time_updated,
          updated_by_id,
          date_time_created,
          created_by_id,
          date_time_verified,
          verified_by_id
        ];
        return connection["ces"].executeWithCommit(sql_query, params)
      }
      else if (is_different && results.rows[0].related_id) {
        sql_query = sql.modifyRelationship.update;
        params = [
          date_time_updated,
          updated_by_id,
          relationship_type,
          date_time_verified,
          verified_by_id,
          byu_id,
          related_id
        ];
        return connection["ces"].executeWithCommit(sql_query, params)
      }
    })
    .then(function () {
      sql_query = sql.modifyRelationship.logChange;
      return connection["ces"].executeWithCommit(sql_query, log_params)
    })
    .then(function () {
      return relationshipEvents(connection)
    })
    .then(function () {
      return exports.get(connection, resources, request, response)
    })
};

exports.delete = function (connection, resources, request, response) {
  validateRelatedId(request.params.sub_resource_id[0]);
  if (!inArray("person_update_relationship", request.params.auth)) {
    throw new ClientError(403, "User not authorized")
  }
  byu_id = request.params.resource_id[0];
  related_id = request.params.sub_resource_id[0];
  current_date_time = moment();
  date_time_updated = current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  updated_by_id = request.verifiedJWTs.authorized_byu_id;
  change_type = "D";

  var sql_query = sql.sql.fromRelationship;
  var params = [
    related_id,
    byu_id
  ];
  return connection["ces"].execute(sql_query, params)
    .then(function (results) {
      if (results.rows.length === 0) {
        throw new ClientError(404, "Could not find BYU_ID in Person Table")
      }
      if (!results.rows[0].related_id) {
        throw new ClientError(204, "")
      }
      person_id = (results.rows[0].person_id) ? results.rows[0].person_id : " ";
      net_id = (results.rows[0].net_id) ? results.rows[0].net_id : " ";
      employee_type = (results.rows[0].employee_type && results.rows[0].employee_type === "--") ? results.rows[0].employee_type : "Not An Employee";
      student_status = results.rows[0].student_status;
      restricted = (results.rows[0].restricted && results.rows[0].restricted === "Y") ? "Y" : "N";

      date_time_created = moment(results.rows[0].date_time_created, accepted_date_formats)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
      created_by_id = results.rows[0].created_by_id;
      from_relationship_type = results.rows[0].relationship_type;
      from_date_time_verified = (results.rows[0].date_time_verified) ? moment["tz"](results.rows[0].date_time_verified, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : "";
      from_verified_by_id = (results.rows[0].verified_by_id) ? results.rows[0].verified_by_id : " ";
      relationship_type = " ";
      date_time_verified = "";
      verified_by_id = " ";

      var log_params = [
        change_type,
        byu_id,
        related_id,
        from_relationship_type,
        from_date_time_verified,
        from_verified_by_id,
        relationship_type,
        date_time_verified,
        verified_by_id,
        date_time_updated,
        updated_by_id,
        date_time_created,
        created_by_id
      ];

      sql_query = sql.modifyRelationship.delete;
      return connection["ces"].executeWithCommit(sql_query, params)
        .then(function () {
          sql_query = sql.modifyRelationship.logChange;
          return connection["ces"].executeWithCommit(sql_query, log_params)
        })
        .then(function () {
          return relationshipDeletedEvents(connection)
        })
    })
    .then(function () {
      return ""
    })
};

function relationshipEvents(connection) {
  var source_dt = moment()['tz']("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var event_type = (change_type === "A") ? "Relationship Added" : "Relationship Changed";
  var event_type2 = (change_type === "A") ? "Relationship Added v2" : "Relationship Changed v2";
  var domain = "edu.byu";
  var entity = "BYU-IAM";
  var filters = [];
  var identity_type = "PERSON";
  var relationship_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id + "/relationships/" + related_id;
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
      "related_id",
      related_id,
      "relationship_type",
      relationship_type,
      "verified_by_id",
      verified_by_id,
      "date_time_verified",
      date_time_verified,
      "updated_by_id",
      updated_by_id,
      "date_time_updated",
      date_time_updated,
      "created_by_id",
      created_by_id,
      "date_time_created",
      date_time_created,
      "callback_url",
      relationship_url
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

    sql_query = sql.eventPersonRelationship.raiseEvent;
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
    params = [relationship_url];
    return connection["ces"].execute(sql_query, params)
      .then(function (results) {
        if (results.rows.length === 0) {
          sql_query = sql.intermediaryId.put;
          params = [
            relationship_url,
            " ",    // actor
            " ",    // group_id
            created_by_id
          ];
          return connection["ces"].executeWithCommit(sql_query, params)
            .then(function () {
              sql_query = sql.intermediaryId.get;
              params = [relationship_url];
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
          "related_id",
          " ",
          "relationship_type",
          " ",
          "verified_by_id",
          " ",
          "date_time_verified",
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

        sql_query = sql.eventPersonRelationship.raiseEvent;
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

function relationshipDeletedEvents(connection) {
  var source_dt = moment()['tz']("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var event_type = "Relationship Deleted";
  var event_type2 = "Relationship Deleted v2";
  var domain = "edu.byu";
  var entity = "BYU-IAM";
  var filters = [];
  var relationship_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id + "/relationships/" + related_id;
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
      "related_id",
      related_id,
      "callback_url",
      relationship_url
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

    var sql_query = sql.eventPersonRelationship.raiseEvent;
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
    params = [relationship_url];
    return connection["ces"].execute(sql_query, params)
      .then(function (results) {
        if (results.rows.length === 0) {
          sql_query = sql.intermediaryId.put;
          params = [
            relationship_url,
            " ",    // actor
            " ",    // group_id
            created_by_id
          ];
          return connection["ces"].executeWithCommit(sql_query, params)
            .then(function () {
              sql_query = sql.intermediaryId.get;
              params = [relationship_url];
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
          "related_id",
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

        sql_query = sql.eventPersonRelationship.raiseEvent;
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