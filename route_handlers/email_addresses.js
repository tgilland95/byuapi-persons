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

const emailAddressesController = require('../controllers/email_addresses/email_addresses');
const auth = require('../controllers/auth');
const utils = require('../controllers/utils');

exports.getEmailAddress = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['email_addresses']);
    const email_address = await emailAddressesController.getEmailAddress(req.swagger.root.definitions,
      req.params.byu_id, req.params.email_address_type, permissions);

    res.send(email_address);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.getEmailEmailAddresses = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['email_addresses']);
    const email_addresses = await emailAddressesController.getEmailEmailAddresses(req.swagger.root.definitions,
      req.params.byu_id, permissions);

    res.send(email_addresses);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.modifyEmailAddress = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['email_addresses']);
    const email_address = await emailAddressesController.modifyEmailAddress(req.swagger.root.definitions,
      req.params.byu_id, req.params.email_address_type, req.body, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    res.send(email_address);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.deleteEmailAddress = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['email_addresses']);
    const success = await emailAddressesController.deleteEmailAddress(req.swagger.root.definitions,
      req.params.byu_id, req.params.email_address_type, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    console.log(success);
    res.sendStatus(204);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};