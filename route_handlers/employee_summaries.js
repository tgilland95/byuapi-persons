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

const employeeSummariesController = require('../controllers/employee_summaries/employee_summaries');
const auth = require('../controllers/auth');
const utils = require('../controllers/utils');

exports.getEmployeeSummaries = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['employee_summaries']);
    const employee_summaries = await employeeSummariesController.getEmployeeSummaries(req.swagger.root.definitions,
      req.params.byu_id, permissions);

    res.send(employee_summaries);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};