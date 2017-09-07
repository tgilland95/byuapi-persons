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
var credential_type = " ";
var user_name = " ";
var from_user_name = " ";
var from_lost_or_stolen = " ";
var from_status = " ";
var from_expiration_date = "";
var from_issuing_location = " ";
var from_physical_form = " ";
var from_associated_device = " ";
var from_scoped_affiliation = " ";
var credential_id = " ";
var lost_or_stolen = " ";
var status = " ";
var expiration_date = "";
var issuing_location = " ";
var physical_form = " ";
var associated_device = " ";
var scoped_affiliation = " ";
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

function isValidIssuingLocation(issuing_location) {
  var issuingLocation = require("../../meta/id_centers/idCenters.json");
  var issuing_locations = issuingLocation.items;

  for (var i = issuing_locations.length; i--;) {
    if (issuing_location === issuing_locations[i]["domain_value"]) {
      return true
    }
  }
  return false
}


function isValidCredentialType(credential_type) {
  var credentialType = require("../../meta/credential_types/credentialTypes.json");
  var credential_types = credentialType.items;

  for (var i = credential_types.length; i--;) {
    if (credential_type === credential_types[i]["domain_value"]) {
      return true
    }
  }
  return false
}

function validateCredentialId(credential_type, credential_id) {
  if (isValidCredentialType(credential_type)) {
    //check URL for correct credential type
    switch (credential_type) {
      case "NET_ID":
        if (credential_id.search(/^[a-z][a-z0-9]{0,8}$/) === -1) {
          throw new ClientError(409, "Invalid URL: Please Fix and Resubmit" +
            "\nNET_ID 1 to 9 lowercase alpha numeric characters")
        }
        break;
      case "PROX_CARD":
        if (credential_id.search(/^[0-9]{3,7}$/) === -1) {
          throw new ClientError(409, "Invalid URL: Please Fix and Resubmit" +
            "\nPROX_CARD 3 to 7 digit numeric")
        }
        break;
      case "WSO2_CLIENT_ID":
        if (credential_id.search(/^[a-zA-Z0-9_]{28}$/) === -1) {
          throw new ClientError(409, "Invalid URL: Please Fix and Resubmit" +
            "\nWSO2_CLIENT_ID 28 printable characters")
        }
        break;
      case "ID_CARD":
        if (credential_id.search(/^[0-9]{11}$/) === -1) {
          throw new ClientError(409, "Invalid URL: Please Fix and Resubmit" +
            "\nID_CARD is an 11 digit number 9 digit BYU_ID + 2 digit issue number Example 12345678901")
        }
        break;
      default:
    }
  }
  else {
    throw new ClientError(409, "Invalid URL: Invalid credential type")
  }
}

function authorizeCredentialChange(request) {
  switch (request.params.sub_resource_id[0]) {
    case "GOOGLE_ID":
    case "FACEBOOK_ID":
    case "BYU_IDAHO_ID":
    case "BYU_HAWAII_ID":
    case "LDS_ACCOUNT_ID":
    case "LDS_CMIS_ID":
      if (!inArray("person_update_cas_credential", request.params.auth)) {
        throw new ClientError(403, "Federation IDs can only be altered through CAS")
      }
      break;
    case "SEMINARY_STUDENT_ID":
      if (!inArray("person_update_cas_credential", request.params.auth) && !inArray("person_is_lds_sync", request.params.auth)) {
        throw new ClientError(403, "To update Seminary Student ID you need to be in LDS_ACCOUNT group.")
      }
      break;
    case "PROX_CARD":
    case "ID_CARD":
      if (!inArray("person_update_id_card", request.params.auth)) {
        throw new ClientError(403, "User not authorized to create id_card")
      }
      break;
    case "WSO2_CLIENT_ID":
      if (!inArray("person_update_wso2_client_id", request.params.auth)) {
        throw new ClientError(403, "User not authorized to update WSO2 Client ID")
      }
      break;
    case "NET_ID":
      if (!inArray("person_change_net_id", request.params.auth)) {
        throw new ClientError(403, "User not authorized to change NET_ID")
      }
      break;
    default:
      break;
  }
}

