process.on('unhandledRejection', (reason) => {
  console.error(reason.stack);
  process.exit(1);
});

const byuJwt = require('byu-jwt');
// const oracledb = require('oracledb');
const param = require('./param');
const utils = require('./controllers/utils');

const api               = require('./api');
const bodyParser        = require('body-parser');
const express           = require('express');
const expressTranslator = require('sans-server-express');

byuJwt.cacheWellknowns = true;
const wellknown = 'https://api.byu.edu/.well-known/openid-configuration';

const app = express();

app.use(bodyParser.json());

// app.use(function (req, res, next) {
//     if (req.path === "/") {
//         next();
//     }
//     else {
//         utils.verifyJWTs(req.headers)
//             .then(function (verifiedJWTs) {
//                 console.log("GETTING CLIENT ID FROM PARAM STORE");
//                 param.getParams()
//                     .then((params) => {
//                         console.log("GOT PARAMS!");
//                         if (verifiedJWTs.current.wso2.clientId !== params.CLIENT_KEY) {
//                             console.log("Invalid ClientId:", params.CLIENT_KEY);
//                             console.log("Invalid ClientId:", verifiedJWTs.current.wso2.clientId);
//                             res.status(403).send({
//                                 "return_code": 403,
//                                 "error": "Access denied to protected data"
//                             })
//                         }
//                         req.verifiedJWTs = verifiedJWTs;
//                         next();
//                     })
//                     .catch(err => {
//                         console.log(err);
//                         res.status(500).send({
//                             "return_code": 500,
//                             "error": "Internal Server Error"
//                         });
//                     });
//             })
//             .catch(result => res.status(403).send({
//                 "return_code": 403,
//                 "error": "JWT Expired"
//             }));
//     }
// });

app.get("/", function (req, res) {
    res.status(200).send("Success");
});

app.use(expressTranslator(api));

app.listen(3000, () => console.log("Listening on port:3000"));