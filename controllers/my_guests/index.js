"use strict";

var sql = require("./sql.js");
var core = require("../../core.js");
var bluebird = require("bluebird");
var events = require("events");
var moment = require('moment-timezone');
var eventEmitter = new events.EventEmitter();
var ClientError = core.ClientError;

exports.get = function (connection, resources, request, response) {
  var def = resources.sub_resource_definitions.my_guests;
  var sql_query;
  var params = request.params.resource_id;

  if (request.params.sub_resource_id) {
    //Error returned for missing or extra sub_resource_id(s)
    if (request.params.sub_resource_id.length !== 1) {
      throw new ClientError(409, "Incorrect URL: Missing or extra sub resource in URL use ACCESS DELEGATION ID");
    }
    //Error returned for incorrect ACCESS DELEGATION ID
    if (isNaN(request.params.sub_resource_id[0])) {
      throw new ClientError(409, "Incorrect URL: ACCESS DELEGATION ID should be a number");
    }
    sql_query = sql.getMyGuest.sql;
    params.push(request.params.sub_resource_id[0]);
  }
  else if (request.params.resource_id) {
    sql_query = sql.getMyGuests.sql;
  }

  return connection.ces.execute(sql_query, params)
    .then(function (results) {
      console.log(results);
      if (results.rows.length === 0) {
        throw new ClientError(404, 'BYU_ID not found in person')
      }
      if (results.rows[0].restricted === 'Y' && !inArray('person_restricted', request.params.auth)) {
        console.log("RESTRICTED");
        throw new ClientError(404, 'BYU_ID not found in person')
      }
      //checks the restricted status of related persons and removes them if user is not authorized to see them
      if (!inArray('person_restricted_other', request.params.auth)) {
        for (var i = 0; i < results.rows.length; i++) {
          console.log("CHECKING ROW: ", i);
          if (results.rows[i].guest_restricted === 'Y') {
            console.log("RESTRICTED");
            if (results.rows.length === 1) {
              console.log("ONLY ROW");
              results.rows[i].guest_id = null;
            }
            else {
              console.log("DELETING ROW");
              results.rows.splice(i, 1);
              i--;
            }
          }
        }
      }
      if (inArray("person_view_guests", request.params.auth)) {
        def.metadata.collection_size = results.rows.length;
        if (!results.rows[0].guest_id) {
          return;
        }
        return processData(connection, def.values[0], results)//calling processData function with values from def.json and sql results
          .then(function (results) { //when processData finishes returns results in the def variable
            def.values = results;
            def.metadata.validation_response.return_code = 200;
            console.log("VALUES: ", def.values);
            var length = def.values.length;
            for (i = 0; i < length; i++) {
              def.values[i].date_time_updated["value"] = moment(results.rows[i].date_time_updated)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
              def.values[i].date_time_created["value"] = moment(results.rows[i].date_time_created)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
              def.values[i].date_time_accepted["value"] = (results.rows[i].date_time_accepted) ? moment(results.rows[i].date_time_accepted)["format"]("YYYY-MM-DD HH:mm:ss.SSS") : "";
              def.values[i].date_time_revoked["value"] = (results.rows[i].date_time_revoked) ? moment(results.rows[i].date_time_revoked)["format"]("YYYY-MM-DD HH:mm:ss.SSS") : "";
              def.values[i].expiration_date["value"] = (results.rows[i].expiration_date) ? moment(results.rows[i].expiration_date)["format"]("YYYY-MM-DD") : ""
            }
            return def;
          });
      }
      else {
        console.log("NOT AUTHORIZED");
        throw new ClientError(403, "User Not Authorized");
      }
    });
};

function processData(connection, def, results) { //def is the values portion of def.json
  var promises = [];
  var data, values = [];

  results.rows.forEach(function (row) { //results from sql passed into function as row.
    data = core.sqlmap.map_row(row, def, sql.getMyGuests.map); //passing a built in function the parameters: row, def and sql.map
    values.push(data); //pushing data from the sql.map call into the values array.

    // get the ethnicities
    (function (row) { //calls data "row" and passes it to the function
      var promise;
      var params = [];
      var values2 = [];
      var sql_query1 = sql.getDelegatedOperationsPerformed.sql; //second sql call
      var def2 = def.operations_performed[0];

      params[0] = row.access_delegation_id.value;
      promise = connection.ces.execute(sql_query1, params);
      promise.then(function (results) {
        values2 = core.sqlmap.map_rows(results.rows, def2, sql.getDelegatedOperationsPerformed.map);
        row.operations_performed = values2;
      });
      promises.push(promise);
    })(data);
  });
  return bluebird.settle(promises)
    .then(function () {
      return values;
    });
}

