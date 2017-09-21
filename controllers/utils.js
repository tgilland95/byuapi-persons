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

const Enforcer = require('swagger-enforcer');

exports.Error = function (status, message) {
  const err = Error(message);
  err.status = status;
  return err;
};

const clearNull = function (arr) {
  const len = arr.length;
  for (let i = 0; i < len; i++) {
    for (let property in arr[i]) {
      if (arr[i].hasOwnProperty(property)) {
        if (arr[i][property] === null) {
          arr[i][property] = "";
        }
        if (typeof arr[i][property] === 'number') {
          arr[i][property] = arr[i][property].toString();
        }
      }
    }
  }
  return arr;
};

exports.defaultResponseHandler = function (metadata_definition, initial, res, error) {
  initial.metadata = Enforcer.applyTemplate(metadata_definition, null,
    {
      validation_response_code: error.status || 500,
      validation_response_message: error.message || 'Internal Server Error'
    });
  res.status(initial.metadata.validation_response.code).send(initial);
};

//Checks to see if the country input matches our list of known country codes
// if it does not then an error is returned
exports.isValidCountryCode = function (country_code) {
  if (/^([?]{3}|UK|HK|EL|CW|SX|[A-Z]{3})$/.test(country_code)) {
    const country_codes = require("../meta/countries/countryCodes.json");

    for (let i = country_codes.items.length; i--;) {
      if (country_code === country_codes.items[i].country_code) {
        return true;
      }
    }
  }
  return false;
};

//This function checks the state codes for USA, CAN, and AUS input by the user
// if the user has entered an invalid state code an error is returned
exports.isValidStateCode = function (state_code, country_code) {
  if (/^(USA|CAN|AUS)$/g.test(country_code) &&
    /^([?]{2}|[A-Z]{2,5})$/g.test(state_code)) {
    const state_codes = require("../meta/states/stateCodes.json");

    for (let i = state_codes.items.length; i--;) {
      if ((state_code === state_codes.items[i].state_code) &&
        (country_code === state_codes.items[i].country_code)) {
        return true;
      }
    }
    return false;
  }
  return true;
};

//This function is used in the PUT to validate an on campus building code
exports.isValidBuildingCode = function (building_code) {
  const building_codes = require("../meta/buildings/buildingCodes.json");

  for (let i = building_codes.items.length; i--;) {
    if (building_code && building_code === building_codes.items[i].domain_value) {
      return true;
    }
  }
  return false;
};

exports.isValidReligionCode = function (religion_code) {
  const religions = require("../meta/religions/religion_codes");

  return religions.religion_codes.includes(religion_code);
};

