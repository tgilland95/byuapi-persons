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

exports.getPerson = function getAddress(definitions, byu_id, permissions) {
  const promises = [];
  promises.push(basic.getBasic(definitions, byu_id, permissions));
  return Promise.all(promises)
    .then(function (results) {
      console.log(results[0]);
      return { basic: results[0] };
    })
};