//Used in PUT
//function to check if a record already exists or if it matches
function checkIfExists(connection, sql_query, params) {
  return connection.ces.execute(sql_query, params)
    .then(function (results) {
      //if the count is greater than 0 return true else false
      return (results.rows[0].count > 0);
    });
}

function inArray(needle, haystack) {
  var length = haystack.length;
  for (var i = length; i--;) {
    if (haystack[i] === needle) {
      return true;
    }
  }
  return false;
}

function expiration_date_validation(exp_date) {
  console.log("EXPDATE", exp_date.format());
  var cur_date = moment();
  var cur_date_mt = cur_date.clone().tz("America/Denver");

  cur_date_mt.millisecond(0);
  cur_date_mt.second(0);
  cur_date_mt.minute(0);
  cur_date_mt.hour(0);
  console.log("MIN_EXP", cur_date_mt.format());

  return (cur_date_mt.isSame(exp_date) || cur_date_mt.isBefore(exp_date));
}

exports.post = function (connection, resources, request, response) {
  if (request.params.sub_resource_id) {
    throw new ClientError(405, "Method Not Allowed: No sub resource id needed");
  }

  var exp_date = moment.tz(request.body.expiration_date, "America/Denver");
  exp_date.millisecond(0);
  exp_date.second(0);
  exp_date.minute(0);
  exp_date.hour(0);

  var db_exp_date = results.rows[0].expiration_date;

  var exp_date_temp;
  if (request.body.expiration_date !== "") {
    exp_date_temp = new Date(request.body.expiration_date);
  }
  else {
    exp_date_temp = "";
  }
  if (db_exp_date === null) {
    db_exp_date = "";
  }

  var valid_date;
  if ((exp_date_temp !== "") && (db_exp_date === "")) {
    valid_date = expiration_date_validation(exp_date);
    console.log("EXP DATE RETURN VALUE: ", valid_date);
    if (!valid_date) {
      throw new ClientError(409, "expiration_date should be today minimum (Mountain Time). Expires at midnight the night of");
    }
  }
  // Checking for valid dates in old and new
  if ((exp_date_temp !== "") && (db_exp_date !== "")) {
    // If not null, compare dates to see if update is being made
    if (exp_date_temp.getTime() !== db_exp_date.getTime()) {
      valid_date = expiration_date_validation(exp_date);
      console.log("EXP DATE RETURN VALUE: ", valid_date);
      if (!valid_date) {
        throw new ClientError(409, "expiration_date should be today minimum (Mountain Time). Expires at midnight the night of");
      }
    }
  }

  exp_date.millisecond(999);
  exp_date.second(59);
  exp_date.minute(59);
  exp_date.hour(23);
  var ed = exp_date.format('YYYY-MM-DD HH:mm:ss.SSS');

  if (!inArray("person_update_guests", request.params.auth)) {
    throw new ClientError(403, "User not authorized to update DELEGATION info");
  }

  //check if delegation already exists
  var params = [];
  var sql_query = sql.getMyGuest.sql;
  params.push(request.body.byu_id);
  params.push(request.body.access_delegation_id);
  return connection.ces.execute(sql_query, params)
    .then(function (results) {
      if (results.rows.length === 0) {

        params = [];
        params.push(request.body.byu_id);
        params.push(request.body.guest_id);
        params.push(request.body.access_type);
        params.push(request.body.categories);
        params.push(ed);
        params.push(request.verifiedJWTs.authorized_byu_id);
        params.push(request.verifiedJWTs.authorized_byu_id);
        sql_query = sql.modifyGuest.create;
        return connection.ces.executeWithCommit(sql_query, params);
      }
    });
};

