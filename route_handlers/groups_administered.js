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

const groupsAdministeredController = require('../controllers/groups_administered/groups_administered');
const auth = require('../controllers/auth');
const utils = require('../controllers/utils');

exports.getGroupAdministered = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['groups_administered']);
    const group_administered = await groupsAdministeredController.getGroupAdministered(req.swagger.root.definitions,
      req.params.byu_id, req.params.group_id, permissions);

    res.send(group_administered);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.getGroupsAdministered = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['groups_administered']);
    const groups_administered = await groupsAdministeredController.getGroupsAdministered(req.swagger.root.definitions,
      req.params.byu_id, permissions);

    res.send(groups_administered);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.modifyGroupAdministered = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['groups_administered']);
    const group_administered = await groupsAdministeredController.modifyGroupAdministered(req.swagger.root.definitions,
      req.params.byu_id, req.params.group_id, req.body, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    res.send(group_administered);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.deleteGroupAdministered = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['groups_administered']);
    const success = await groupsAdministeredController.deleteGroupAdministered(req.swagger.root.definitions,
      req.params.byu_id, req.params.group_id, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    console.log(success);
    res.sendStatus(204);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};