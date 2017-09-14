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

const relationshipsController = require('../controllers/relationships/relationships');
const auth = require('../controllers/auth');
const utils = require('../controllers/utils');

exports.getRelationship = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['relationships']);
    const relationship = await relationshipsController.getRelationship(req.swagger.root.definitions,
      req.params.byu_id, req.params.related_id, permissions);

    res.send(relationship);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.getRelationships = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['relationships']);
    const relationships = await relationshipsController.getRelationships(req.swagger.root.definitions,
      req.params.byu_id, permissions);

    res.send(relationships);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.modifyRelationship = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['relationships']);
    const relationship = await relationshipsController.modifyRelationship(req.swagger.root.definitions,
      req.params.byu_id, req.params.related_id, req.body, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    res.send(relationship);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.deleteRelationship = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['relationships']);
    const success = await relationshipsController.deleteRelationship(req.swagger.root.definitions,
      req.params.byu_id, req.params.related_id, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    console.log(success);
    res.sendStatus(204);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};