"use strict";

var moment = require("moment-timezone");
var sql = require("./sql.js");
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

//Performs the GET method
exports.get = function (connection, resources, request, response) {
  //Declare variables
  var params = [];
  //identify DEF.JSON file to be filled
  var def = resources.sub_resource_definitions["group_membership_events"];
  var sql_query = sql.sql.getGroupMembershipEvents;

  //updates the URL to reflect the requested BYU_ID
  var links_map = {
    byu_id: request.params.resource_id[0]
  };
  core.updateHATEOASData(def.links, links_map);

  //add BYU_ID from the RESOURCE_ID in the url
  params.push(request.params.resource_id[0]);
  //If there is a SUB_RESOURCE_ID perform the following:
  if (request.params.sub_resource_id) {
    if (isNaN(request.params.sub_resource_id[0])) {
      throw new ClientError(409, "event_id must be a number")
    }
    //grab the getGroupMembershipEvent SQL from SQL.JS
    sql_query = sql.sql.getGroupMembershipEvent;
    //add EVENT_ID to parameters for SQL query from SUB_RESOURCE_ID first array slot
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
      if (inArray("person_view_groups", request.params.auth)) {
        if (!results.rows[0].event_id && !request.params.sub_resource_id) {
          def.metadata.validation_response.return_code = 200;
          def.values.pop();
          return def
        }
        if (!results.rows[0].event_id && request.params.sub_resource_id) {
          throw new ClientError(404, request.params.sub_resource_id[0] + " group event not found")
        }
        //fill in the METADATA of the DEF.JSON
        def.metadata.collection_size = results.rows.length;
        //process the data and fill in the DEF.JSON values and descriptions
        def.values = core.sqlmap.map_rows(results.rows, def.values[0], sql.sql.map);
        //updated the HATEOAS links
        core.sqlmap.map_results(results.rows, def, sql.sql.map, function (item) {
          links_map.event_id = item.event_id.value;
          core.updateHATEOASData(item.links, links_map)
        });
        //display the DEF.JSON filled out
        def.metadata.validation_response.return_code = 200;
        for (var i = 0; i < def.values.length; i++) {
          def.values[i].date_time_granted["value"] = (results.rows[i].date_time_granted) ? moment(results.rows[i].date_time_granted)["format"]("YYYY-MM-DD HH:mm:ss.SSS") : "";
          def.values[i].effective_date["value"] = (results.rows[i].effective_date) ? moment(results.rows[i].effective_date)["format"]("YYYY-MM-DD") : "";
          def.values[i].expiration_date["value"] = (results.rows[i].expiration_date) ? moment(results.rows[i].expiration_date)["format"]("YYYY-MM-DD") : "";
          def.values[i].date_time_inactivated["value"] = (results.rows[i].date_time_inactivated) ? moment(results.rows[i].date_time_inactivated)["format"]("YYYY-MM-DD HH:mm:ss.SSS") : ""
        }
        return def
      }
      else {
        throw new ClientError(403, "User Not Authorized")
      }
    })
};

exports.put = function (connection, resources, request, response) {
  var promise, data = {};
  var params = request.params.resource_id;
  if (params !== null) {
    data = "Under Construction";//specific sub-resource PUT
    promise = bluebird.resolve(data);
    return promise.then(function () {
      return data
    })
  }
};
exports.delete = function (connection, resources, request, response) {
  var promise, data = {};
  var params = request.params.resource_id;
  if (request.params.sub_resource_id) {
    params.push(request.params.sub_resource_id[0]);
    params.push(request.params.sub_resource_id[1]);
    data = "Under Construction";//specific sub-resource DELETE
    promise = bluebird.resolve(data);
    return promise.then(function () {
      return data
    })
  }
};