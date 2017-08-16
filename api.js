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

const Enforcer          = require('swagger-enforcer');
const SansServer        = require('sans-server');
const SansServerSwagger = require('sans-server-swagger');
const byuJwt            = require('byu-jwt');

byuJwt.cacheWellknowns = true;
const wellknown = 'https://api.byu.edu/.well-known/openid-configuration';

// create a sans-server instance and export it
const api = SansServer();
module.exports = api;

api.hook(function defaultResponseHandler(state) {
  if(state.body instanceof Error && state.body.status) {
    this.body({
      return_code: state.body.status,
      explanation: state.body.message
    });
  }
});

api.use(function (req, res, next) {
  if (req.path === "/") {
    next();
  }
  else {
    byuJwt.authenticate(req.headers, wellknown)
      .then(function (verifiedJWTs) {
        req.verifiedJWTs = verifiedJWTs;
        next();
      })
      .catch(result => res.status(403).send({
        "return_code": 403,
        "error": "JWT Invalid"
      }));
  }
});

api.use(SansServerSwagger({
  controllers: './route_handlers',
  development: true,
  logs: 'verbose',
  swagger: './swagger.json',
  ignoreBasePath: true,
  exception: function exception(res, state) {
    res.body({
      return_code: state.statusCode,
      explanation: state.body,
      error: state.body
    });
  }
}));

