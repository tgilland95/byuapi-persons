"use strict";
const db = require('./dbconnection');

const clearNull = function(arr) {
    for(let i = 0; i < arr.length; i++) {
        for (let property in arr[i]) {
            if (arr[i].hasOwnProperty(property)) {
                //console.log(typeof arr[i][property]);
                if (arr[i][property] === null) {
                    arr[i][property] = "";
                }
                if (typeof arr[i][property] === "number") {
                    arr[i][property] = arr[i][property].toString();
                }
            }
        }
    }
    return arr;
};

exports.executeSelect = async function (sql,params) {
  // console.log("CONNECTING TO DB");
  const conn = await db.connect();
  const result = await conn.execute(sql, params);
  // console.log("SQL EXECUTED");
  conn.close();
  return result;
};

exports.executeUpdate = function(sql,params) {
    return db.connect()
        .then(function (conn) {
            console.log("update connection created");
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