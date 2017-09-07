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

const credentialsController = require('../controllers/credentials/credentials');
const auth = require('../controllers/auth');
const utils = require('../controllers/utils');

exports.getCredential = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req);
    const credential = await credentialsController.getCredential(req.swagger.root.definitions,
      req.params.byu_id, req.params.credential_type, req.params.credential_id, permissions);

    res.send(credential);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.getCredentials = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req);
    const credentials = await credentialsController.getCredentials(req.swagger.root.definitions,
      req.params.byu_id, permissions);

    res.send(credentials);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.modifyCredential = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req);
    const credential = await credentialsController.modifyCredential(req.swagger.root.definitions,
      req.params.byu_id, req.params.credential_type, req.params.credential_id, req.body, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    res.send(credential);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.deleteCredential = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req);
    const success = await credentialsController.deleteCredential(req.swagger.root.definitions,
      req.params.byu_id, req.params.credential_type, req.params.credential_id, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    console.log(success);
    res.sendStatus(204);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};