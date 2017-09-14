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

const emailAliasesController = require('../controllers/email_aliases/email_aliases');
const auth = require('../controllers/auth');
const utils = require('../controllers/utils');

exports.getEmailAlias = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['email_aliases']);
    const email_alias = await emailAliasesController.getEmailAlias(req.swagger.root.definitions,
      req.params.byu_id, req.params.email_alias_type, permissions);

    res.send(email_alias);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.getEmailAliases = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['email_aliases']);
    const email_aliases = await emailAliasesController.getEmailAliases(req.swagger.root.definitions,
      req.params.byu_id, permissions);

    res.send(email_aliases);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.modifyEmailAlias = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['email_aliases']);
    const email_alias = await emailAliasesController.modifyEmailAlias(req.swagger.root.definitions,
      req.params.byu_id, req.params.email_alias_type, req.body, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    res.send(email_alias);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.deleteEmailAlias = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['email_aliases']);
    const success = await emailAliasesController.deleteEmailAlias(req.swagger.root.definitions,
      req.params.byu_id, req.params.email_alias_type, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    console.log(success);
    res.sendStatus(204);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};