exports.put = function (connection, resources, request, response) {


  //Error returned for missing or extra sub_resource_id(s)
  if (request.params.sub_resource_id.length !== 1) {
    throw new ClientError(409, "Incorrect URL: Missing or extra sub resource in URL use ACCESS DELEGATION ID");
  }
  //Error returned for incorrect ACCESS DELEGATION ID
  if (isNaN(request.params.sub_resource_id[0])) {
    throw new ClientError(409, "Incorrect URL: ACCESS DELEGATION ID should be a number");
  }
  console.log(typeof request.params.sub_resource_id[0] + ":" + typeof String(request.body.access_delegation_id));
  console.log(request.params.sub_resource_id[0] + ":" + String(request.body.access_delegation_id));
  console.log(request.body);

  if (request.params.sub_resource_id[0] !== String(request.body.access_delegation_id)) {
    throw new ClientError(409, "Request access_delegation_id does not match the body access_delegation_id");
  }
  if (!inArray("person_update_guests", request.params.auth)) {
    throw new ClientError(403, "User not authorized to update DELEGATION info");
  }

  //check if delegation already exists
  var params = [];
  var sql_query = sql.getMyGuest.sql;
  params.push(request.body.byu_id);
  params.push(request.body.access_delegation_id);
  return connection.ces.execute(sql_query, params)
    .then(function (results) {
      if (results.rows.length === 0) {
        throw new ClientError(405, "Method not allowed. Use POST to create delegation");
      }
      else {
        var exp_date = moment.tz(request.body.expiration_date, "America/Denver");
        exp_date.millisecond(0);
        exp_date.second(0);
        exp_date.minute(0);
        exp_date.hour(0);

        var db_exp_date = results.rows[0].expiration_date;

        var exp_date_temp;
        if (request.body.expiration_date !== "") {
          exp_date_temp = new Date(request.body.expiration_date);
        }
        else {
          exp_date_temp = "";
        }
        if (db_exp_date === null) {
          db_exp_date = "";
        }

        var valid_date;
        if ((exp_date_temp !== "") && (db_exp_date === "")) {
          valid_date = expiration_date_validation(exp_date);
          console.log("EXP DATE RETURN VALUE: ", valid_date);
          if (!valid_date) {
            throw new ClientError(409, "expiration_date should be today minimum (Mountain Time). Expires at midnight the night of");
          }
        }
        // Checking for valid dates in old and new
        if ((exp_date_temp !== "") && (db_exp_date !== "")) {
          // If not null, compare dates to see if update is being made
          if (exp_date_temp.getTime() !== db_exp_date.getTime()) {
            valid_date = expiration_date_validation(exp_date);
            console.log("EXP DATE RETURN VALUE: ", valid_date);
            if (!valid_date) {
              throw new ClientError(409, "expiration_date should be today minimum (Mountain Time). Expires at midnight the night of");
            }
          }
        }

        exp_date.millisecond(999);
        exp_date.second(59);
        exp_date.minute(59);
        exp_date.hour(23);
        var ed = exp_date.format('YYYY-MM-DD HH:mm:ss:SSS');

        if (request.body.guest_id !== results.rows[0].guest_id) {
          throw new ClientError(409, "Cannot change guest_id. Use POST to create new delegation");
        }

        if (request.body.action === "revoke") {
          console.log("REVOKING");
          params = [];
          params.push(request.body.guest_id);
          params.push(request.body.access_type);
          params.push(request.body.categories);
          params.push(request.verifiedJWTs.authorized_byu_id);
          params.push(ed);
          params.push(request.verifiedJWTs.authorized_byu_id);
          params.push(request.verifiedJWTs.authorized_byu_id);
          params.push(request.body.access_delegation_id);
          sql_query = sql.modifyMyGuest.revoke;
          return connection.ces.executeWithCommit(sql_query, params);
        }
        else {
          console.log(ed);
          params = [];
          params.push(request.body.guest_id);
          params.push(request.body.access_type);
          params.push(request.body.categories);
          params.push(ed);
          params.push(request.verifiedJWTs.authorized_byu_id);
          params.push(request.body.byu_id);
          params.push(request.body.access_delegation_id);
          sql_query = sql.modifyMyGuest.update;
          return connection.ces.executeWithCommit(sql_query, params);
        }
      }
    })
    .then(function () {
      return exports.get(connection, resources, request, response);
    });
};
exports.delete = function () {
  throw new ClientError(405, "Method not supported. Revoke to remove delegation");
};