"use strict";

var sql = require("./sql.js");
var core = require("../../core.js");
var bluebird = require("bluebird");
var ClientError = core.ClientError;

var config = {};
config.wellknown = process.env["WELL_KNOWN"];


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
  var def = resources.sub_resource_definitions["group_memberships"];
  var sql_query = sql.sql.getGroupMemberships;

  //updates the URL to reflect the requested BYU_ID
  var links_map = {
    byu_id: request.params.resource_id[0]
  };
  core.updateHATEOASData(def.links, links_map);

  //add BYU_ID from the RESOURCE_ID in the url
  params.push(request.params.resource_id[0]);

  if ("group_id" in request.query) {
    var group_id_array = request.query.group_id.split(",");
    sql_query = sql.sql.queryGroupMemberships;

    var length = group_id_array.length;
    //since order matters the loop iterates forward
    for (var i = 0; i < length; i++) {
      params.push(group_id_array[i]);
      if (i === length - 1) {
        sql_query += ":" + (i + 2) + ")"
      }
      else {
        sql_query += ":" + (i + 2) + ","
      }
    }
  }
  //If there is a SUB_RESOURCE_ID perform the following:
  else if (request.params.sub_resource_id) {
    //grab the getGroupMembership SQL from SQL.JS
    sql_query = sql.sql.getGroupMembership;
    //add GROUP_ID to parameters fro SQL query from SUB_RESOURCE_ID first array slot
    params.unshift(request.params.sub_resource_id[0])
  }
  // var data = resources.resource_definition;

  // var custom = {}
  //parseFieldsetQueryParameters(request.query, request.params.fieldset, custom)
  //execute the SQL_QUERY selected based off of IF statements using PARAMS array values
  return connection["ces"].execute(sql_query, params)
    .then(function (person_groups) {
      if (!person_groups.rows.length) {
        throw new ClientError(404, "BYU_ID not found in person table")
      }
      if (person_groups.rows[0].restricted === 'Y' && !inArray('person_restricted', request.params.auth)) {
        throw new ClientError(404, 'BYU_ID not found in person')
      }
      delete def.metadata.default_db;
      if (inArray("person_view_groups", request.params.auth)) {
        if (!person_groups.rows[0].group_id && !request.params.sub_resource_id) {
          def.metadata.validation_response.return_code = 200;
          def.metadata.collection_size = 0;
          def.values.pop();
          return def
        }
        if (!person_groups.rows[0].group_id && request.params.sub_resource_id) {
          throw new ClientError(404, request.params.sub_resource_id[0] + " group_id not found")
        }
        //fill in the METADATA of the DEF.JSON
        def.metadata.collection_size = person_groups.rows.length;
        //process the data and fill in the DEF.JSON values and descriptions
        def.values = core.sqlmap.map_rows(person_groups.rows, def.values[0], sql.sql.map);
        //updated the HATEOAS links
        core.sqlmap.map_results(person_groups.rows, def, sql.sql.map, function (item) {
          links_map.group_id = item.group_id.value;
          core.updateHATEOASData(item.links, links_map)
        });
        //display the DEF.JSON filled out
        def.metadata.validation_response.return_code = 200;
        return def
      }
      else {
        return connection["ces"].execute(""
          + "select group_id as \"group_id\" "
          + "from   gro.group_administrator "
          + "where  byu_id = :BYU_ID"
          + " or person_id = :PERSON_ID",
          [request.verifiedJWTs.authorized_byu_id,
            request.verifiedJWTs.authorized_person_id])
          .then(function (authorized_groups) {
              if (!authorized_groups.rows.length) {
                throw new ClientError(403, "User is not an administrator of any groups");
              }
              var results_to_return = [];
            authorized_groups.rows.forEach(function (authorized_group) {
                person_groups.rows.forEach(function (person_group) {
                  if (person_group.group_id === authorized_group.group_id) {
                    results_to_return.push(person_group);
                  }
                })
              });

              console.log("NEW RESTULS", results_to_return);
              //updated the HATEOAS links
              core.sqlmap.map_results(results_to_return, def, sql.sql.map, function (item) {
                links_map.group_id = item.group_id.value;
                core.updateHATEOASData(item.links, links_map)
              });

              def.values = core.sqlmap.map_rows(results_to_return, def.values[0], sql.sql.map);
              def.metadata.validation_response.return_code = 203;
              for (i = 0; i < def.values.length; i++) {
                def.values[i].metadata.validation_response.return_code = 200
              }
              def.metadata.validation_response.response = "User only authorized to see members of administrated groups";
              return def;
            }
          )
      }
    })
};

exports.put = function (connection, resources, request, response) {
  var promise, data = {};
  if (request.params.sub_resource_id) {
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
