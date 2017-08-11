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
  let dateString = new Date().toISOString();
  /*let result = {};
  result.byu_id = "123456789";
  result.name = "Bill";
  result.restricted = "Y";
  result.address_type = "MAL";
  result.date_time_updated = dateString;
  result.updated_by_id = "123456789";
  result.updated_by_name = "Bill";
  result.date_time_created = dateString;
  result.created_by_id = "123456789";
  result.created_by_name = "Bill";
  result.address_line_1 = "Y";
  result.address_line_2 = "Y";
  result.address_line_3 = "Y";
  result.address_line_4 = "Y";
  result.country_code = "Y";
  result.country_name = "Y";
  result.room = "Y";
  result.building_code = "Y";
  result.building_name = "Y";
  result.long_building_name = "Y";
  result.city = "Y";
  result.state_code = "Y";
  result.state_name = "Y";
  result.postal_code = "Y";
  result.unlisted = "Y";
  result.verified_flag = "Y";
  result.primary_role = "Y";
    return Promise.resolve({rows: [result]});*/
    console.log("CONNECTING TO DB");
    const conn = await db.connect();
    const result = await conn.execute(sql, params);
    console.log("SQL EXECUTED");
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