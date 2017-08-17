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
const auth        = require('../controllers/auth');
const personsController = require('../controllers/persons');

exports.getPersons = function (req, res) {
  auth.getPermissions(req)
    .then(function (permissions) {
      console.log("permissions: ", permissions);
      return personsController.getPersons(req.swagger.root.definitions, req.params.byu_id, permissions)
        .then(function (address) {
          res.send(address);
        })
    });

};

exports.getPerson = function (req, res) {
  auth.getPermissions(req)
    .then(function (permissions) {
      console.log("permissions: ", permissions);
      return personsController.getPerson(req.swagger.root.definitions, req.params.byu_id, req.query, permissions)
        .then(function (person) {
          res.send(person);
        })
    });

};
