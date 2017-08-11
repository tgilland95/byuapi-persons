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
const byu_jwt = require('byu-jwt');
const q = require('bluebird');


exports.verifyJWTs = function(headers) {
  var jwt_promises = [];
  if (headers[byu_jwt.BYU_JWT_HEADER_ORIGINAL.toLowerCase()]) {
    console.log('-------------------- x-jwt-assertion-original header found ------------------');
    var originalJWT = headers[byu_jwt.BYU_JWT_HEADER_ORIGINAL.toLowerCase()];
    jwt_promises.push(byu_jwt.jwtDecoded(originalJWT, "https://api.byu.edu/.well-known/openid-configuration"));
  }
  if (headers[byu_jwt.BYU_JWT_HEADER_CURRENT.toLowerCase()]) {
    console.log('-------------------- x-jwt-assertion header found ------------------');
    var currentJWT = headers[byu_jwt.BYU_JWT_HEADER_CURRENT.toLowerCase()];
    jwt_promises.push(byu_jwt.jwtDecoded(currentJWT, "https://api.byu.edu/.well-known/openid-configuration"));
  }
  if (jwt_promises.length == 0) {
    return q.resolve({error: "No expected JWTs found"});
  }
  return q.settle(jwt_promises)
    .then(function (verified_results) {
      var verifiedJWTs = {};
      console.log("Number of expected JWTS: " + verified_results.length);

      var currentIndex = verified_results.length > 1 ? 1 : 0;
      if (verified_results[currentIndex].isFulfilled()) {
        verifiedJWTs.current = verified_results[currentIndex]._settledValue;
      }
      else {
        return {error: "Invalid JWT"};
      }

      if (verified_results.length > 1) {
        if (verified_results[0].isFulfilled()) {
          verifiedJWTs.original = verified_results[0]._settledValue;
        }
        else {
          return {error: "Invalid Original JWT"};
        }
      }

      var roClaimsOriginal = {};
      if (verifiedJWTs.original) {
        roClaimsOriginal = retrieveResourceOwnerClaims(verifiedJWTs.original);
      }
      var roClaimsCurrent = retrieveResourceOwnerClaims(verifiedJWTs.current);

      if (verifiedJWTs.original) {
        verifiedJWTs.roClaims = roClaimsOriginal;
      }
      else {
        verifiedJWTs.roClaims = roClaimsCurrent;
      }

      verifiedJWTs.authorized_byu_id = verifiedJWTs.current.byu.webresCheck.byuId;
      if (verifiedJWTs.original) {
        verifiedJWTs.authorized_byu_id = verifiedJWTs.original.byu.webresCheck.byuId;
      }
      return verifiedJWTs;
    });
};

exports.Error = function (status, message) {
  const err = Error(message);
  err.status = status;
  return err;
};