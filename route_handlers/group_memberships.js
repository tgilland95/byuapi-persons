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

const groupMembershipsController = require('../controllers/group_memberships/group_memberships');
const auth = require('../controllers/auth');
const utils = require('../controllers/utils');

exports.getGroupMembership = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['group_memberships']);
    const group_membership = await groupMembershipsController.getGroupMembership(req.swagger.root.definitions,
      req.params.byu_id, req.params.group_id, permissions);

    res.send(group_membership);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.getGroupMemberships = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['group_memberships']);
    const group_memberships = await groupMembershipsController.getGroupMemberships(req.swagger.root.definitions,
      req.params.byu_id, permissions);

    res.send(group_memberships);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.modifyGroupMembership = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['group_memberships']);
    const group_membership = await groupMembershipsController.modifyGroupMembership(req.swagger.root.definitions,
      req.params.byu_id, req.params.group_id, req.body, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    res.send(group_membership);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.deleteGroupMembership = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['group_memberships']);
    const success = await groupMembershipsController.deleteGroupMembership(req.swagger.root.definitions,
      req.params.byu_id, req.params.group_id, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    console.log(success);
    res.sendStatus(204);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};