'use strict';
const oracle = require('oracledb');
const param = require('./param');

oracle.outFormat = oracle.OBJECT;

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
        process.on("SIGINT", function () {
          console.log("SIGINT");
          pool.close();
          process.exit(0);
        });
        return pool;
      });
  });

exports.getConnection = async function () {
  let startTime = (new Date()).getTime();
  const pool = await poolPromise;
  return oracle.getConnection(pool)
    .then(function (conn) {
      let elapsedMilliseconds = (new Date()).getTime() - startTime;
      console.log("elapsedMilliseconds: ",elapsedMilliseconds);
      return conn;
    });
};

exports.execute = async function (sql, params, options) {
  // console.log("CONNECTING TO DB");
  let conn;
  try {
    conn = await exports.getConnection();
    const result = await conn.execute(sql, params, options || {});
    // console.log("SQL EXECUTED");
    conn.close();
    return result;
  } catch (e) {
    if(conn) {
      conn.close();
    }
  }
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