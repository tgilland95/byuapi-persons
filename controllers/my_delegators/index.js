"use strict";

var moment = require("moment-timezone");
var sql = require("./sql.js");
// var eventBuilder = require("./../event.js");
var core = require("../../core.js");
var bluebird = require("bluebird");
var ClientError = core.ClientError;


//This is a function used to find the authorizations allowed, but is generic.
function inArray(needle, haystack) {
  for (var i = haystack.length; i--;) {
    if (haystack[i] === needle) {
      return true
    }
  }
  return false
}

function validateAccessDelegationId(access_delegation_id) {
  //Error returned for incorrect ACCESS DELEGATION ID
  if (isNaN(access_delegation_id)) {
    throw new ClientError(409, "Incorrect URL: ACCESS DELEGATION ID should be a number")
  }
}

exports.get = function (connection, resources, request, response) {
  //Declare variables
  var params = [];
  //identify DEF.JSON file to be filled
  var def = resources.sub_resource_definitions["my_delegators"];
  var sql_query = sql.sql.getMyDelegators;

  //updates the URL to reflect the requested BYU_ID
  var links_map = {
    byu_id: request.params.resource_id[0]
  };
  core.updateHATEOASData(def.links, links_map);

  //add BYU_ID from the RESOURCE_ID in the url
  params.push(request.params.resource_id[0]);
  //If there is a SUB_RESOURCE_ID perform the following:
  if (request.params.sub_resource_id) {
    validateAccessDelegationId(request.params.sub_resource_id[0]);
    //grab the getMyDelegator SQL from SQL.JS
    sql_query = sql.sql.getMyDelegator;
    //add ACCESS_DELEGATION_ID to parameters for SQL query from SUB_RESOURCE_ID first array slot
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
      //checks the restricted status of related persons and removes them if user is not authorized to see them
      if (!inArray('person_restricted_other', request.params.auth)) {
        var length = results.rows.length;
        for (var i = 0; i < length; i++) {
          if (results.rows[i]["delegator_restricted"] === 'Y') {
            if (results.rows.length === 1) {
              results.rows[i].delegator_id = null
            }
            else {
              results.rows.splice(i, 1);
              i--
            }
          }
        }
      }
      delete def.metadata.default_db;
      if (inArray("person_update_delegations", request.params.auth)) {
        if (!results.rows[0].access_delegation_id && !request.params.sub_resource_id) {
          def.metadata.validation_response.return_code = 200;
          def.values.pop();
          return def
        }
        if (!results.rows[0].access_delegation_id && request.params.sub_resource_id) {
          throw new ClientError(404, request.params.sub_resource_id[0] + " access_delegation_id not associated with this BYU_ID")
        }
        //fill in the METADATA of the DEF.JSON
        def.metadata.collection_size = results.rows.length;
        //process the data and fill in the DEF.JSON values and descriptions
        def.values = core.sqlmap.map_rows(results.rows, def.values[0], sql.sql.map);
        //updated the HATEOAS links
        core.sqlmap.map_results(results.rows, def, sql.sql.map, function (item) {
          links_map.access_delegation_id = item.access_delegation_id.value;
          core.updateHATEOASData(item.links, links_map)
        });
        //display the DEF.JSON filled out
        def.metadata.validation_response.return_code = 200;
        length = def.values.length;
        for (i = 0; i < length; i++) {
          def.values[i].date_time_updated["value"] = moment(results.rows[i].date_time_updated)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
          def.values[i].date_time_created["value"] = moment(results.rows[i].date_time_created)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
          def.values[i].date_time_accepted["value"] = (results.rows[i].date_time_accepted) ? moment(results.rows[i].date_time_accepted)["format"]("YYYY-MM-DD HH:mm:ss.SSS") : "";
          def.values[i].date_time_revoked["value"] = (results.rows[i].date_time_revoked) ? moment(results.rows[i].date_time_revoked)["format"]("YYYY-MM-DD HH:mm:ss.SSS") : "";
          def.values[i].expiration_date["value"] = (results.rows[i].expiration_date) ? moment(results.rows[i].expiration_date)["format"]("YYYY-MM-DD") : ""
        }

        params = [results.rows[0].access_delegation_id];
        sql_query = sql.getDelegatedOperationsPerformed.sql;
        return connection["ces"].execute(sql_query, params)
          .then(function (results) {
            if (!results.rows[0].operation_performed_id && !request.params.sub_resource_id) {
              console.log("NOT THE MAMA!", def);
              def.values[0].operations_performed.pop()
            }
            else {
              console.log("THE MAMA!", def);
              def.values[0].operations_performed = core.sqlmap.map_rows(results.rows, def.values[0].operations_performed[0], sql.getDelegatedOperationsPerformed.map)
            }
            return def
          })
      }
      else {
        throw new ClientError(403, "User Not Authorized")
      }
    })
};

