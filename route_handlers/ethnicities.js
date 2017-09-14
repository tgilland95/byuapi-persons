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

const ethnicitiesController = require('../controllers/ethnicities/ethnicities');
const auth = require('../controllers/auth');
const utils = require('../controllers/utils');

exports.getEthnicity = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['ethnicities']);
    const ethnicity = await ethnicitiesController.getEthnicity(req.swagger.root.definitions,
      req.params.byu_id, req.params.ethnicity_code, permissions);

    res.send(ethnicity);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.getEthnicities = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['ethnicities']);
    const ethnicities = await ethnicitiesController.getEthnicities(req.swagger.root.definitions,
      req.params.byu_id, permissions);

    res.send(ethnicities);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.modifyEthnicity = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['ethnicities']);
    const ethnicity = await ethnicitiesController.modifyEthnicity(req.swagger.root.definitions,
      req.params.byu_id, req.params.ethnicity_code, req.body, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    res.send(ethnicity);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.deleteEthnicity = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['ethnicities']);
    const success = await ethnicitiesController.deleteEthnicity(req.swagger.root.definitions,
      req.params.byu_id, req.params.ethnicity_code, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    console.log(success);
    res.sendStatus(204);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};