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

const groupMembershipEventsController = require('../controllers/group_membership_events/group_membership_events');
const auth = require('../controllers/auth');
const utils = require('../controllers/utils');

exports.getGroupMembershipEvent = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['group_membership_events']);
    const group_membership_event = await groupMembershipEventsController.getGroupMembershipEvent(req.swagger.root.definitions,
      req.params.byu_id, req.params.event_id, permissions);

    res.send(group_membership_event);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.getGroupMembershipEvents = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['group_membership_events']);
    const group_membership_events = await groupMembershipEventsController.getGroupMembershipEvents(req.swagger.root.definitions,
      req.params.byu_id, permissions);

    res.send(group_membership_events);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

//Post is required because event_id is not known beforehand if creating
exports.createGroupMembershipEvent = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['group_membership_events']);
    const group_membership_event = await groupMembershipEventsController.createGroupMembershipEvent(req.swagger.root.definitions,
      req.params.byu_id, req.body, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    res.send(group_membership_event);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.modifyGroupMembershipEvent = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['group_membership_events']);
    const group_membership_event = await groupMembershipEventsController.modifyGroupMembershipEvent(req.swagger.root.definitions,
      req.params.byu_id, req.params.event_id, req.body, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    res.send(group_membership_event);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.deleteGroupMembershipEvent = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['group_membership_events']);
    const success = await groupMembershipEventsController.deleteGroupMembershipEvent(req.swagger.root.definitions,
      req.params.byu_id, req.params.event_id, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    console.log(success);
    res.sendStatus(204);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};