exports.put = function (connection, resources, request, response) {
  var req_body = request.body;
  var byu_id = request.params.resource_id[0];
  var access_delegation_id = request.params.sub_resource_id[0];
  var delegator_id = req_body.delegator_id;
  var access_type = req_body.access_type;
  var categories = req_body.categories;
  var action = req_body.action;
  // var current_date_time = moment();
  var updated_by_id = req_body.updated_by_id;
  if (!updated_by_id || (updated_by_id === " ")) {
    updated_by_id = request.verifiedJWTs.authorized_byu_id
  }
  // var date_time_updated = req_body.date_time_updated;
  // if (!date_time_updated || (date_time_updated === " ")) {
  //     date_time_updated = current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS")
  // }
  // else {
  //     date_time_updated = moment["tz"](date_time_updated, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS")
  // }
  var revoked_by_id = updated_by_id;
  // var change_type;

  validateAccessDelegationId(access_delegation_id);
  //check the body for missing required elements
  var delegation_elements = [
    "delegator_id",
    "access_type",
    "categories",
    "action"
  ];
  var error = false;
  var msg = "Incorrect BODY: Missing ";
  delegation_elements.forEach(function (item) {
    if (req_body[item] === undefined) {
      msg += "\n\"" + item + "\": \" \",";
      error = true
    }
    else if (req_body[item] === "") {
      req_body[item] = " "
    }
  });
  if (error) {
    throw new ClientError(409, msg)
  }

  if (delegator_id.search(/^[0-9]{9}$/) === -1) {
    throw new ClientError(409, "Invalid Body: Delegator ID must be a 9 digit number string")
  }
  switch (access_type) {
    case "B":
    case "L":
    case "W":
      break;
    default:
      throw new ClientError(409, "Invalid Body: access_type should be set to 'B', 'L', or 'W'")
  }

  if (categories.split(", ").length !== categories.match(/^Academic|Financial|Personal|YMessage$/g).length) {
    throw new ClientError(409, "Invalid Body: categories are Academic, Financial, Personal, and YMessage if more than one is used they must be in alphabetical order.")
  }

  switch (action) {
    case "accept":
    case "revoke":
      break;
    default:
      throw new ClientError(409, "Invalid Body: action must be 'accept' or 'revoke'")
  }

  if (!inArray("person_update_delegations", request.params.auth)) {
    throw new ClientError(403, "User not authorized to update DELEGATION info")
  }
  return (function () {
    //build SQL query to check if BYU_ID has delegators
    var params = [];
    var sql_query = sql.sql.getMyDelegator;
    //check BYU_ID against IAM Person Table
    params.push(byu_id);
    params.push(access_delegation_id);
    return connection["ces"].execute(sql_query, params)
      .then(function (results) {
        if (results.rows.length === 0) {
          throw new ClientError(404, "Access Delegation ID not found, to add a delegation use my_guests POST")
        }
        else {
          if (results.rows[0].date_time_revoked) {
            throw new ClientError(403, "This delegation has been revoked, so it cannot be modified")
          }
          if (access_type !== results.rows[0].access_type) {
            throw new ClientError(403, "User not authorized to update access_type")
          }
          if (byu_id !== results.rows[0].byu_id) {
            throw new ClientError(403, "User not authorized to update byu_id")
          }
          if (categories !== results.rows[0].categories) {
            throw new ClientError(403, "User not authorized to update categories")
          }
          if (delegator_id !== results.rows[0].delegator_id) {
            throw new ClientError(403, "User not authorized to update delegator_id")
          }

          if (request.body.action !== " ") {
            params = [];//clears previous
            if (request.body.action === "accept") {
              sql_query = sql.modifyDelegation.update_accept;
              //rebuild params for new query
              params.push(delegator_id);
              params.push(access_type);
              params.push(categories);
              params.push(updated_by_id);
              params.push(byu_id);
              params.push(access_delegation_id)
            }
            if (request.body.action === "revoke") {
              sql_query = sql.modifyDelegation.update_revoke;
              //rebuild params for new query
              params.push(delegator_id);
              params.push(access_type);
              params.push(categories);
              params.push(revoked_by_id);
              params.push(updated_by_id);
              params.push(byu_id);
              params.push(access_delegation_id)
            }
            return connection["ces"].executeWithCommit(sql_query, params)
              .then(function () {
                return delegationEvents(connection)
              })
          }
        }
      })
      .then(function () {
        return exports.get(connection, resources, request, response)
      })
  })()
};
exports.delete = function () {
  throw new ClientError(405, "Method not supported. Revoke to remove delegation")
};