exports.get = function (connection, resources, request, response) {
  //Declare variables
  var params = [];
  //identify DEF.JSON file to be filled
  var def = resources.sub_resource_definitions["credentials"];
  var sql_query = sql.sql.getCredentials;

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
    if (request.params.sub_resource_id.length !== 2) {
      throw new ClientError(409, "Incorrect URL: Missing or extra sub resource in URL use 'CREDENTIAL_TYPE,credential_id'")
    }
    validateCredentialId(request.params.sub_resource_id[0], request.params.sub_resource_id[1]);
    //grab the getCredential SQL from SQL.JS
    sql_query = sql.sql.getCredential;
    //add CREDENTIAL_ID to parameters for SQL query from SUB_RESOURCE_ID second array slot
    params.unshift(decodeURIComponent(request.params.sub_resource_id[1]));
    //add CREDENTIAL_TYPE to parameters for SQL query from SUB_RESOURCE_ID first array slot
    params.unshift(request.params.sub_resource_id[0])
  }
  else if ("credential_type" in request.query) {
    sql_query = sql.sql.queryCredential
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
      if (inArray("person_view_basic", request.params.auth) ||
        (request.params.sub_resource_id && (request.params.sub_resource_id[0] === "NET_ID")) ||
        (inArray("person_update_wso2_client_id", request.params.auth) &&
          request.params.sub_resource_id &&
          (request.params.sub_resource_id[0] === "WSO2_CLIENT_ID") ||
          (request.params.sub_resource_id && (request.params.sub_resource_id[0] === "LDS_CMIS_ID" ||
            request.params.sub_resource_id[0] === "LDS_ACCOUNT_ID" ||
            request.params.sub_resource_id[0] === "SEMINARY_STUDENT_ID") &&
            inArray("person_view_lds_cred", request.params.auth)))) {
        def.metadata.validation_response.return_code = 200;
        if (!results.rows[0].credential_id && !request.params.sub_resource_id) {
          def.metadata.collection_size = 0;
          def.values.pop();
          return def
        }
        if (!results.rows[0].credential_id && request.params.sub_resource_id) {
          throw new ClientError(404, request.params.sub_resource_id[0] + " credential not associated with BYU_ID or not found")
        }
        //fill in the METADATA of the DEF.JSON
        def.metadata.collection_size = results.rows.length;
        //process the data and fill in the DEF.JSON values and descriptions
        def.values = core.sqlmap.map_rows(results.rows, def.values[0], sql.sql.map);
        //updated the HATEOAS links
        core.sqlmap.map_results(results.rows, def, sql.sql.map, function (item) {
          links_map.credential_type = item.credential_type.value;
          links_map.credential_id = item.credential_id.value;
          core.updateHATEOASData(item.links, links_map)
        });
        var length = def.values.length;
        for (var i = 0; i < length; i++) {
          def.values[i].date_time_updated["value"] = moment(results.rows[i].date_time_updated)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
          def.values[i].date_time_created["value"] = moment(results.rows[i].date_time_created)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
          def.values[i].expiration_date["value"] = (results.rows[i].expiration_date) ? moment(results.rows[i].expiration_date)["format"]("YYYY-MM-DD") : ""
        }
        return def
      }
      else {
        // Keep NET_ID for public directory
        if (results.rows[0].restricted === "Y" && !inArray('person_restricted', request.params.auth)) {
          throw new ClientError(404, 'BYU_ID not found in person')
        }
        var nid = [];
        length = results.rows.length;
        for (var x = 0; x < length; x++) {
          if (results.rows[x].credential_type === "NET_ID") {
            nid.push(results.rows[x])
          }
        }
        if (inArray("person_update_wso2_client_id", request.params.auth)) {
          for (var y = 0; y < length; y++) {
            if (results.rows[y].credential_type === "WSO2_CLIENT_ID") {
              nid.push(results.rows[y])
            }
          }
        }
        if (inArray("person_view_lds_cred", request.params.auth)) {
          for (var z = 0; z < length; z++) {
            if (results.rows[z].credential_type === "LDS_ACCOUNT_ID" ||
              results.rows[z].credential_type === "LDS_CMIS_ID" ||
              results.rows[z].credential_type === "SEMINARY_STUDENT_ID") {
              nid.push(results.rows[z])
            }
          }
        }
        results.rows = nid;
        //if the query was good but no records exist return an empty object
        if (results.rows[0] &&
          !results.rows[0].credential_id &&
          !request.params.sub_resource_id) {
          def.metadata.validation_response.return_code = 200;
          def.values.pop();
          return def
        }
        if (results.rows[0] &&
          !results.rows[0].credential_id &&
          request.params.sub_resource_id) {
          throw new ClientError(404, request.params.sub_resource_id[0] + " credential not found")
        }
        if (nid.length > 0) {
          //process the data and fill in the DEF.JSON values and descriptions
          def.values = core.sqlmap.map_rows(results.rows, def.values[0], sql.sql.public_map);
          //updated the HATEOAS links
          core.sqlmap.map_results(results.rows, def, sql.sql.map, function (item) {
            links_map.credential_type = item.credential_type.value;
            links_map.credential_id = item.credential_id.value;
            core.updateHATEOASData(item.links, links_map)
          });

          def.metadata.collection_size = results.rows.length;
          def.metadata.validation_response.return_code = 203;
          def.metadata.validation_response.response = "View Authorized Credentials Only";
          return def
        }
        else {
          if (!inArray("person_update_wso2_client_id", request.params.auth)) {
            throw new ClientError(403, "User authorized to view NET_ID only");
          }
          else {
            throw new ClientError(403, "User authorized to view NET_ID and WSO2_CLIENT_ID only");
          }
        }
      }
    })
    .catch(function (e) {
      console.error(e.stack);
    })
};

