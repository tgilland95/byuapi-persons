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
var language_code = " ";
var from_speak_proficiency = " ";
var from_read_proficiency = " ";
var from_write_proficiency = " ";
var from_native = " ";
var from_translator = " ";
var speak_proficiency = " ";
var read_proficiency = " ";
var write_proficiency = " ";
var native = " ";
var translator = " ";
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
var language_elements = [
  "speak_proficiency",
  "read_proficiency",
  "write_proficiency",
  "native",
  "translator"
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

function isValidLanguageCode(language_code) {
  if (language_code && language_code.match(/^[A-Z]{2}$/)) {
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

function isValidProficiency(proficiency) {
  switch (proficiency) {
    case "H":
    case "L":
    case "M":
    case "N":
      return true;
    default:
      return false
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
  var def = resources.sub_resource_definitions["languages"];
  var sql_query = sql.sql.getLanguages;

  //updates the URL to reflect the requested BYU_ID
  var links_map = {
    byu_id: request.params.resource_id[0]
  };
  core.updateHATEOASData(def.links, links_map);

  //add BYU_ID from the RESOURCE_ID in the url
  params.push(request.params.resource_id[0]);
  //If there is a SUB_RESOURCE_ID perform the following:
  if (request.params.sub_resource_id) {
    if (request.params.sub_resource_id.length !== 1) {
      throw new ClientError(409, "Incorrect URL: Missing or extra sub resource in URL use LANGUAGE_CODE")
    }
    if (!isValidLanguageCode(request.params.sub_resource_id[0])) {
      throw new ClientError(409, "Invalid URL: language_code not found")
    }
    //grab the getLanguage SQL from SQL.JS
    sql_query = sql.sql.getLanguage;
    //add LANGUAGE_CODE to parameters for SQL query from SUB_RESOURCE_ID first array slot
    params.unshift(request.params.sub_resource_id[0])
  }
  //execute the SQL_QUERY selected based off of IF statements using PARAMS array values
  return connection["ces"].execute(sql_query, params)
    .then(function (results) {
      if (results.rows.length === 0) {
        throw new ClientError(404, "BYU_ID not found in person table")
      }
      if (results.rows[0].restricted === 'Y' && !inArray('person_restricted', request.params.auth)) {
        throw new ClientError(404, 'BYU_ID not found in person')
      }
      delete def.metadata.default_db;
      if (inArray("person_view_basic", request.params.auth)) {
        def.metadata.validation_response.return_code = 200;
        if (!results.rows[0].language_code && !request.params.sub_resource_id) {
          def.metadata.collection_size = 0;
          def.values.pop();
          return def
        }
        if (!results.rows[0].language_code && request.params.sub_resource_id) {
          throw new ClientError(404, request.params.sub_resource_id[0] + " language not found for this BYU_ID")
        }
        //fill in the METADATA of the DEF.JSON
        def.metadata.collection_size = results.rows.length;
        //process the data and fill in the DEF.JSON values and descriptions
        def.values = core.sqlmap.map_rows(results.rows, def.values[0], sql.sql.map);
        //updated the HATEOAS links
        core.sqlmap.map_results(results.rows, def, sql.sql.map, function (item) {
          links_map.language_code = item.language_code.value;
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
        throw new ClientError(403, "User not authorized to view PERSON data")
      }
    })
};

exports.put = function (connection, resources, request, response) {
  byu_id = request.params.resource_id[0];
  language_code = request.params.sub_resource_id[0];
  speak_proficiency = request.body.speak_proficiency;
  read_proficiency = request.body.read_proficiency;
  write_proficiency = request.body.write_proficiency;
  native = request.body.native;
  translator = request.body.translator;
  current_date_time = moment();
  updated_by_id = (!request.body.updated_by_id || (request.body.updated_by_id === " ")) ? request.verifiedJWTs.authorized_byu_id : request.body.updated_by_id;
  date_time_updated = (!request.body.date_time_updated || (request.body.date_time_updated === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](request.body.date_time_updated, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  created_by_id = (!request.body.created_by_id || (request.body.created_by_id === " ")) ? request.verifiedJWTs.authorized_byu_id : request.body.created_by_id;
  date_time_created = (!request.body.date_time_created || (request.body.date_time_created === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](request.body.date_time_created, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var log_params = [];

  if (!isValidLanguageCode(request.params.sub_resource_id[0])) {
    throw new ClientError(409, "Invalid URL: language_code not found")
  }

  var error = false;
  var msg = "Incorrect BODY: Missing\n";
  language_elements.forEach(function (item) {
    if (request.body[item] === undefined) {
      msg += "\n\"" + item + "\": \" \",";
      error = true
    }
    else if (request.body[item] === "") {
      request.body[item] = " "
    }
  });
  language_elements.forEach(function (item) {
    switch (item) {
      case "speak_proficiency":
      case "read_proficiency":
      case "write_proficiency":
        if (!isValidProficiency(request.body[item])) {
          msg += "\n\t" + item + " must be H, M, L, or N";
          error = true
        }
        break;
      case "native":
      case "translator":
        if (!isYesOrNo(request.body[item])) {
          msg += "\n\t" + item + " must be Y or N";
          error = true
        }
    }
  });
  if (error) {
    throw new ClientError(409, msg)
  }
  if (!inArray("person_update_basic", request.params.auth)) {
    throw new ClientError(403, "User not authorized to update language data")
  }

  var sql_query = sql.sql.fromLanguage;
  var params = [
    language_code,
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

      change_type = (!results.rows[0].language_code) ? "A" : "C";
      from_speak_proficiency = (results.rows[0].speak_proficiency) ? results.rows[0].speak_proficiency : " ";
      from_write_proficiency = (results.rows[0].write_proficiency) ? results.rows[0].write_proficiency : " ";
      from_read_proficiency = (results.rows[0].read_proficiency) ? results.rows[0].read_proficiency : " ";
      from_native = (results.rows[0].native) ? results.rows[0].native : " ";
      from_translator = (results.rows[0].translator) ? results.rows[0].translator : " ";

      log_params = [
        change_type,
        byu_id,
        date_time_updated,
        updated_by_id,
        date_time_created,
        created_by_id,
        language_code,
        from_speak_proficiency,
        from_read_proficiency,
        from_write_proficiency,
        from_native,
        from_translator,
        speak_proficiency,
        read_proficiency,
        write_proficiency,
        native,
        translator
      ];

      var is_different = false;
      if ((speak_proficiency !== from_speak_proficiency) ||
        (write_proficiency !== from_write_proficiency) ||
        (read_proficiency !== from_read_proficiency) ||
        (native !== from_native) ||
        (translator !== from_translator)) {
        is_different = true
      }

      if (is_different && !results.rows[0].language_code) {
        //SQL to add record
        sql_query = sql.modifyLanguage.create;
        params = [
          byu_id,
          language_code,
          date_time_updated,
          updated_by_id,
          date_time_created,
          created_by_id,
          speak_proficiency,
          read_proficiency,
          write_proficiency,
          native,
          translator
        ];
        return connection["ces"].executeWithCommit(sql_query, params)
      }
      else if (is_different && results.rows[0].language_code) {
        sql_query = sql.modifyLanguage.update;
        params = [
          date_time_updated,
          updated_by_id,
          speak_proficiency,
          read_proficiency,
          write_proficiency,
          native,
          translator,
          byu_id,
          language_code
        ];
        return connection["ces"].executeWithCommit(sql_query, params)
      }
    })
    .then(function () {
      sql_query = sql.modifyLanguage.logChange;
      return connection["ces"].executeWithCommit(sql_query, log_params)
    })
    .then(function () {
      return languageEvents(connection)
    })
    .then(function () {
      return exports.get(connection, resources, request, response)
    })
};

exports.delete = function (connection, resources, request, response) {
  if (!isValidLanguageCode(request.params.sub_resource_id[0])) {
    throw new ClientError(409, "Invalid URL: language_code not found")
  }
  if (!inArray("person_update_basic", request.params.auth)) {
    throw new ClientError(403, "User not authorized to update basic data")
  }
  byu_id = request.params.resource_id[0];
  language_code = request.params.sub_resource_id[0];
  date_time_updated = moment()["tz"]("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  updated_by_id = request.verifiedJWTs.authorized_byu_id;
  change_type = "D";

  var sql_query = sql.sql.fromLanguage;
  var params = [
    language_code,
    byu_id
  ];
  return connection["ces"].execute(sql_query, params)
    .then(function (results) {
      if (results.rows.length === 0) {
        throw new ClientError(404, "Could not find BYU_ID in Person Table")
      }
      if (!results.rows[0].language_code) {
        throw new ClientError(204, "")
      }
      person_id = (results.rows[0].person_id) ? results.rows[0].person_id : " ";
      net_id = (results.rows[0].net_id) ? results.rows[0].net_id : " ";
      employee_type = (results.rows[0].employee_type && results.rows[0].employee_type === "--") ? results.rows[0].employee_type : "Not An Employee";
      student_status = results.rows[0].student_status;
      restricted = (results.rows[0].restricted && results.rows[0].restricted === "Y") ? "Y" : "N";

      date_time_created = moment(results.rows[0].date_time_created, accepted_date_formats)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
      created_by_id = results.rows[0].created_by_id;
      from_speak_proficiency = (results.rows[0].speak_proficiency) ? results.rows[0].speak_proficiency : " ";
      from_read_proficiency = (results.rows[0].read_proficiency) ? results.rows[0].read_proficiency : " ";
      from_write_proficiency = (results.rows[0].write_proficiency) ? results.rows[0].write_proficiency : " ";
      from_native = (results.rows[0].native) ? results.rows[0].native : " ";
      from_translator = (results.rows[0].translator) ? results.rows[0].translator : " ";
      speak_proficiency = " ";
      read_proficiency = " ";
      write_proficiency = " ";
      native = " ";
      translator = " ";

      var log_params = [
        change_type,
        byu_id,
        date_time_updated,
        updated_by_id,
        date_time_created,
        created_by_id,
        language_code,
        from_speak_proficiency,
        from_read_proficiency,
        from_write_proficiency,
        from_native,
        from_translator,
        speak_proficiency,
        read_proficiency,
        write_proficiency,
        native,
        translator
      ];

      sql_query = sql.modifyLanguage.delete;
      return connection["ces"].executeWithCommit(sql_query, params)
        .then(function () {
          sql_query = sql.modifyLanguage.logChange;
          return connection["ces"].executeWithCommit(sql_query, log_params)
        })
        .then(function () {
          return languageDeletedEvents(connection)
        })
    })
    .then(function () {
      return ""
    })
};

function languageEvents(connection) {
  var source_dt = current_date_time.clone().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var event_type = (change_type === "A") ? "Language Added" : "Language Changed";
  var event_type2 = (change_type === "A") ? "Language Added v2" : "Language Changed v2";
  var domain = "edu.byu";
  var entity = "BYU-IAM";
  var filters = [];
  var language_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id + "/languages/" + language_code;
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
      "language_code",
      language_code,
      "speak_proficiency",
      speak_proficiency,
      "read_proficiency",
      read_proficiency,
      "write_proficiency",
      write_proficiency,
      "native",
      native,
      "translator",
      translator,
      "updated_by_id",
      updated_by_id,
      "date_time_updated",
      date_time_updated,
      "created_by_id",
      created_by_id,
      "date_time_created",
      date_time_created,
      "callback_url",
      language_url
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

    sql_query = sql.eventPersonLanguage.raiseEvent;
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
    params = [language_url];
    return connection["ces"].execute(sql_query, params)
      .then(function (results) {
        if (results.rows.length === 0) {
          sql_query = sql.intermediaryId.put;
          params = [
            language_url,
            " ",    // actor
            " ",    // group_id
            created_by_id
          ];
          return connection["ces"].executeWithCommit(sql_query, params)
            .then(function () {
              sql_query = sql.intermediaryId.get;
              params = [language_url];
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
          "language_code",
          " ",
          "speak_proficiency",
          " ",
          "read_proficiency",
          " ",
          "write_proficiency",
          " ",
          "native",
          " ",
          "translator",
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

        sql_query = sql.eventPersonLanguage.raiseEvent;
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

function languageDeletedEvents(connection) {
  var source_dt = moment()['tz']("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var event_type = "Language Deleted";
  var event_type2 = "Language Deleted v2";
  var domain = "edu.byu";
  var entity = "BYU-IAM";
  var filters = [];
  var language_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id + "/languages/" + language_code;
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
      "language_code",
      language_code,
      "callback_url",
      language_url
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

    var sql_query = sql.eventPersonLanguage.raiseEvent;
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
    params = [language_url];
    return connection["ces"].execute(sql_query, params)
      .then(function (results) {
        if (results.rows.length === 0) {
          sql_query = sql.intermediaryId.put;
          params = [
            language_url,
            " ",    // actor
            " ",    // group_id
            created_by_id
          ];
          return connection["ces"].executeWithCommit(sql_query, params)
            .then(function () {
              sql_query = sql.intermediaryId.get;
              params = [language_url];
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
          "language_code",
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

        sql_query = sql.eventPersonLanguage.raiseEvent;
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