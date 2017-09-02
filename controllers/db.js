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

const oracle = require('oracledb');
const param = require('./param');

oracle.outFormat = oracle.OBJECT;

console.log("CREATING POOL");
const poolPromise = param.getParams()
  .then(async (params) => {
    const dbconfig = {
      user: params.DB_USER,
      password: params.DB_PWD,
      connectString: params.DB_CS,
      poolMin: 2
    };
    const pool = await oracle.createPool(dbconfig);

    console.log("POOL CREATED");
    process.on("SIGINT", () => {
      console.log("SIGINT");
      pool.close();
      process.exit(0);
    });
    return pool;
  });

exports.getConnection = async function () {
  const startTime = (new Date()).getTime();
  const pool = await poolPromise;
  const conn = await oracle.getConnection(pool);
  const elapsedMilliseconds = (new Date()).getTime() - startTime;
  console.log("elapsedMilliseconds: ", elapsedMilliseconds);

  return conn;
};

exports.execute = async function (sql, params, options) {
  // console.log("CONNECTING TO DB");
  let conn;
  try {
    conn = await exports.getConnection();
    const result = await conn.execute(sql, params, options || {});
    conn.close();
    return result;
  } catch (e) {
    if (conn) {
      conn.close();
    }
  }
};

exports.intermediaryId = {
  get: `
    select events.intermediary.intermediary_id as "intermediary_id" 
    from   events.intermediary 
    where  events.intermediary.url = :URL`,
  put: `
    insert into events.intermediary 
    values  (events.intermediary_seq.nextval, 
             :URL, 
             :ACTOR, 
             :GROUP_ID, 
             sysdate, 
             :CREATED_BY_ID)`
};

exports.raiseEvent = `
  insert into iam.event 
              (event_id, 
               date_time_created, 
               event_body) 
  values      (iam.event_id_seq.nextval, 
               systimestamp, 
               :1)`;

exports.enqueue = `call iam.iam_enqueue_now(:1)`;