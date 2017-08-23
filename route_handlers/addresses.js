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
const addressesController = require('../controllers/addresses/addresses');
const auth                = require('../controllers/auth');
const Enforcer            = require('swagger-enforcer');

exports.getAddress = function (req, res) {
  auth.getPermissions(req)
    .then(function (permissions) {
      // console.log("permissions: ", permissions);
      return addressesController.getAddress(req.swagger.root.definitions, req.params.byu_id, req.params.address_type, permissions)
        .then(function (address) {
          res.send(address);
        })
    })
    .catch(function (error) {
      res.send(error);
    })
  ;
};

exports.getAddresses = function (req, res) {
  auth.getPermissions(req)
    .then(function (permissions) {
      // console.log("permissions: ", permissions);
      return addressesController.getAddresses(req.swagger.root.definitions, req.params.byu_id, permissions)
        .then(function (addresses) {
          res.send(addresses);
        })
    })
    .catch(function (error) {
      res.status(error.status).send({ return_code: 404, explanation: "", error: error.message});
    })
  ;
};

exports.modifyAddress = function (req, res) {
  auth.getPermissions(req)
    .then(function (permissions) {
      return addressesController.modifyAddress(req.swagger.root.definitions, req.params.byu_id, req.params.address_type, req.body, req.verifiedJWTs.prioritizedClaims.byuId, permissions)
        .then(function (address) {
          res.send(address);
        })
    })
    .catch(function (error) {
      res.send(error);
    })
};

exports.deleteAddress = function (req, res) {
  auth.getPermissions(req)
    .then(function (permissions) {
      return addressesController.deleteAddress(req.swagger.root.definitions, req.params.byu_id, req.params.address_type, req.verifiedJWTs.prioritizedClaims.byuId, permissions)
        .then(function (success) {
          res.sendStatus(204);
        })
    })
    .catch(function (error) {
      res.send(error);
    })
};