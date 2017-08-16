'use strict';
const oracle = require('oracledb');
const param = require('./param');

oracle.outFormat = oracle.OBJECT;
oracle.autoCommit = true;

console.log("CREATING POOL");
const poolPromise = param.getParams()
  .then(function (params) {
    const dbconfig = {
      user: params.DB_USER,
      password: params.DB_PWD,
      connectString: params.DB_CS
    };
// console.log(dbconfig);

    return oracle.createPool(dbconfig)
      .then(function (pool) {
        console.log("POOL CREATED");
        return pool;
      });
  });

poolPromise.then(function (pool) {
  oracle.getConnection(pool).then(function (conn) {
    conn.close();
  })
});

exports.connect = async function () {
  let startTime = (new Date()).getTime();
  const pool = await poolPromise;
  return oracle.getConnection(pool)
    .then(function (pool) {
      let elapsedMilliseconds = (new Date()).getTime() - startTime;
      console.log("elapsedMilliseconds: ",elapsedMilliseconds);
      return pool;
    });
};