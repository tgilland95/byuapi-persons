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

const SansServer        = require('sans-server');
const SansServerSwagger = require('sans-server-swagger');
const byuJwt            = require('byu-jwt');

byuJwt.cacheWellknowns = true;
const wellknown = 'https://api.byu.edu/.well-known/openid-configuration';

// create a sans-server instance and export it
const api = SansServer();
module.exports = api;

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
  exception: function exception(res, state) {
    if(state.body instanceof Error && state.body.status) {
      res.body({ metadata: { validation_response: { code: state.body.status, message: state.body.message}}});
    }
    else {
      res.body({ metadata: { validation_response: { code: state.statusCode, message: state.body}}});
    }
  }
}));
