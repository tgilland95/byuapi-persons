"use strict";

var moment = require("moment-timezone");
var sql = require("./sql.js");
var core = require("../../core.js");
var bluebird = require("bluebird");
var ClientError = core.ClientError;


function inArray(needle, haystack) {
  for (var i = haystack.length; i--;) {
    if (haystack[i] === needle) {
      return true
    }
  }
  return false
}

exports.get = function (connection, resources, request, response) {
  //Declare variables
  var params = [];
  //identify DEF.JSON file to be filled
  var def = resources.sub_resource_definitions["employee_summaries"];
  var sql_query = sql.sql.getEmployeeSummaries;

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
        throw new ClientError(404, 'BYU_ID not found in person')
      }
      if (results.rows[0].restricted === 'Y' && !inArray('person_restricted', request.params.auth)) {
        throw new ClientError(404, 'BYU_ID not found in person')
      }
      delete def.metadata.default_db;
      if (inArray("person_view_basic", request.params.auth)) {
        def.metadata.validation_response.return_code = 200;
        //fill in the METADATA of the DEF.JSON
        def.metadata.collection_size = results.rows.length;
        //if the query was good but no records exist return an empty object
        if (!results.rows[0].job_title) {
          def.values.pop();
          return def
        }
        if (results.rows[0].hire_date) {
          results.rows[0].hire_date = moment["tz"](results.rows[0].hire_date, "YYYYMMDD", "America/Denver").format("YYYY-MM-DD")
        }
        //process the data and fill in the DEF.JSON values and descriptions
        def = core.sqlmap.map_row(results.rows[0], def, sql.sql.map);
        def.hire_date.value = moment(results.rows[0].hire_date)["format"]("YYYY-MM-DD");
        return def
      }
      else {
        if (results.rows[0]["primary_role"] === "Employee" ||
          results.rows[0]["primary_role"] === "Faculty") {
          //process the data and fill in the DEF.JSON values and descriptions
          def.values = processData(def.values[0], results.rows, sql.sql.map_public);
          if (results.rows.length === 0) {
            throw new ClientError(404, "BYU_ID not found in person table")
          }
          if (!results.rows[0].job_title) {
            def.values.pop();
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
  if (request.params.resource_id) {
    throw new ClientError(405, "Method not allowed: Please use employee resource")
  }
};
exports.delete = function (connection, resources, request, response) {
  if (request.params.resource_id) {
    throw new ClientError(405, "Method not allowed: Please use employee resource to remove employee information")
  }
};
