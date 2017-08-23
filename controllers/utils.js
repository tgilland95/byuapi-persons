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

exports.Error = function (status, message) {
  const err = Error(message);
  err.status = status;
  return err;
};

const clearNull = function(arr) {
  for(let i = 0; i < arr.length; i++) {
    for (let property in arr[i]) {
      if (arr[i].hasOwnProperty(property)) {
        //console.log(typeof arr[i][property]);
        if (arr[i][property] === null) {
          arr[i][property] = "";
        }
        if (typeof arr[i][property] === "number") {
          arr[i][property] = arr[i][property].toString();
        }
      }
    }
  }
  return arr;
};
