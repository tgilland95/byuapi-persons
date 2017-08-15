'use strict';
const AWS = require('aws-sdk');
//const handel = require('handel-utils/lib/parameterStore');
AWS.config.update({ region: 'us-west-2' });
const fs = require('fs');

let params = null;

exports.getParams = function () {
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
                        'byuapi--persons.dev.WELL_KNOWN',
                        'byuapi--persons.dev.CLIENT_KEY',
                        'byuapi--persons.dev.CLIENT_SECRET',
                        'byuapi--persons.dev.DB_USER',
                        'byuapi--persons.dev.DB_PWD',
                        'byuapi--persons.dev.DB_CS'
                    ]
                };

                // console.log("CALLING AWS PARAM STORE");

                const ssm = new AWS.SSM({ apiVersion: '2014-11-06', region: 'us-west-2' });
                ssm.getParameters(p).promise()
                    .then(response => {
                        // console.log("RESPONSE:", response);
                        params = {};
                        response.Parameters.forEach(function (parameter) {
                            if (parameter.Name === 'byuapi--persons.dev.WELL_KNOWN') params.WELL_KNOWN = parameter.Value;
                            if (parameter.Name === 'byuapi--persons.dev.CLIENT_KEY') params.CLIENT_KEY = parameter.Value;
                            if (parameter.Name === 'byuapi--persons.dev.CLIENT_SECRET') params.CLIENT_SECRET = parameter.Value;
                            if (parameter.Name === 'byuapi--persons.dev.DB_USER') params.DB_USER = parameter.Value;
                            if (parameter.Name === 'byuapi--persons.dev.DB_PWD') params.DB_PWD = parameter.Value;
                            if (parameter.Name === 'byuapi--persons.dev.DB_CS') params.DB_CS = parameter.Value;
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