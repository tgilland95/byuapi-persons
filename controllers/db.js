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
      connectString: params.DB_CS,
      poolMin: 2
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

async function connect() {
  let startTime = (new Date()).getTime();
  const pool = await poolPromise;
  return oracle.getConnection(pool)
    .then(function (pool) {
      let elapsedMilliseconds = (new Date()).getTime() - startTime;
      console.log("elapsedMilliseconds: ",elapsedMilliseconds);
      return pool;
    });
};

exports.executeSelect = async function (sql,params) {
  // console.log("CONNECTING TO DB");
  const conn = await connect();
  const result = await conn.execute(sql, params);
  // console.log("SQL EXECUTED");
  conn.close();
  return result;
};

exports.executeUpdate = function(sql,params) {
  return connect()
    .then(function (conn) {
      // console.log("update connection created");
      return conn.execute(sql, params)
        .then(function (result) {
          conn.close();
          return result;
        })
        .catch(function (err) {
          console.log(err);
          throw err;
        })
    })
};

exports.intermediaryId = {
  get:
    `select events.intermediary.intermediary_id as "intermediary_id"
 from   events.intermediary
 where  events.intermediary.url = :URL`,
  put:
    `insert into events.intermediary
 values  (events.intermediary_seq.nextval,
 :URL,
 :ACTOR,
 :GROUP_ID,
 sysdate,
 :CREATED_BY_ID)`
};

exports.eventPersonAddress = {
  raiseEvent:
    `insert into iam.event
 (event_id,
 date_time_created,
 event_body)
 values      (iam.event_id_seq.nextval,
 systimestamp,
 :1)`
};

exports.enqueue = {
  sql:
    `CALL iam.iam_enqueue_now(:1)`
};