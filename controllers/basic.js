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
const sql = require('./../sql');
const func = require('./sql/shared_functions');
const moment = require("moment");

exports.getPerson = function (req, res) {
  console.log(req.params);
  const params = {person_id: req.params.person_id};
  let sql_q = sql.address.selectAddresses;
  if (req.params.address_type) {
    params.address_type = req.params.address_type;
    sql_q = sql.address.selectAddress
  }

  func.executeSelect(sql_q, params)
    .then(function (result) {
      if (result.hasOwnProperty("error")) {
        res.status(404).send(result);
      }
      else {
        if (req.params.address_type) {
          res.status(200).send(result[0]);
        }
        else {
          res.status(200).send({values: result});
        }
      }
    })
};
