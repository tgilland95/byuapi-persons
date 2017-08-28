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

const auth              = require('../controllers/auth');
const personsController = require('../controllers/persons/persons');
const utils             = require('../controllers/utils');

exports.getPersons = function (req, res) {
  return auth.getPermissions(req)
    .then(function (permissions) {
      return personsController.getPersons(req.swagger.root.definitions, req.query, permissions)
        .then(function (address) {
          res.send(address);
        })
    })
    .catch(function (error) {
      utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
    });
};

exports.getPerson = function (req, res) {
  return auth.getPermissions(req)
    .then(function (permissions) {
      return personsController.getPerson(req.swagger.root.definitions, req.params.byu_id, req.query, permissions)
        .then(function (person) {
          res.send(person);
        })
    })
    .catch(function (error) {
      utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
    });
};

exports.modifyPerson = function (req, res) {
  return auth.getPermissions(req)
    .then(function (permissions) {
      return personsController.modifyPerson(req.swagger.root.definitions, req.params.byu_id, req.verifiedJWTs.prioritizedClaims.byuId, req.body, permissions)
        .then(function (person) {
          res.send(person);
        })
    })
    .catch(function (error) {
      utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
    });
};