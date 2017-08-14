'use strict';
const oracle = require('oracledb');
const param = require('./param');

oracle.outFormat = oracle.OBJECT;
oracle.autoCommit = true;

let pool = null;

exports.connect = async function () {
  if (!pool) {
    console.log("CREATING POOL");
    const params = await param.getParams();
    const dbconfig = {
      user: params.DB_USER,
      password: params.DB_PWD,
      connectString: params.DB_CS
    };
    // console.log(dbconfig);

    pool = await oracle.createPool(dbconfig);
    console.log("POOL CREATED");
  }
  return oracle.getConnection(pool);
};