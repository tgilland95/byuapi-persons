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

const languagesController = require('../controllers/languages/languages');
const auth = require('../controllers/auth');
const utils = require('../controllers/utils');

exports.getLanguage = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['languages']);
    const language = await languagesController.getLanguage(req.swagger.root.definitions,
      req.params.byu_id, req.params.language_code, permissions);

    res.send(language);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.getLanguages = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['languages']);
    const languages = await languagesController.getLanguages(req.swagger.root.definitions,
      req.params.byu_id, permissions);

    res.send(languages);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.modifyLanguage = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['languages']);
    const language = await languagesController.modifyLanguage(req.swagger.root.definitions,
      req.params.byu_id, req.params.language_code, req.body, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    res.send(language);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.deleteLanguage = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['languages']);
    const success = await languagesController.deleteLanguage(req.swagger.root.definitions,
      req.params.byu_id, req.params.language_code, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    console.log(success);
    res.sendStatus(204);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};