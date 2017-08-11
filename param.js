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
            if (fs.existsSync('./config.json')) {


                params = require('./config.json');
                // console.log(params);
                resolve(params);
            }
            else {
                let p = {
                    WithDecryption: true,
                    Names: [
                        'byuapi--persons.dev.WELL_KNOWN',
                        'byuapi--persons.dev.CLIENT_KEY',
                        'byuapi--persons.dev.CLIENT_SECRET',
                        'byuapi--persons.dev.DB_CONFIG',
                        'byuapi--persons.dev.DB_AUTH'
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
                            if (parameter.Name === 'byuapi--persons.dev.DB_CONFIG') params.DB_CONFIG = parameter.Value;
                            if (parameter.Name === 'byuapi--persons.dev.DB_AUTH') params.DB_AUTH = parameter.Value;
                        });
                        if (params.WELL_KNOWN === undefined || params.CLIENT_KEY === undefined || params.CLIENT_SECRET === undefined || params.DB_CONFIG === undefined || params.DB_AUTH === undefined) {
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