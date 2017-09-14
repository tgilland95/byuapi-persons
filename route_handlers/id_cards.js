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

const idCardsController = require('../controllers/id_cards/id_cards');
const auth = require('../controllers/auth');
const utils = require('../controllers/utils');

exports.getIdCards = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['id_cards']);
    const id_cards = await idCardsController.getIdCards(req.swagger.root.definitions,
      req.params.byu_id, permissions);

    res.send(id_cards);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.modifyIdCards = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['id_cards']);
    const id_cards = await idCardsController.modifyIdCards(req.swagger.root.definitions,
      req.params.byu_id, req.body, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    res.send(id_cards);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};

exports.deleteIdCards = async (req, res) => {
  try {
    const permissions = await auth.getPermissions(req, ['id_cards']);
    const success = await idCardsController.deleteIdCards(req.swagger.root.definitions,
      req.params.byu_id, req.verifiedJWTs.prioritizedClaims.byuId, permissions);

    console.log(success);
    res.sendStatus(204);
  } catch (error) {
    console.error(error.stack);
    utils.defaultResponseHandler(req.swagger.root.definitions.simple_metadata, {}, res, error);
  }
};