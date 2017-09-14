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

const personalRecordsController = require('../controllers/personal_records/personal_records');
const auth = require('../controllers/auth');
const utils = require('../controllers/utils');


exports.getPersonalRecords = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['personal_records']);
    const personal_records = await personalRecordsController.getPersonalRecords(req.swagger.root.definitions,
      req.params.byu_id, permissions);

    res.send(personal_records);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.modifyPersonalRecords = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['personal_records']);
    const personal_records = await personalRecordsController.modifyPersonalRecords(req.swagger.root.definitions,
      req.params.byu_id, req.body, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    res.send(personal_records);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};