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

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });

let params = null;

exports.getParams = async function () {
  // console.log("GETTING PARAMS");
  return new Promise((resolve, reject) => {
    if (!params) {
      if (process.env.WELL_KNOWN && process.env.CLIENT_KEY && process.env.CLIENT_SECRET && process.env.DB_USER && process.env.DB_PWD && process.env.DB_CS) {
        params = {};
        params.WELL_KNOWN = process.env.WELL_KNOWN;
        params.CLIENT_KEY = process.env.CLIENT_KEY;
        params.CLIENT_SECRET = process.env.CLIENT_SECRET;
        params.DB_USER = process.env.DB_USER;
        params.DB_PWD = process.env.DB_PWD;
        params.DB_CS = process.env.DB_CS;
        resolve(params);
      }
      else {
        let p = {
          WithDecryption: true,
          Names: [
            process.env.HANDEL_APP_NAME + '.' + process.env.HANDEL_ENVIRONMENT_NAME + '.WELL_KNOWN',
            process.env.HANDEL_APP_NAME + '.' + process.env.HANDEL_ENVIRONMENT_NAME + '.CLIENT_KEY',
            process.env.HANDEL_APP_NAME + '.' + process.env.HANDEL_ENVIRONMENT_NAME + '.CLIENT_SECRET',
            process.env.HANDEL_APP_NAME + '.' + process.env.HANDEL_ENVIRONMENT_NAME + '.DB_USER',
            process.env.HANDEL_APP_NAME + '.' + process.env.HANDEL_ENVIRONMENT_NAME + '.DB_PWD',
            process.env.HANDEL_APP_NAME + '.' + process.env.HANDEL_ENVIRONMENT_NAME + '.DB_CS'
          ]
        };

        // console.log("CALLING AWS PARAM STORE");

        const ssm = new AWS.SSM({ apiVersion: '2014-11-06', region: 'us-west-2' });
        ssm.getParameters(p).promise()
          .then(response => {
            // console.log("RESPONSE:", response);
            params = {};
            response.Parameters.forEach(function (parameter) {
              if (parameter.Name === process.env.HANDEL_APP_NAME + '.' + process.env.HANDEL_ENVIRONMENT_NAME + '.WELL_KNOWN') params.WELL_KNOWN = parameter.Value;
              if (parameter.Name === process.env.HANDEL_APP_NAME + '.' + process.env.HANDEL_ENVIRONMENT_NAME + '.CLIENT_KEY') params.CLIENT_KEY = parameter.Value;
              if (parameter.Name === process.env.HANDEL_APP_NAME + '.' + process.env.HANDEL_ENVIRONMENT_NAME + '.CLIENT_SECRET') params.CLIENT_SECRET = parameter.Value;
              if (parameter.Name === process.env.HANDEL_APP_NAME + '.' + process.env.HANDEL_ENVIRONMENT_NAME + '.DB_USER') params.DB_USER = parameter.Value;
              if (parameter.Name === process.env.HANDEL_APP_NAME + '.' + process.env.HANDEL_ENVIRONMENT_NAME + '.DB_PWD') params.DB_PWD = parameter.Value;
              if (parameter.Name === process.env.HANDEL_APP_NAME + '.' + process.env.HANDEL_ENVIRONMENT_NAME + '.DB_CS') params.DB_CS = parameter.Value;
            });
            if (params.WELL_KNOWN === undefined || params.CLIENT_KEY === undefined || params.CLIENT_SECRET === undefined || params.DB_USER === undefined || params.DB_PWD === undefined || params.DB_CS === undefined) {
              let msg = '[Config Error] Unable to retrieve parameters from AWS parameter store.';
              console.log(msg);
              reject(new Error(msg));
            }
            else {
              console.log('[Config] Retrieved WSO2 credentials from AWS parameter store.');
              resolve(params);
            }
          })
          .catch(err => {
            reject(err);
          });
      }
    }
    else {
      resolve(params);
    }
  })
};