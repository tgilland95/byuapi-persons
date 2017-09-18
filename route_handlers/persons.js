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

const auth = require('../controllers/auth');
const personsController = require('../controllers/persons/persons');
const basicController = require('../controllers/basic/basic');
const utils = require('../controllers/utils');

exports.getPersons = async (req, res) => {
  try {
    const field_sets = req.query.field_sets || ['basic'];
    const permissions = await auth.getPermissions(req, field_sets);
    const persons = await personsController.getPersons(req.swagger.root.definitions,
      req.query, permissions);

    res.send(persons);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.getPerson = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, req.query.field_sets);
    const person = await personsController.getPerson(req.swagger.root.definitions, req.params.byu_id, req.query, permissions);

    res.send(person);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.modifyPerson = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['basic']);
    const person = await  personsController.modifyPerson(req.swagger.root.definitions,
      req.params.byu_id, req.verifiedJWTs.prioritizedClaims.byuId, req.body, permissions);

    res.send(person);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.createPerson = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['basic']);
    const person = await  personsController.createPerson(req.swagger.root.definitions,
      req.verifiedJWTs.prioritizedClaims.byuId, req.body, permissions);

    res.send(person);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};