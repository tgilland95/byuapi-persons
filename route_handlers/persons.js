/*
 * Copyright 2017 Brigham Young University
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
"use strict";
const basic_sql = require('./../controllers/basic/sql');
const func = require('./../shared_functions');
const moment = require("moment");

exports.getPerson = function (req, res) {

  var fs = [];
  if (req.params.field_sets === undefined) {
    //TODO: retrieve from the swagger defintion of 'default_field_sets'
    fs.push('basic')
  }
  else {
    fs = req.params.field_sets
  }

  // Get the resource owner
  var res_owner;
  if (req.params.resource_id === undefined) {
    res_owner = " "
  }
  else {
    res_owner = req.params.resource_id[0]
  }
  // Create array of all authorizations needed for each action being attempted
  var req_array = authRequests("GET", req.verifiedJWTs.authorized_byu_id, fs, res_owner, request);
  if ("ssn" in req.query) {
    req_array.push({
      subject: req.verifiedJWTs.authorized_byu_id,
      resource: "person_lookup_ssn",
      resource_owner: res_owner
    })
  }



  //Declare variables
  let params = [];
  //identify DEF.JSON file to be filled
  var def = resources.sub_resource_definitions.basic;
  var sql_query = basic_sql.sql.getPerson;

  //updates the URL to reflect the requested BYU_ID
  var links_map = {
    byu_id: req.params.byu_id
  };
  core.updateHATEOASData(def.links, links_map);

  params.push(req.params.byu_id);
  return func.executeSelect(sql_query, params)
    .then(function (results) {
      if (results.rows.length === 0) {
        throw new ClientError(404, 'BYU_ID not found in person')
      }
      if (results.rows[0].restricted === 'Y' && !inArray('person_restricted', req.params.auth)) {
        throw new ClientError(404, 'BYU_ID not found in person')
      }
      if (inArray("person_view_basic", req.params.auth)) {
        //fill in the METADATA of the DEF.JSON
        def.metadata.collection_size = results.rows.length;
        //process the data and fill in the DEF.JSON values and descriptions
        def = core.sqlmap.map_row(results.rows[0], def, sql.sql.map);
        def.metadata.validation_response.return_code = 200;
        def.date_time_updated.value = moment(results.rows[0].date_time_updated)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
        def.date_time_created.value = moment(results.rows[0].date_time_created)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
        //display the DEF.JSON filled out
        //def = basic.def
        return def
      }
      else {

        if (results.rows.length === 0) {
          throw new ClientError(404, "BYU_ID not found in person")
        }
        var primary_role = results.rows[0]["primary_role"];
        if (primary_role === "Student") {
          def = core.sqlmap.map_row(results.rows[0], def, sql.sql.public_map_student)
        }
        else if (primary_role === "Employee" ||
          primary_role === "Faculty") {
          def = core.sqlmap.map_row(results.rows[0], def, sql.sql.public_map_employee)
        }
        else {
          throw new ClientError(403, "User authorized to view PUBLIC DIRECTORY info only")
        }
        def.metadata.collection_size = results.rows.length;
        def.metadata.validation_response.return_code = 203;
        def.metadata.validation_response.response = "User authorized to view PUBLIC DIRECTORY info only";
        return def
      }
    });






  // console.log(req.params);
  // const params = {person_id: req.params.person_id};
  // let sql_q = sql.address.selectAddresses;
  // if (req.params.address_type) {
  //   params.address_type = req.params.address_type;
  //   sql_q = sql.address.selectAddress
  // }
  //
  // func.executeSelect(sql_q, params)
  //   .then(function (result) {
  //     if (result.hasOwnProperty("error")) {
  //       res.status(404).send(result);
  //     }
  //     else {
  //       if (req.params.address_type) {
  //         res.status(200).send(result[0]);
  //       }
  //       else {
  //         res.status(200).send({values: result});
  //       }
  //     }
  //   })
};

// exports.getAddresses = getAddress;

exports.modifyAddress = function (req, res) {
  console.log(req.params);
  if (req.params.person_id !== req.body.person_id || req.params.address_type !== req.body.address_type) {
    res.status(400).send({
      "return_code": 400,
      "error": "Params don't match body"
    });
    return;
  }
  const params = {
    person_id: req.params.person_id,
    address_type: req.params.address_type
  };
  let sql_q = sql.address.selectAddress;
  let insert;
  func.executeSelect(sql_q, params)
    .then(function (result) {

      if (result.hasOwnProperty("error") && result.error === "Not Found") {
        console.log("Create new record");
        sql_q = sql.address.insertAddress;
        insert = true;
      }
      else {
        console.log("Update current record");
        sql_q = sql.address.updateAddress;
        insert = false;
      }
      console.log("FINISH");

      if(req.body.date_time_updated === "") req.body.date_time_updated = null;
      if(req.body.date_time_updated !== null) req.body.date_time_updated = moment(req.body.date_time_updated)["format"]("YYYY-MM-DD HH:mm:ss.SSS");

      if(req.body.address_line_3 === "") req.body.address_line_3 = " ";
      if(req.body.address_line_4 === "") req.body.address_line_4 = " ";
      if(req.body.contact_status === "") req.body.contact_status = " ";



      console.log(req.body);

      func.executeUpdate(sql_q, req.body)
        .then(function (result) {
          console.log(result);
          if (result.hasOwnProperty("rowsAffected") && result.rowsAffected === 1) {
            if(insert) {
              res.status(200).send({
                person_id: req.body.person_id,
                message: "Insert successful on address_type: " + req.body.address_type
              });
            }
            else {
              res.status(200).send({
                person_id: req.body.person_id,
                message: "Update successful on address_type: " + req.body.address_type
              });
            }
          }
          else {
            res.status(400).send({
              "return_code": 400,
              "error": result
            });
          }
        })
        .catch(function (err) {
          console.log (err);
          res.status(500).send({
            "return_code": 500,
            "error": err
          });
        })
    })
};

exports.deleteAddress = function (req, res) {
  const params = {
    person_id: req.params.person_id,
    address_type: req.params.address_type
  };
  func.executeUpdate(sql.address.deleteAddress,params)
    .then(function (result) {
      console.log(result);
      if(result.hasOwnProperty("rowsAffected") && result.rowsAffected === 1) {
        res.status(204).send("address_type: " + req.params.address_type + " successfully deleted");
      }
      else {
        res.status(204).send("address_type: " + req.params.address_type + " does not exist");
      }
    })
    .catch(function (err) {
      console.log (err);
      res.status(500).send({
        "return_code": 500,
        "error": err
      });
    })
};