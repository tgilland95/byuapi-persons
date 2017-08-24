/*
 * Copyright 2017 Brigham Young University
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

const SansServer = require('sans-server');
const SansServerSwagger = require('sans-server-swagger');
const byuJwt = require('byu-jwt');

byuJwt.cacheWellknowns = true;
const wellknown = 'https://api.byu.edu/.well-known/openid-configuration';

const api = SansServer();

api.hook(function defaultResponseHandler(state) {
  if (state.body instanceof Error && state.body.status) {
    this.body({
      return_code: state.body.status,
      explanation: state.body.message,
      error: state.body.message
    });
  }
});

api.use(async (req, res, next) => {
  if (req.path === '/') {
    next();
  }
  else {
    try {
      req.verifiedJWTs = await byuJwt.authenticate(req.headers, wellknown);
      next();
    } catch (error) {
      console.error(error.stack);
      res.status(403).send({
        'return_code': 403,
        'error': 'JWT Invalid'
      });
    }
  }
});

api.use(SansServerSwagger({
  controllers: './route_handlers',
  development: true,
  logs: 'verbose',
  swagger: './swagger.json',
  // exception: function exception(res, state) {
  //   res.body({
  //     return_code: state.statusCode,
  //     explanation: state.body,
  //     error: state.body
  //   });
  // }
}));

module.exports = api;
