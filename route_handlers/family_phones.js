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

const familyPhonesController = require('../controllers/family_phones/family_phones');
const auth = require('../controllers/auth');
const utils = require('../controllers/utils');

exports.getFamilyPhone = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['family_phones']);
    const family_phone = await familyPhonesController.getFamilyPhone(req.swagger.root.definitions,
      req.params.byu_id, req.params.phone_type, req.params.lookup_number, permissions);

    res.send(family_phone);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.getFamilyPhones = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['family_phones']);
    const family_phones = await familyPhonesController.getFamilyPhones(req.swagger.root.definitions,
      req.params.byu_id, permissions);

    res.send(family_phones);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.modifyFamilyPhone = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['family_phones']);
    const family_phone = await familyPhonesController.modifyFamilyPhone(req.swagger.root.definitions,
      req.params.byu_id, req.params.phone_type, req.params.lookup_number, req.body, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    res.send(family_phone);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.deleteFamilyPhone = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['family_phones']);
    const success = await familyPhonesController.deleteFamilyPhone(req.swagger.root.definitions,
      req.params.byu_id, req.params.phone_type, req.params.lookup_number, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    console.log(success);
    res.sendStatus(204);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};