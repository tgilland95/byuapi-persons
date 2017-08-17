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
"use strict";
const basic           = require('./basic/basic');
const addresses       = require('./addresses/addresses');

exports.getPerson = async function (definitions, byu_id, query, permissions) {
  const promises = [];
  const result = {};

  if(query.field_sets.includes('basic')){
    promises.push(basic.getBasic(definitions, byu_id, permissions).then(function (basic_result) {
      result.basic = basic_result;
    }));
  }
  if(query.field_sets.includes('addresses')) {
    promises.push(addresses.getAddresses(definitions, byu_id, permissions).then(function (addresses_result) {
      result.addresses = addresses_result;
    }));
  }
  await Promise.all(promises);
  return result;
};

exports.getPersons = async function(definitions, query, permisisons) {

};