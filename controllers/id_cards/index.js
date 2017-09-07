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
var from_credential = " ";
var from_site_id = " ";
var from_dtf_flag = " ";
var from_unlisted = " ";
var from_printed_name = " ";
var from_primary_role = " ";
var from_secondary_role = " ";
var from_beard_flag = " ";
var from_use_pref_name_on_id_card = " ";
var credential = " ";
var site_id = " ";
var dtf_flag = " ";
var unlisted = " ";
var printed_name = " ";
var primary_role = " ";
var secondary_role = " ";
var beard_flag = " ";
var use_preferred_name_on_id_card = " ";
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
var id_card_elements = [
  "card_credential_id",
  "site_id",
  "dtf_flag",
  "unlisted",
  "printed_name",
  "primary_role_current",
  "secondary_role_current",
  "beard_flag",
  "use_preferred_name_on_id_card"
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


function isValidRole(primary_role, secondary_role) {
  var cardRoles = require("../../meta/roles/roles.json");
  var roles = cardRoles.items;

  for (var i = roles.length; i--;) {
    var role1 = roles[i]["primary_role"];
    var role2 = roles[i]["secondary_role"];
    if ((primary_role === role1) && (secondary_role === role2)) {
      return true
    }
  }
  return false
}

//Performs the GET method
exports.get = function (connection, resources, request, response) {
  //Declare variables
  var params = [];
  //identify DEF.JSON file to be filled
  var def = resources.sub_resource_definitions["id_cards"];
  var sql_query = sql.sql.getIdCard;

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
        throw new ClientError(404, "BYU_ID not found in person table")
      }
      if (results.rows[0].restricted === 'Y' && !inArray('person_restricted', request.params.auth)) {
        throw new ClientError(404, 'BYU_ID not found in person')
      }
      delete def.metadata['default_db'];
      if (inArray("person_view_basic", request.params.auth)) {
        //fill in the METADATA of the DEF.JSON
        def.metadata.collection_size = results.rows.length;
        //process the data and fill in the DEF.JSON values and descriptions
        def = core.sqlmap.map_row(results.rows[0], def, sql.sql.map);
        def.metadata.validation_response.return_code = 200;
        def.date_time_updated.value = moment(results.rows[0].date_time_updated)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
        def.date_time_created.value = moment(results.rows[0].date_time_created)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
        def.expiration_date.value = (results.rows[0].expiration_date) ? moment(results.rows[0].expiration_date)["format"]("YYYY-MM-DD") : "";
        //display the DEF.JSON filled out
        return def
      }
      else {
        throw new ClientError(403, "User not authorized to view PERSON data")
      }
    })
};