exports.put = function (connection, resources, request, response) {
  console.log("REQUEST SUBLEVEL", request);
  byu_id = request.params.resource_id[0];
  credential_type = request.params.sub_resource_id[0];
  credential_id = request.params.sub_resource_id[1];
  user_name = (request.body.user_name) ? request.body.user_name : " ";
  lost_or_stolen = (request.body.lost_or_stolen && (request.body.lost_or_stolen === "Y")) ? request.body.lost_or_stolen : "N";
  status = (request.body.status) ? request.body.status : "ACTIVE";
  expiration_date = (request.body.expiration_date) ? request.body.expiration_date : "";
  if (credential_type === "LDS_ACCOUNT_ID") {
    expiration_date = moment["tz"]("America/Denver").add(1, "years").format("YYYY-MM-DD")
  }
  issuing_location = (request.body.issuing_location) ? request.body.issuing_location : " ";
  physical_form = (request.body.physical_form) ? request.body.physical_form : " ";
  associated_device = (request.body.associated_device) ? request.body.associated_device : " ";
  scoped_affiliation = (request.body.scoped_affiliation) ? request.body.scoped_affiliation : " ";
  current_date_time = moment();
  updated_by_id = (!request.body.updated_by_id || (request.body.updated_by_id === " ")) ? request.verifiedJWTs.authorized_byu_id : request.body.updated_by_id;
  date_time_updated = (!request.body.date_time_updated || (request.body.date_time_updated === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](request.body.date_time_updated, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  created_by_id = (!request.body.created_by_id || (request.body.created_by_id === " ")) ? request.verifiedJWTs.authorized_byu_id : request.body.created_by_id;
  date_time_created = (!request.body.date_time_created || (request.body.date_time_created === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](request.body.date_time_created, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var log_params = [];

  if (request.params.sub_resource_id.length !== 2) {
    throw new ClientError(409, "Incorrect URL: Missing or extra sub resource in URL use 'CREDENTIAL_TYPE,credential_id'")
  }
  validateCredentialId(credential_type, credential_id);

  var error = false;
  var msg = "Invalid field values:";
  if (!isValidIssuingLocation(issuing_location)) {
    msg += "\n\tissuing_location is invalid";
    error = true
  }
  if (moment["tz"](expiration_date, "YYYY-MM-DD", "America/Denver") < current_date_time["tz"]("America/Denver")) {
    msg += "\n\texpiration_date cannot be before today";
    error = true
  }
  if (error) {
    throw new ClientError(409, msg)
  }
  authorizeCredentialChange(request);

  var sql_query = sql.sql.checkCredential;
  var params = [
    credential_type,
    credential_id
  ];
  return connection["ces"].execute(sql_query, params)
    .then(function (results) {
      if (results.rows[0] && (byu_id !== results.rows[0].byu_id)) {
        throw new ClientError(409, "Credential Type and ID combination belong to another BYU_ID")
      }
      sql_query = sql.sql.fromCredential;
      params.push(byu_id);
      return connection["ces"].execute(sql_query, params)
        .then(function (results) {
          if (results.rows.length === 0) {
            throw new ClientError(404, "Person not found: Cannot update non-persons through Persons API")
          }
          person_id = (results.rows[0].person_id) ? results.rows[0].person_id : " ";
          net_id = (results.rows[0].net_id) ? results.rows[0].net_id : " ";
          employee_type = (results.rows[0].employee_type) ? results.rows[0].employee_type : "";
          student_status = (results.rows[0].student_status) ? results.rows[0].student_status : "";
          restricted = (results.rows[0].restricted) ? results.rows[0].restricted : "N";
          created_by_id = (results.rows[0].created_by_id) ? results.rows[0].created_by_id : created_by_id;
          date_time_created = (results.rows[0].date_time_created) ? moment["tz"](results.rows[0].date_time_created, "America/Denver").format('YYYY-MM-DD HH:mm:ss.SSS') : date_time_created;

          change_type = (!results.rows[0].credential_type) ? "A" : "C";
          from_user_name = (results.rows[0].user_name) ? results.rows[0].user_name : " ";
          from_lost_or_stolen = (results.rows[0].lost_or_stolen) ? results.rows[0].lost_or_stolen : " ";
          from_status = (results.rows[0].status) ? results.rows[0].status : " ";
          from_expiration_date = (results.rows[0].expiration_date) ? moment(results.rows[0].expiration_date, accepted_date_formats)["format"]("YYYY-MM-DD") : "";
          from_issuing_location = (results.rows[0].issuing_location) ? results.rows[0].issuing_location : " ";
          from_physical_form = (results.rows[0].physical_form) ? results.rows[0].physical_form : " ";
          from_associated_device = (results.rows[0].associated_device) ? results.rows[0].associated_device : " ";
          from_scoped_affiliation = (results.rows[0].scoped_affiliation) ? results.rows[0].scoped_affiliation : " ";

          log_params = [
            change_type,
            byu_id,
            credential_type,
            credential_id,
            date_time_updated,
            updated_by_id,
            date_time_created,
            created_by_id,
            from_user_name,
            from_lost_or_stolen,
            from_status,
            from_expiration_date,
            from_issuing_location,
            from_physical_form,
            from_associated_device,
            from_scoped_affiliation,
            user_name,
            lost_or_stolen,
            status,
            expiration_date,
            issuing_location,
            physical_form,
            associated_device,
            scoped_affiliation
          ];

          var is_different = false;
          if ((user_name !== from_user_name) ||
            (lost_or_stolen !== from_lost_or_stolen) ||
            (status !== from_status) ||
            (expiration_date !== from_expiration_date) ||
            (issuing_location !== from_issuing_location) ||
            (physical_form !== from_physical_form) ||
            (associated_device !== from_associated_device) ||
            (scoped_affiliation !== from_scoped_affiliation)) {
            is_different = true
          }

          if (is_different && !results.rows[0].credential_type) {
            if (credential_type === "NET_ID") {
              if (!credential_id.match(/^[a-z][a-z0-9]{4,7}$/)) {
                throw new ClientError(409, "Invalid URL: New NET_ID's must be 5 to 8 characters long lowercase or numbers and begin with a letter")
              }
            }
            sql_query = sql.modifyCredential.create;
            params = [
              credential_id,
              credential_type,
              user_name,
              byu_id,
              date_time_updated,
              updated_by_id,
              date_time_created,
              created_by_id,
              lost_or_stolen,
              status,
              expiration_date,
              issuing_location,
              physical_form,
              associated_device,
              scoped_affiliation
            ];
            console.log("CREATE PARAMS", params);
            return connection["ces"].executeWithCommit(sql_query, params)
          }
          else if (is_different && results.rows[0].credential_type) {
            if (credential_type === "NET_ID") {
              if (!credential_id.match(/^[a-z][a-z0-9]{0,8}$/)) {
                throw new ClientError(409, "Invalid URL: NET_ID must be 1 to 9 characters long lowercase or numbers and begin with a letter")
              }
            }
            sql_query = sql.modifyCredential.update;
            params = [
              date_time_updated,
              updated_by_id,
              user_name,
              lost_or_stolen,
              status,
              expiration_date,
              issuing_location,
              physical_form,
              associated_device,
              scoped_affiliation,
              byu_id,
              credential_type,
              credential_id
            ];
            console.log("UPDATE PARAMS", params);
            return connection["ces"].executeWithCommit(sql_query, params)
          }
        })
        .then(function () {
          console.log("LOG PARAMS", log_params);
          sql_query = sql.modifyCredential.logChange;
          return connection["ces"].executeWithCommit(sql_query, log_params)
        })
        .then(function () {
          return credentialEvents(connection)
        })
        .then(function () {
          console.log("GET REQUEST", request);
          console.log("RESPONSE", response);
          return exports.get(connection, resources, request, response)
        })
        .catch(function (e) {
          console.error(e.stack);
        })
    })
};

exports.delete = function (connection, resources, request, response) {
  if (request.params.sub_resource_id.length !== 2) {
    throw new ClientError(409, "Incorrect URL: Missing or extra sub resource in URL use 'CREDENTIAL_TYPE,credential_id'")
  }
  validateCredentialId(request.params.sub_resource_id[0], request.params.sub_resource_id[1]);
  if ((request.params.sub_resource_id[0] === "NET_ID") &&
    !inArray("person_change_net_id", request.params.auth)) {
    throw new ClientError(403, "User not authorized to change NET_ID")
  }
  authorizeCredentialChange(request);
  byu_id = request.params.resource_id[0];
  credential_type = request.params.sub_resource_id[0];
  credential_id = request.params.sub_resource_id[1];
  date_time_updated = moment()["tz"]("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  updated_by_id = request.verifiedJWTs.authorized_byu_id;
  change_type = "D";

  var sql_query = sql.sql.checkCredential;
  var params = [
    credential_type,
    credential_id
  ];
  return connection["ces"].execute(sql_query, params)
    .then(function (results) {
      if (results.rows[0] && (byu_id !== results.rows[0].byu_id)) {
        throw new ClientError(409, "Credential Type and ID combination belong to another BYU_ID")
      }
      sql_query = sql.sql.fromCredential;
      params.push(byu_id);
      return connection["ces"].execute(sql_query, params)
        .then(function (results) {
          if (results.rows.length === 0) {
            throw new ClientError(404, "Person not found. BYU_ID is not in Person Table")
          }
          if (!results.rows[0].credential_type) {
            throw new ClientError(204, "")
          }
          person_id = (results.rows[0].person_id) ? results.rows[0].person_id : " ";
          net_id = (results.rows[0].net_id) ? results.rows[0].net_id : " ";
          employee_type = (results.rows[0].employee_type && results.rows[0].employee_type === "--") ? results.rows[0].employee_type : "Not An Employee";
          student_status = results.rows[0].student_status;
          restricted = (results.rows[0].restricted && results.rows[0].restricted === "Y") ? "Y" : "N";

          date_time_created = moment(results.rows[0].date_time_created, accepted_date_formats)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
          created_by_id = results.rows[0].created_by_id;
          from_user_name = (results.rows[0].user_name) ? results.rows[0].user_name : " ";
          from_lost_or_stolen = (results.rows[0].lost_or_stolen) ? results.rows[0].lost_or_stolen : "N";
          from_status = (results.rows[0].status) ? results.rows[0].status : "ACTIVE";
          from_expiration_date = (results.rows[0].expiration_date) ? moment(results.rows[0].expiration_date, accepted_date_formats)["format"]("YYYY-MM-DD") : "";
          from_issuing_location = (results.rows[0].issuing_location) ? results.rows[0].issuing_location : " ";
          from_physical_form = (results.rows[0].physical_form) ? results.rows[0].physical_form : " ";
          from_associated_device = (results.rows[0].associated_device) ? results.rows[0].associated_device : " ";
          from_scoped_affiliation = (results.rows[0].scoped_affiliation) ? results.rows[0].scoped_affiliation : " ";
          user_name = " ";
          lost_or_stolen = " ";
          status = " ";
          expiration_date = "";
          issuing_location = " ";
          physical_form = " ";
          associated_device = " ";
          scoped_affiliation = " ";

          var log_params = [
            change_type,
            byu_id,
            credential_type,
            credential_id,
            date_time_updated,
            updated_by_id,
            date_time_created,
            created_by_id,
            from_user_name,
            from_lost_or_stolen,
            from_status,
            from_expiration_date,
            from_issuing_location,
            from_physical_form,
            from_associated_device,
            from_scoped_affiliation,
            user_name,
            lost_or_stolen,
            status,
            expiration_date,
            issuing_location,
            physical_form,
            associated_device,
            scoped_affiliation
          ];

          sql_query = sql.modifyCredential.delete;
          return connection["ces"].executeWithCommit(sql_query, params)
            .then(function () {
              sql_query = sql.modifyCredential.logChange;
              return connection["ces"].executeWithCommit(sql_query, log_params)
            })
            .then(function () {
              return credentialDeletedEvents(connection)
            })
        })
    })
    .then(function () {
      return ""
    })
};

function credentialEvents(connection) {
  var source_dt = moment()['tz']("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var event_type = (change_type === "A") ? "Credential Added" : "Credential Changed";
  var event_type2 = (change_type === "A") ? "Credential Added v2" : "Credential Changed v2";
  var domain = "edu.byu";
  var entity = "BYU-IAM";
  var filters = [];
  var credential_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id + "/credentials/" + credential_type + "," + credential_id;
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
      "credential_type",
      credential_type,
      "credential_id",
      credential_id,
      "user_name",
      user_name,
      "lost_or_stolen",
      lost_or_stolen,
      "status",
      status,
      "expiration_date",
      expiration_date,
      "associated_device",
      associated_device,
      "physical_form",
      physical_form,
      "updated_by_id",
      updated_by_id,
      "date_time_updated",
      date_time_updated,
      "created_by_id",
      created_by_id,
      "date_time_created",
      date_time_created,
      "callback_url",
      credential_url
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
    filters.push("scoped_affiliation");
    filters.push(scoped_affiliation);
    event = eventBuilder.eventBuilder(header, body, filters);
    event_frame.events.event.push(event);

    sql_query = sql.eventPersonCredential.raiseEvent;
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
  else {
    sql_query = sql.intermediaryId.get;
    params = [credential_url];
    return connection["ces"].execute(sql_query, params)
      .then(function (results) {
        if (results.rows.length === 0) {
          sql_query = sql.intermediaryId.put;
          params = [
            credential_url,
            " ",    // actor
            " ",    // group_id
            created_by_id
          ];
          return connection["ces"].executeWithCommit(sql_query, params)
            .then(function () {
              sql_query = sql.intermediaryId.get;
              params = [credential_url];
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
          "credential_type",
          " ",
          "credential_id",
          " ",
          "user_name",
          " ",
          "lost_or_stolen",
          " ",
          "status",
          " ",
          "expiration_date",
          " ",
          "associated_device",
          " ",
          "physical_form",
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

        sql_query = sql.eventPersonCredential.raiseEvent;
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

function credentialDeletedEvents(connection) {
  var source_dt = moment()['tz']("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
  var event_type = "Credential Deleted";
  var event_type2 = "Credential Deleted v2";
  var domain = "edu.byu";
  var entity = "BYU-IAM";
  var filters = [];
  var credential_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id + "/credentials/" + credential_type + "," + credential_id;
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
      "credential_type",
      credential_type,
      "credential_id",
      credential_id
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
      student_status,
      "scoped_affiliation",
      scoped_affiliation
    ];
    event = eventBuilder.eventBuilder(header, body, filters);
    event_frame.events.event.push(event);

    var sql_query = sql.eventPersonCredential.raiseEvent;
    var params = [JSON.stringify(event_frame)];
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
  else {
    sql_query = sql.intermediaryId.get;
    params.push(credential_url);
    return connection["ces"].execute(sql_query, params)
      .then(function (results) {
        if (results.rows.length === 0) {
          sql_query = sql.intermediaryId.put;
          params = [
            credential_url,
            " ",    // actor
            " ",    // group_id
            created_by_id
          ];
          return connection["ces"].executeWithCommit(sql_query, params)
            .then(function () {
              sql_query = sql.intermediaryId.get;
              params = [credential_url];
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
          "credential_type",
          " ",
          "credential_id",
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

        sql_query = sql.eventPersonCredential.raiseEvent;
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