// api.request(
//   {
//     headers: {
//       "x-jwt-assertion": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlpUUm1NMk5tWkRabFlUZG1aRFJqWVdJME1tTXpZamd4WWpNd1lXUXhNems0TnpFd09EVmxNdyJ9.eyJpc3MiOiJodHRwczovL2FwaS5ieXUuZWR1IiwiZXhwIjoxNTAyODE3ODk3LCJodHRwOi8vd3NvMi5vcmcvY2xhaW1zL3N1YnNjcmliZXIiOiJCWVUvbWRoMjYiLCJodHRwOi8vd3NvMi5vcmcvY2xhaW1zL2FwcGxpY2F0aW9uaWQiOiI2MjIiLCJodHRwOi8vd3NvMi5vcmcvY2xhaW1zL2FwcGxpY2F0aW9ubmFtZSI6IlVuaXZlcnNpdHkgQVBJIERldiIsImh0dHA6Ly93c28yLm9yZy9jbGFpbXMvYXBwbGljYXRpb250aWVyIjoiVW5saW1pdGVkIiwiaHR0cDovL3dzbzIub3JnL2NsYWltcy9hcGljb250ZXh0IjoiL2VjaG8vdjEiLCJodHRwOi8vd3NvMi5vcmcvY2xhaW1zL3ZlcnNpb24iOiJ2MSIsImh0dHA6Ly93c28yLm9yZy9jbGFpbXMvdGllciI6IlVubGltaXRlZCIsImh0dHA6Ly93c28yLm9yZy9jbGFpbXMva2V5dHlwZSI6IlBST0RVQ1RJT04iLCJodHRwOi8vd3NvMi5vcmcvY2xhaW1zL3VzZXJ0eXBlIjoiQVBQTElDQVRJT05fVVNFUiIsImh0dHA6Ly93c28yLm9yZy9jbGFpbXMvZW5kdXNlciI6Im1kaDI2QGNhcmJvbi5zdXBlciIsImh0dHA6Ly93c28yLm9yZy9jbGFpbXMvZW5kdXNlclRlbmFudElkIjoiLTEyMzQiLCJodHRwOi8vYnl1LmVkdS9jbGFpbXMvcmVzb3VyY2Vvd25lcl9zdWZmaXgiOiIgIiwiaHR0cDovL2J5dS5lZHUvY2xhaW1zL2NsaWVudF9yZXN0X29mX25hbWUiOiIgIiwiaHR0cDovL2J5dS5lZHUvY2xhaW1zL3Jlc291cmNlb3duZXJfcGVyc29uX2lkIjoiMzEzMjA0ODYyIiwiaHR0cDovL2J5dS5lZHUvY2xhaW1zL3Jlc291cmNlb3duZXJfYnl1X2lkIjoiOTE1MjgyNTM2IiwiaHR0cDovL3dzbzIub3JnL2NsYWltcy9jbGllbnRfaWQiOiIxMDhLWlFmdWczWkFTZjN4bWZtSmZVd0Q5VzhhIiwiaHR0cDovL2J5dS5lZHUvY2xhaW1zL3Jlc291cmNlb3duZXJfbmV0X2lkIjoibWRoMjYiLCJodHRwOi8vYnl1LmVkdS9jbGFpbXMvcmVzb3VyY2Vvd25lcl9zdXJuYW1lIjoiSGFpbHN0b25lIiwiaHR0cDovL2J5dS5lZHUvY2xhaW1zL2NsaWVudF9wZXJzb25faWQiOiI3NDkyMjQ3MDIiLCJodHRwOi8vYnl1LmVkdS9jbGFpbXMvY2xpZW50X3NvcnRfbmFtZSI6IkNvcmUgU2VydmljZXMiLCJodHRwOi8vYnl1LmVkdS9jbGFpbXMvY2xpZW50X2NsYWltX3NvdXJjZSI6IkNMSUVOVF9JRCIsImh0dHA6Ly9ieXUuZWR1L2NsYWltcy9jbGllbnRfbmV0X2lkIjoiICIsImh0dHA6Ly9ieXUuZWR1L2NsYWltcy9jbGllbnRfc3Vic2NyaWJlcl9uZXRfaWQiOiJtZGgyNiIsImh0dHA6Ly9ieXUuZWR1L2NsYWltcy9yZXNvdXJjZW93bmVyX3ByZWZpeCI6IiAiLCJodHRwOi8vYnl1LmVkdS9jbGFpbXMvcmVzb3VyY2Vvd25lcl9zdXJuYW1lX3Bvc2l0aW9uIjoiTCIsImh0dHA6Ly9ieXUuZWR1L2NsYWltcy9yZXNvdXJjZW93bmVyX3Jlc3Rfb2ZfbmFtZSI6Ik1hdHRoZXcgRCIsImh0dHA6Ly9ieXUuZWR1L2NsYWltcy9jbGllbnRfbmFtZV9zdWZmaXgiOiIgIiwiaHR0cDovL2J5dS5lZHUvY2xhaW1zL2NsaWVudF9zdXJuYW1lIjoiQ29yZSBTZXJ2aWNlcyIsImh0dHA6Ly9ieXUuZWR1L2NsYWltcy9jbGllbnRfbmFtZV9wcmVmaXgiOiIgIiwiaHR0cDovL2J5dS5lZHUvY2xhaW1zL2NsaWVudF9zdXJuYW1lX3Bvc2l0aW9uIjoiTCIsImh0dHA6Ly9ieXUuZWR1L2NsYWltcy9yZXNvdXJjZW93bmVyX3ByZWZlcnJlZF9maXJzdF9uYW1lIjoiTWF0dGhldyIsImh0dHA6Ly9ieXUuZWR1L2NsYWltcy9jbGllbnRfYnl1X2lkIjoiNzg1NjI2OTQwIiwiaHR0cDovL2J5dS5lZHUvY2xhaW1zL2NsaWVudF9wcmVmZXJyZWRfZmlyc3RfbmFtZSI6IiAiLCJodHRwOi8vYnl1LmVkdS9jbGFpbXMvcmVzb3VyY2Vvd25lcl9zb3J0X25hbWUiOiJIYWlsc3RvbmUsIE1hdHRoZXcgRCJ9.qY0KXtE22RgmxvZU9AyXcdq43wog0ZFRHjU3AUqAE8K2lvGMQMgl6pi4tlYeEnZl7fGTZewtD5mQzFssIc0ERimo_wwxvNoGRVoihU5zTqxF2SlhtjZ-ogbULY5n9QCqSmT5EutxMW2_E3lC8IGiRPsGZUhdBZzEraPhTt9IFwyWT7Y-qe-Gq6cgclvotduKL8yodVIB334mYAYWBAjPu1cRLL6fn3Nz_bWl7FozNB4n_VtFDGC1aHVNEtwL8vUVsv8daktBoyvNCDDZi8-6O7diuc3LHu1haz7DjmBBm7rafD7omaxOzdEgluvtnh4L7IgiCJ1Y9axakt9oT1l_6w",
//       Accept: "application/json",
//       "Cache-Control": "no-cache"
//     },
//     method: "GET",
//     path: "915282536/addresses/MAL"
//   }
// )
//   .then(console.log);