exports.put = function (connection, resources, request, response) {
  byu_id = request.params.resource_id[0];
  credential = request.body.card_credential_id;
  site_id = request.body.site_id;
  dtf_flag = (request.body.dtf_flag && request.body.dtf_flag === "Y") ? "Y" : "N";
  printed_name = request.body.printed_name;
  primary_role = request.body.primary_role_current;
  secondary_role = request.body.secondary_role_current;
  beard_flag = (request.body.beard_flag && request.body.beard_flag === "Y") ? "Y" : "N";
  use_preferred_name_on_id_card = (request.body.use_preferred_name_on_id_card && request.body.use_preferred_name_on_id_card === "Y") ? "Y" : "N";
  unlisted = (request.body.unlisted && request.body.unlisted === "Y") ? "Y" : "N";
  current_date_time = moment();
  updated_by_id = (!request.body.updated_by_id || (request.body.updated_by_id === " ")) ? request.verifiedJWTs.authorized_byu_id : request.body.updated_by_id;
  date_time_updated = (!request.body.date_time_updated || (request.body.date_time_updated === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](request.body.date_time_updated, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  created_by_id = (!request.body.created_by_id || (request.body.created_by_id === " ")) ? request.verifiedJWTs.authorized_byu_id : request.body.created_by_id;
  date_time_created = (!request.body.date_time_created || (request.body.date_time_created === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](request.body.date_time_created, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var log_params = [];

  var error = false;
  var msg = "Incorrect BODY: Missing\n";
  id_card_elements.forEach(function (item) {
    if (request.body[item] === undefined) {
      if (item === "use_preferred_name_on_id_card") {
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
  if (!isValidRole(primary_role, secondary_role)) {
    msg += "\n\tprimary_role and secondary role are invalid or invalid combination";
    error = true
  }
  if (credential && (credential.search(/^[0-9]{11}$/) === -1 || credential.substr(0, 9) !== byu_id)) {
    msg += "\n\tcard_credential_id must be 11 digit number and first 9 digits must match BYU_ID";
    error = true
  }
  if (error) {
    throw new ClientError(409, msg)
  }

  var sql_query = sql.sql.fromIdCard;
  var params = [
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

      change_type = (!results.rows[0].card_credential_id) ? "A" : "C";

      from_credential = (results.rows[0].card_credential_id) ? results.rows[0].card_credential_id : " ";
      from_site_id = (results.rows[0].site_id) ? results.rows[0].site_id : " ";
      from_dtf_flag = (results.rows[0].dtf_flag) ? results.rows[0].dtf_flag : " ";
      from_printed_name = (results.rows[0].printed_name) ? results.rows[0].printed_name : " ";
      from_primary_role = (results.rows[0].primary_role_when_issued) ? results.rows[0].primary_role_when_issued : " ";
      from_secondary_role = (results.rows[0].secondary_role_when_issued) ? results.rows[0].secondary_role_when_issued : " ";
      from_beard_flag = (results.rows[0].beard_flag) ? results.rows[0].beard_flag : " ";
      from_use_pref_name_on_id_card = (results.rows[0].use_preferred_name_on_id_card) ? results.rows[0].use_preferred_name_on_id_card : " ";
      from_unlisted = (results.rows[0].unlisted) ? results.rows[0].unlisted : " ";

      log_params = [
        change_type,
        byu_id,
        date_time_updated,
        updated_by_id,
        date_time_created,
        created_by_id,
        from_credential,
        from_site_id,
        from_dtf_flag,
        from_unlisted,
        from_printed_name,
        from_primary_role,
        from_secondary_role,
        from_beard_flag,
        from_use_pref_name_on_id_card,
        credential,
        site_id,
        dtf_flag,
        unlisted,
        printed_name,
        primary_role,
        secondary_role,
        beard_flag,
        use_preferred_name_on_id_card
      ];

      var is_different = false;
      if ((credential !== from_credential) ||
        (site_id !== from_site_id) ||
        (dtf_flag !== from_dtf_flag) ||
        (printed_name !== from_printed_name) ||
        (primary_role !== from_primary_role) ||
        (secondary_role !== from_secondary_role) ||
        (beard_flag !== from_beard_flag) ||
        (use_preferred_name_on_id_card !== from_use_pref_name_on_id_card)) {
        is_different = true
      }
      var is_different_unlisted = false;
      if (unlisted !== from_unlisted) {
        is_different_unlisted = true;
      }

      if ((is_different || is_different_unlisted) && !results.rows[0].card_credential_id) {
        //SQL to add record
        if (!inArray("person_update_id_card", request.params.auth)) {
          throw new ClientError(403, "User not authorized to create id_card")
        }
        sql_query = sql.modifyIdCards.createCard;
        params = [
          credential,
          byu_id,
          site_id,
          dtf_flag,
          unlisted,
          printed_name,
          primary_role,
          secondary_role,
          beard_flag,
          date_time_updated,
          updated_by_id,
          date_time_created,
          created_by_id,
          use_preferred_name_on_id_card
        ];
        return connection["ces"].executeWithCommit(sql_query, params)
      }
      else if ((is_different || is_different_unlisted) && results.rows[0].card_credential_id) {
        //select new SQL query to update record
        if (is_different && !inArray("person_update_id_card", request.params.auth)) {
          throw new ClientError(403, "User not authorized to update id_card")
        }
        if (!is_different && is_different_unlisted && !inArray("person_update_id_card_unlisted", request.params.auth)) {
          throw new ClientError(403, "User not authorized to update id_card unlisted")
        }
        sql_query = sql.modifyIdCards.updateCard;
        params = [
          credential,
          site_id,
          dtf_flag,
          unlisted,
          printed_name,
          primary_role,
          secondary_role,
          beard_flag,
          date_time_updated,
          updated_by_id,
          use_preferred_name_on_id_card,
          byu_id
        ];
        return connection["ces"].executeWithCommit(sql_query, params)
      }
    })
    .then(function () {
      sql_query = sql.modifyIdCards.logCardChange;
      return connection["ces"].executeWithCommit(sql_query, log_params)
    })
    .then(function () {
      return idCardEvents(connection)
    })
    .then(function () {
      return exports.get(connection, resources, request, response)
    })
};

exports.delete = function (connection, resources, request, response) {
  if (!inArray("person_update_id_card", request.params.auth)) {
    throw new ClientError(403, "User not authorized to update id_card data")
  }
  byu_id = request.params.resource_id[0];
  date_time_updated = moment()["tz"]("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  updated_by_id = request.verifiedJWTs.authorized_byu_id;
  change_type = "D";

  var sql_query = sql.sql.fromIdCard;
  var params = [
    byu_id
  ];
  return connection["ces"].execute(sql_query, params)
    .then(function (results) {
      if (results.rows.length === 0) {
        throw new ClientError(404, "Could not find BYU_ID in Person Table")
      }
      if (!results.rows[0].card_credential_id) {
        throw new ClientError(204, "")
      }
      person_id = (results.rows[0].person_id) ? results.rows[0].person_id : " ";
      net_id = (results.rows[0].net_id) ? results.rows[0].net_id : " ";
      employee_type = (results.rows[0].employee_type && results.rows[0].employee_type === "--") ? results.rows[0].employee_type : "Not An Employee";
      student_status = results.rows[0].student_status;
      restricted = (results.rows[0].restricted && results.rows[0].restricted === "Y") ? "Y" : "N";

      date_time_created = moment(results.rows[0].date_time_created, accepted_date_formats)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
      created_by_id = results.rows[0].created_by_id;
      from_credential = (results.rows[0].card_credential_id) ? results.rows[0].card_credential_id : " ";
      from_site_id = (results.rows[0].site_id) ? results.rows[0].site_id : " ";
      from_dtf_flag = (results.rows[0].dtf_flag) ? results.rows[0].dtf_flag : " ";
      from_unlisted = (results.rows[0].unlisted) ? results.rows[0].unlisted : " ";
      from_printed_name = (results.rows[0].printed_name) ? results.rows[0].printed_name : " ";
      from_primary_role = (results.rows[0].primary_role_when_issued) ? results.rows[0].primary_role_when_issued : " ";
      from_secondary_role = (results.rows[0].secondary_role_when_issued) ? results.rows[0].secondary_role_when_issued : " ";
      from_beard_flag = (results.rows[0].beard_flag) ? results.rows[0].beard_flag : " ";
      from_use_pref_name_on_id_card = (results.rows[0].use_preferred_name_on_id_card) ? results.rows[0].use_preferred_name_on_id_card : " ";
      credential = " ";
      site_id = " ";
      dtf_flag = " ";
      unlisted = " ";
      printed_name = " ";
      primary_role = " ";
      secondary_role = " ";
      beard_flag = " ";
      use_preferred_name_on_id_card = " ";

      var log_params = [
        change_type,
        byu_id,
        date_time_updated,
        updated_by_id,
        date_time_created,
        created_by_id,
        from_credential,
        from_site_id,
        from_dtf_flag,
        from_unlisted,
        from_printed_name,
        from_primary_role,
        from_secondary_role,
        from_beard_flag,
        from_use_pref_name_on_id_card,
        credential,
        site_id,
        dtf_flag,
        unlisted,
        printed_name,
        primary_role,
        secondary_role,
        beard_flag,
        use_preferred_name_on_id_card
      ];

      sql_query = sql.modifyIdCards.deleteCard;
      return connection["ces"].executeWithCommit(sql_query, params)
        .then(function () {
          sql_query = sql.modifyIdCards.logCardChange;
          return connection["ces"].executeWithCommit(sql_query, log_params)
        })
        .then(function () {
          return idCardDeleted(connection)
        })
    })
    .then(function () {
      return ""
    })
};

function idCardEvents(connection) {
  var source_dt = moment()['tz']("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var event_type = (change_type === "A") ? "ID Card Added" : "ID Card Changed";
  var event_type2 = (change_type === "A") ? "ID Card Added v2" : "ID Card Changed v2";
  var domain = "edu.byu";
  var entity = "BYU-IAM";
  var filters = [];
  var id_card_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id + "/id_cards";
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
      "site_id",
      site_id,
      "dtf_flag",
      dtf_flag,
      "printed_name",
      printed_name,
      "primary_role",
      primary_role,
      "secondary_role",
      secondary_role,
      "beard_flag",
      beard_flag,
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
      id_card_url
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

    sql_query = sql.event.raiseEvent;
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
    params = [id_card_url];
    return connection["ces"].execute(sql_query, params)
      .then(function (results) {
        if (results.rows.length === 0) {
          sql_query = sql.intermediaryId.put;
          params = [
            id_card_url,
            " ",    // actor
            " ",    // group_id
            created_by_id
          ];
          return connection["ces"].executeWithCommit(sql_query, params)
            .then(function () {
              sql_query = sql.intermediaryId.get;
              params = [id_card_url];
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
          "site_id",
          " ",
          "dtf_flag",
          " ",
          "printed_name",
          " ",
          "primary_role",
          " ",
          "secondary_role",
          " ",
          "beard_flag",
          " ",
          "unlisted",
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

        sql_query = sql.event.raiseEvent;
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

function idCardDeleted(connection) {
  var source_dt = moment()["tz"]("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var event_type = "ID Card Deleted";
  var event_type2 = "ID Card Deleted v2";
  var domain = "edu.byu";
  var entity = "BYU-IAM";
  var filters = [];
  var id_card_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id + "/id_cards";
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
      "callback_url",
      id_card_url
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

    var sql_query = sql.event.raiseEvent;
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
    params = [id_card_url];
    return connection["ces"].execute(sql_query, params)
      .then(function (results) {
        if (results.rows.length === 0) {
          sql_query = sql.intermediaryId.put;
          params = [
            id_card_url,
            " ",    // actor
            " ",    // group_id
            created_by_id
          ];
          return connection["ces"].executeWithCommit(sql_query, params)
            .then(function () {
              sql_query = sql.intermediaryId.get;
              params = [id_card_url];
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
          "unlisted",
          unlisted,
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

        sql_query = sql.event.raiseEvent;
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