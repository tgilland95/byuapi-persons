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

const addressesController = require('../controllers/addresses/addresses');
const auth = require('../controllers/auth');
const utils = require('../controllers/utils');

exports.getDelegatedOperationPerformed = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['addresses']);
    const address = await addressesController.getAddress(req.swagger.root.definitions,
      req.params.byu_id, req.params.address_type, permissions);

    res.send(address);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.getDelegatedOperationsPerformed = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['addresses']);
    const addresses = await addressesController.getAddresses(req.swagger.root.definitions,
      req.params.byu_id, permissions);

    res.send(addresses);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.modifyAddress = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['addresses']);
    const address = await addressesController.modifyAddress(req.swagger.root.definitions,
      req.params.byu_id, req.params.address_type, req.body, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    res.send(address);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['addresses']);
    const success = await addressesController.deleteAddress(req.swagger.root.definitions,
      req.params.byu_id, req.params.address_type, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    console.log(success);
    res.sendStatus(204);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};