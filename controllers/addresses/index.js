"use strict";

var moment = require("moment-timezone");
var sql = require("./sql.js");
var eventBuilder = require("./../event.js");
var core = require("../../core.js");
var bluebird = require("bluebird");
var ClientError = core.ClientError;


var current_date_time;
var identity_type = "Person";
var change_type = "";
var byu_id = " ";
var person_id = " ";
var net_id = " ";
var employee_type = " ";
var student_status = " ";
var restricted = " ";
var date_time_updated = "";
var updated_by_id = " ";
var date_time_created = "";
var created_by_id = " ";
var address_type = " ";
var from_address_line_1 = " ";
var from_address_line_2 = " ";
var from_address_line_3 = " ";
var from_address_line_4 = " ";
var from_country_code = " ";
var from_room = " ";
var from_building = " ";
var from_city = " ";
var from_state_code = " ";
var from_postal_code = " ";
var from_unlisted = " ";
var from_verified_flag = " ";
var address_line_1 = " ";
var address_line_2 = " ";
var address_line_3 = " ";
var address_line_4 = " ";
var country_code = " ";
var room = " ";
var building = " ";
var city = " ";
var state_code = " ";
var postal_code = " ";
var campus_address_f = " ";
var unlisted = " ";
var verified_flag = " ";
var accepted_date_formats = [
    "YYYY-MM-DD HH:mm:ss.SSS",
    "YYYY-MM-DDTHH:mm:ss.SSSZ",
    "YYYY-MM-DD h:mm:ss.SSS A",
    "YYYY-MM-DD h:mm:ss.SSS a",
    "YYYY-MM-DD",
    "MM/DD/YYYY",
    "M/D/YY",
    "M/D/YYYY",
    "DD-MMM-YYYY",
    "DD-MMM-YY",
    "DD MMMM YYYY"
];
var address_elements = [
    "address_line_1",
    "address_line_2",
    "address_line_3",
    "address_line_4",
    "country_code",
    "room",
    "building",
    "city",
    "state_code",
    "postal_code",
    "unlisted",
    "verified_flag"
];

//This is a function used to find the authorizations allowed, but is generic.
function inArray(needle, haystack) {
    for (var i = haystack.length; i--;) {
        if (haystack[i] === needle) {
            return true
        }
    }
    return false
}

//Checks to see if the country input matches our list of known country codes
// if it does not then an error is returned
function isValidCountryCode(country_code) {
    if (country_code && country_code.match(/^([?]{3}|[A-Z]{3})$/)) {
        var countryCode = require("../../meta/countries/countryCodes.json");
        var country_codes = countryCode.items;

        for (var i = country_codes.length; i--;) {
            if (country_code === country_codes[i].country_code) {
                return true
            }
        }
    }
    else {
        return false
    }
}

//This function checks the state codes for USA, CAN, and AUS input by the user
// if the user has entered an invalid state code an error is returned
function isValidStateCode(state_code, country_code) {
    if ((!country_code) || (!state_code)) {
        return false
    }
    else if (((country_code === "USA") ||
        (country_code === "CAN") ||
        (country_code === "AUS")) &&
        state_code.match(/^([?]{2}|[A-Z]{2,5})$/)) {
        var stateCode = require("../../meta/states/stateCodes.json");
        var state_codes = stateCode.items;

        for (var i = state_codes.length; i--;) {
            if ((state_code === state_codes[i].state_code) &&
                (country_code === state_codes[i].country_code)) {
                return true
            }
        }
        return false
    }
    else {
        return true
    }
}


//This function validates the postal code input by the user for USA and CAN addresses
//  it does not check to see if it matches the city only that the code is possible
function isValidPostalCode(postal_code, country_code) {
    if (postal_code && country_code && (country_code === "USA") &&
        (postal_code.match(/^[0-9]{5}$/))) {
        return true
    }
    else {
        return (postal_code && country_code && (country_code === "CAN") &&
        postal_code.toString().replace(/\W+/g, '').match(/([ABCEGHJKLMNPRSTVXY]\d)([ABCEGHJKLMNPRSTVWXYZ]\d){2}/i))
    }
}

//This function is used in the PUT to validate an on campus building code
function isValidBuildingCode(building_code) {
    var buildingCode = require("../../meta/buildings/buildingCodes.json");
    var building_codes = buildingCode.items;

    for (var i = building_codes.length; i--;) {
        if (building_code && building_code === building_codes[i]["domain_value"]) {
            return true
        }
    }
    return false
}

//This function is used to validate the address type in the URL for all methods
function isValidAddressType(address_type) {
    var valid = true;
    switch (address_type) {
        case "MAL":
        case "WRK":
        case "PRM":
        case "RES":
            break;
        default:
            valid = false
    }
    return valid
}

function isValidName(name) {
    return (name && name.match(/^(?=.*?[A-Z])([A-Za-z-]+ )*?[A-Za-z-]+$/))
}

function isYesOrNo(value) {
    switch (value) {
        case "Y":
        case "N":
            return true;
        default:
            return false
    }
}

//Performs the GET method
exports.get = function (connection, resources, request) {
    //Declare variables
    var params = [];
    //identify DEF.JSON file to be filled
    var def = resources.sub_resource_definitions["addresses"];
    var sql_query = sql.sql.getAddresses;

    //updates the URL to reflect the requested BYU_ID
    var links_map = {
        byu_id: request.params.resource_id[0]
    };
    core.updateHATEOASData(def.links, links_map);

    //add BYU_ID from the RESOURCE_ID in the url
    params.push(request.params.resource_id[0]);
    //If there is a SUB_RESOURCE_ID perform the following:
    if (request.params.sub_resource_id) {
        if (request.params.sub_resource_id.length !== 1) {
            throw new ClientError(409, "Incorrect URL: Missing or extra sub resource in URL use ADDRESS TYPE")
        }
        if (!isValidAddressType(request.params.sub_resource_id[0])) {
            throw new ClientError(409, "Invalid URL: address_type is not MAL, WRK, RES, or PRM")
        }
        //grab the getAddress SQL from SQL.JS
        sql_query = sql.sql.getAddress;
        //add ADDRESS_TYPE to parameters for SQL query from SUB_RESOURCE_ID first array slot
        params.unshift(request.params.sub_resource_id[0])
    }
    //execute the SQL_QUERY selected based off of IF statements using PARAMS array values
    return connection["ces"].execute(sql_query, params)
        .then(function (results) {
            if (results.rows.length === 0) {
                throw new ClientError(404, "BYU_ID not found in person table")
            }
            if (results.rows[0].restricted === 'Y' && !inArray('person_restricted', request.params.auth)) {
                throw new ClientError(404, 'BYU_ID not found in person table')
            }
            delete def.metadata.default_db;
            if (inArray("person_view_contact", request.params.auth)) {
                def.metadata.validation_response.return_code = 200;
                if (!results.rows[0].address_type && !request.params.sub_resource_id) {
                    def.metadata.collection_size = 0;
                    def.values.pop();
                    return def
                }
                if (!results.rows[0].address_type && request.params.sub_resource_id) {
                    throw new ClientError(404, request.params.sub_resource_id[0] + " address not found")
                }
                //fill in the METADATA of the DEF.JSON
                def.metadata.collection_size = results.rows.length;
                //process the data and fill in the DEF.JSON values and descriptions
                def.values = core.sqlmap.map_rows(results.rows, def.values[0], sql.sql.map);
                //updated the HATEOAS links
                core.sqlmap.map_results(results.rows, def, sql.sql.map, function (item) {
                    links_map.address_type = item.address_type.value;
                    core.updateHATEOASData(item.links, links_map)
                });
                var length = def.values.length;
                for (var i = 0; i < length; i++) {
                    def.values[i].date_time_updated["value"] = moment(results.rows[i].date_time_updated)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
                    def.values[i].date_time_created["value"] = moment(results.rows[i].date_time_created)["format"]("YYYY-MM-DD HH:mm:ss.SSS")
                }
                return def
            }
            else {
                // Keep WRK address for public directory
                var work_address = [];
                for (var x = results.rows.length; x--;) {
                    if (results.rows[x].address_type === "WRK") {
                        work_address.push(results.rows[x])
                    }
                }
                results.rows = work_address;
                //if the query was good but no records exist return an empty object
                if (results.rows[0] &&
                    !results.rows[0].address_type &&
                    !request.params.sub_resource_id) {
                    def.metadata.validation_response.return_code = 200;
                    def.values.pop();
                    return def
                }
                if (results.rows[0] &&
                    !results.rows[0].address_type &&
                    request.params.sub_resource_id) {
                    throw new ClientError(404, request.params.sub_resource_id[0] + " address not found")
                }
                if (results.rows[0] &&
                    ((results.rows[0]["primary_role"] === "Employee") ||
                    (results.rows[0]["primary_role"] === "Faculty"))) {
                    //process the data and fill in the DEF.JSON values and descriptions
                    def.values = core.sqlmap.map_rows(results.rows, def.values[0], sql.sql.public_map);
                    //updated the HATEOAS links
                    core.sqlmap.map_results(results.rows, def, sql.sql.map, function (item) {
                        links_map.address_type = item.address_type.value;
                        core.updateHATEOASData(item.links, links_map)
                    });
                    for (i = def.values.length; i--;) {
                        if (def.values[i].unlisted.value === "Y") {
                            def.values[i].pop();
                            def.values[i] = "Address Unlisted"
                        }
                    }
                    def.metadata.collection_size = results.rows.length;
                    def.metadata.validation_response.return_code = 203;
                    def.metadata.validation_response.response = "User authorized to view PUBLIC DIRECTORY info only";
                    return def
                }
                else {
                    throw new ClientError(403, "User authorized to view PUBLIC DIRECTORY info only")
                }
            }
        })
};

exports.put = function (connection, resources, request) {
    byu_id = request.params.resource_id[0];
    address_type = request.params.sub_resource_id[0];
    address_line_1 = request.body.address_line_1;
    address_line_2 = (request.body.address_line_2) ? request.body.address_line_2 : " ";
    address_line_3 = (request.body.address_line_3) ? request.body.address_line_3 : " ";
    address_line_4 = (request.body.address_line_4) ? request.body.address_line_4 : " ";
    country_code = (request.body.country_code) ? request.body.country_code : "???";
    room = (request.body.room) ? request.body.room : " ";
    building = (request.body.building) ? request.body.building : " ";
    city = (request.body.city) ? request.body.city : " ";
    state_code = (request.body.state_code) ? request.body.state_code : "??";
    postal_code = (request.body.postal_code) ? request.body.postal_code : " ";
    verified_flag = (request.body.verified_flag && request.body.verified_flag === "Y") ? "Y" : "N";
    if (postal_code) {
        postal_code.trim()
    }
    unlisted = (request.body.unlisted && request.body.unlisted === "Y") ? "Y" : "N";
    current_date_time = moment();
    updated_by_id = (!request.body.updated_by_id || (request.body.updated_by_id === " ")) ? request.verifiedJWTs.authorized_byu_id : request.body.updated_by_id;
    date_time_updated = (!request.body.date_time_updated || (request.body.date_time_updated === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](request.body.date_time_updated, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
    created_by_id = (!request.body.created_by_id || (request.body.created_by_id === " ")) ? request.verifiedJWTs.authorized_byu_id : request.body.created_by_id;
    date_time_created = (!request.body.date_time_created || (request.body.date_time_created === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](request.body.date_time_created, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
    var log_params = [];

    if (!isValidAddressType(address_type)) {
        throw new ClientError(409, "Invalid URL: address_type is not MAL, WRK, RES, or PRM")
    }

    var error = false;
    var msg = "Incorrect BODY: Missing\n";
    address_elements.forEach(function (item) {
        if (request.body[item] === undefined) {
            if (item === "verified_flag") {
                msg += "\n\"" + item + "\": \" \"\n"
            }
            else {
                msg += "\n\"" + item + "\": \" \","
            }
            error = true
        }
        else if (request.body[item] === "") {
            request.body[item] = " "
        }
    });
    if (!isValidCountryCode(country_code)) {
        msg += "\n\tInvalid Country Code if unknown use, ???";
        error = true
    }
    if (!isValidName(city)) {
        msg += "\n\tCity must have at least one capital letter and Nothing beside '-', space or letters.";
        error = true
    }
    if (!isValidStateCode(state_code, country_code)) {
        msg += "\n\tInvalid State Code if unknown use, ??";
        error = true
    }
    switch (country_code) {
        case "USA":
        case "CAN":
            if (!isValidPostalCode(postal_code, country_code)) {
                msg += "\n\tInvalid Postal Code";
                error = true
            }
            break;
        default:
            break
    }

    if (!isValidBuildingCode(building)) {
        msg += "\n\tInvalid Building Code";
        error = true
    }
    if (!isYesOrNo(unlisted)) {
        msg += "\n\tUnlisted must be set to 'Y' or 'N'";
        error = true
    }
    if (!isYesOrNo(verified_flag)) {
        msg += "\n\tverified_flag must be set to 'Y' or 'N'"
    }
    if (error) {
        throw new ClientError(409, msg)
    }
    if (!inArray("person_update_contact", request.params.auth)) {
        throw new ClientError(403, "User not authorized to update CONTACT data")
    }

    var sql_query = sql.sql.fromAddress;
    var params = [
        address_type,
        byu_id
    ];
    return connection["ces"].execute(sql_query, params)
        .then(function (results) {
            if (results.rows.length === 0) {
                throw new ClientError(404, "Could not find BYU_ID in Person Table")
            }
            person_id = (results.rows[0].person_id) ? results.rows[0].person_id : " ";
            net_id = (results.rows[0].net_id) ? results.rows[0].net_id : " ";
            employee_type = (results.rows[0].employee_type && results.rows[0].employee_type !== "--") ? results.rows[0].employee_type : "Not An Employee";
            student_status = results.rows[0].student_status;
            restricted = (results.rows[0].restricted && results.rows[0].restricted === "Y") ? "Y" : "N";
            created_by_id = (results.rows[0].created_by_id) ? results.rows[0].created_by_id : created_by_id;
            date_time_created = (results.rows[0].date_time_created) ? moment(results.rows[0].date_time_created, accepted_date_formats)["format"]("YYYY-MM-DD HH:mm:ss.SSS") : date_time_created;

            change_type = (!results.rows[0].address_type) ? "A" : "C";
            from_address_line_1 = (results.rows[0].address_line_1) ? results.rows[0].address_line_1 : " ";
            from_address_line_2 = (results.rows[0].address_line_2) ? results.rows[0].address_line_2 : " ";
            from_address_line_3 = (results.rows[0].address_line_3) ? results.rows[0].address_line_3 : " ";
            from_address_line_4 = (results.rows[0].address_line_4) ? results.rows[0].address_line_4 : " ";
            from_country_code = (results.rows[0].country_code) ? results.rows[0].country_code : " ";
            from_room = (results.rows[0].room) ? results.rows[0].room : " ";
            from_building = (results.rows[0].building) ? results.rows[0].building : " ";
            from_city = (results.rows[0].city) ? results.rows[0].city : " ";
            from_state_code = (results.rows[0].state_code) ? results.rows[0].state_code : " ";
            from_postal_code = (results.rows[0].postal_code) ? results.rows[0].postal_code : " ";
            from_unlisted = (results.rows[0].unlisted) ? results.rows[0].unlisted : " ";
            from_verified_flag = (results.rows[0].verified_flag) ? results.rows[0].verified_flag : " ";

            log_params = [
                change_type,
                byu_id,
                address_type,
                date_time_updated,
                updated_by_id,
                date_time_created,
                created_by_id,
                from_address_line_1,
                from_address_line_2,
                from_address_line_3,
                from_address_line_4,
                from_country_code,
                from_room,
                from_building,
                from_city,
                from_state_code,
                from_postal_code,
                from_unlisted,
                from_verified_flag,
                address_line_1,
                address_line_2,
                address_line_3,
                address_line_4,
                country_code,
                room,
                building,
                city,
                state_code,
                postal_code,
                unlisted,
                verified_flag
            ];

            var is_different = false;
            if ((address_line_1 !== from_address_line_1) ||
                (address_line_2 !== from_address_line_2) ||
                (address_line_3 !== from_address_line_3) ||
                (address_line_4 !== from_address_line_4) ||
                (country_code !== from_country_code) ||
                (room !== from_room) ||
                (building !== from_building) ||
                (city !== from_city) ||
                (state_code !== from_state_code) ||
                (postal_code !== from_postal_code) ||
                (unlisted !== from_unlisted)) {
                is_different = true
            }

            if (is_different && !results.rows[0].address_type) {
                sql_query = sql.modifyAddress.create;
                params = [
                    byu_id,
                    address_type,
                    date_time_updated,
                    updated_by_id,
                    date_time_created,
                    created_by_id,
                    address_line_1,
                    address_line_2,
                    address_line_3,
                    address_line_4,
                    country_code,
                    room,
                    building,
                    city,
                    state_code,
                    postal_code,
                    unlisted,
                    verified_flag
                ];
                return connection["ces"].executeWithCommit(sql_query, params)
            }
            else if (is_different && results.rows[0].address_type) {
                sql_query = sql.modifyAddress.update;
                params = [
                    date_time_updated,
                    updated_by_id,
                    address_line_1,
                    address_line_2,
                    address_line_3,
                    address_line_4,
                    country_code,
                    room,
                    building,
                    city,
                    state_code,
                    postal_code,
                    unlisted,
                    verified_flag,
                    byu_id,
                    address_type
                ];
                return connection["ces"].executeWithCommit(sql_query, params)
            }
        })
        .then(function () {
            sql_query = sql.modifyAddress.logChange;
            return connection["ces"].executeWithCommit(sql_query, log_params)
        })
        .then(function () {
            return addressEvents(connection)
        })
        .then(function () {
            return exports.get(connection, resources, request)
        })
};

exports.delete = function (connection, resources, request) {
    if (!isValidAddressType(request.params.sub_resource_id[0])) {
        throw new ClientError(409, "Invalid URL: address_type is not MAL, WRK, RES, or PRM")
    }
    if (!inArray("person_update_contact", request.params.auth)) {
        throw new ClientError(403, "User not authorized to update CONTACT data")
    }
    byu_id = request.params.resource_id[0];
    address_type = request.params.sub_resource_id[0];
    date_time_updated = moment()["tz"]("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
    updated_by_id = request.verifiedJWTs.authorized_byu_id;
    change_type = "D";

    var sql_query = sql.sql.fromAddress;
    var params = [
        address_type,
        byu_id
    ];
    return connection["ces"].execute(sql_query, params)
        .then(function (results) {
            if (results.rows.length === 0) {
                throw new ClientError(404, "Could not find BYU_ID in Person Table")
            }
            if (!results.rows[0].address_type) {
                throw new ClientError(204, "")
            }
            person_id = (results.rows[0].person_id) ? results.rows[0].person_id : " ";
            net_id = (results.rows[0].net_id) ? results.rows[0].net_id : " ";
            employee_type = (results.rows[0].employee_type && results.rows[0].employee_type === "--") ? results.rows[0].employee_type : "Not An Employee";
            student_status = results.rows[0].student_status;
            restricted = (results.rows[0].restricted && results.rows[0].restricted === "Y") ? "Y" : "N";

            date_time_created = moment(results.rows[0].date_time_created, accepted_date_formats)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
            created_by_id = results.rows[0].created_by_id;
            from_address_line_1 = (results.rows[0].address_line_1) ? results.rows[0].address_line_1 : " ";
            from_address_line_2 = (results.rows[0].address_line_2) ? results.rows[0].address_line_2 : " ";
            from_address_line_3 = (results.rows[0].address_line_3) ? results.rows[0].address_line_3 : " ";
            from_address_line_4 = (results.rows[0].address_line_4) ? results.rows[0].address_line_4 : " ";
            from_country_code = (results.rows[0].country_code) ? results.rows[0].country_code : " ";
            from_room = (results.rows[0].room) ? results.rows[0].room : " ";
            from_building = (results.rows[0].building) ? results.rows[0].building : " ";
            from_city = (results.rows[0].city) ? results.rows[0].city : " ";
            from_state_code = (results.rows[0].state_code) ? results.rows[0].state_code : " ";
            from_postal_code = (results.rows[0].postal_code) ? results.rows[0].postal_code : " ";
            from_unlisted = (results.rows[0].unlisted) ? results.rows[0].unlisted : " ";
            from_verified_flag = (results.rows[0].verified_flag) ? results.rows[0].verified_flag : " ";
            address_line_1 = " ";
            address_line_2 = " ";
            address_line_3 = " ";
            address_line_4 = " ";
            country_code = " ";
            room = " ";
            building = " ";
            city = " ";
            state_code = " ";
            postal_code = " ";
            unlisted = " ";
            verified_flag = " ";

            var log_params = [
                change_type,
                byu_id,
                address_type,
                date_time_updated,
                updated_by_id,
                date_time_created,
                created_by_id,
                from_address_line_1,
                from_address_line_2,
                from_address_line_3,
                from_address_line_4,
                from_country_code,
                from_room,
                from_building,
                from_city,
                from_state_code,
                from_postal_code,
                from_unlisted,
                from_verified_flag,
                address_line_1,
                address_line_2,
                address_line_3,
                address_line_4,
                country_code,
                room,
                building,
                city,
                state_code,
                postal_code,
                unlisted,
                verified_flag
            ];

            sql_query = sql.modifyAddress.delete;
            return connection["ces"].executeWithCommit(sql_query, params)
                .then(function () {
                    sql_query = sql.modifyAddress.logChange;
                    return connection["ces"].executeWithCommit(sql_query, log_params)
                })
                .then(function () {
                    return addressDeletedEvents(connection)
                })
        })
        .then(function () {
            return ""
        })
};

function addressEvents(connection) {
    var source_dt = moment()['tz']("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
    var event_type = (change_type === "A") ? "Address Added" : "Address Changed";
    var event_type2 = (change_type === "A") ? "Address Added v2" : "Address Changed v2";
    var domain = "edu.byu";
    var entity = "BYU-IAM";
    var filters = [];
    var address_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id + "/addresses/" + address_type;
    var secure_url = "https://api.byu.edu/domains/legacy/identity/secureurl/v1/";
    var sql_query = "";
    var params = [];
    var event_frame = {
        "events": {
            "event": []
        }
    };
    var header = [
        "domain",
        domain,
        "entity",
        entity,
        "event_type",
        event_type,
        "source_dt",
        source_dt,
        "event_dt",
        " ",
        "event_id",
        " "
    ];
    if (restricted !== "Y" && unlisted === "N") {
        var body = [
            "person_id",
            person_id,
            "byu_id",
            byu_id,
            "net_id",
            net_id,
            "address_type",
            address_type,
            "address_line_1",
            address_line_1,
            "address_line_2",
            address_line_2,
            "address_line_3",
            address_line_3,
            "address_line_4",
            address_line_4,
            "country_code",
            country_code,
            "city",
            city,
            "state_code",
            state_code,
            "postal_code",
            postal_code,
            "campus_address_f",
            building,
            "unlisted",
            unlisted,
            "updated_by_id",
            updated_by_id,
            "date_time_updated",
            date_time_updated,
            "created_by_id",
            created_by_id,
            "date_time_created",
            date_time_created,
            "callback_url",
            address_url
        ];
        var event = eventBuilder.eventBuilder(header, body);
        event_frame.events.event.push(event);

        header[5] = event_type2;
        body.push("verified_flag");
        body.push(verified_flag);
        filters.push("identity_type");
        filters.push(identity_type);
        filters.push("employee_type");
        filters.push(employee_type);
        filters.push("student_status");
        filters.push(student_status);
        event = eventBuilder.eventBuilder(header, body, filters);
        event_frame.events.event.push(event);

        sql_query = sql.eventPersonAddress.raiseEvent;
        params.push(JSON.stringify(event_frame));
        return connection["ces"].executeWithCommit(sql_query, params)
          .then(function(){
            sql_query = sql.enqueue.sql;
            return connection["ces"].execute(sql_query, params)
          })
    }
    else {
        sql_query = sql.intermediaryId.get;
        params = [address_url];
        return connection["ces"].execute(sql_query, params)
            .then(function (results) {
                if (results.rows.length === 0) {
                    sql_query = sql.intermediaryId.put;
                    params = [
                        address_url,
                        " ",    // actor
                        " ",    // group_id
                        created_by_id
                    ];
                    return connection["ces"].executeWithCommit(sql_query, params)
                        .then(function () {
                            sql_query = sql.intermediaryId.get;
                            params = [address_url];
                            return connection["ces"].execute(sql_query, params)
                                .then(function (results) {
                                    secure_url += results.rows[0]["intermediary_id"]
                                })
                        })
                }
                else {
                    secure_url += results.rows[0]["intermediary_id"]
                }
                var restricted_body = [
                    "person_id",
                    " ",
                    "byu_id",
                    " ",
                    "net_id",
                    " ",
                    "address_type",
                    " ",
                    "address_line_1",
                    " ",
                    "address_line_2",
                    " ",
                    "address_line_3",
                    " ",
                    "address_line_4",
                    " ",
                    "country_code",
                    " ",
                    "city",
                    " ",
                    "state_code",
                    " ",
                    "postal_code",
                    " ",
                    "campus_address_f",
                    " ",
                    "unlisted",
                    unlisted,
                    "updated_by_id",
                    " ",
                    "date_time_updated",
                    " ",
                    "created_by_id",
                    " ",
                    "date_time_created",
                    " ",
                    "secure_url",
                    secure_url
                ];
                event = eventBuilder.eventBuilder(header, restricted_body);
                event_frame.events.event.push(event);

                header[5] = event_type2;
                restricted_body.push("verified_flag");
                restricted_body.push(" ");
                filters.push("restricted");
                filters.push(restricted);
                event = eventBuilder.eventBuilder(header, restricted_body, filters);
                event_frame.events.event.push(event);

                sql_query = sql.eventPersonAddress.raiseEvent;
                params = [JSON.stringify(event_frame)];
                return connection["ces"].executeWithCommit(sql_query, params)
                  .then(function(){
                    sql_query = sql.enqueue.sql;
                    return connection["ces"].execute(sql_query, params)
                  })
            })
    }
}

function addressDeletedEvents(connection) {
    var source_dt = moment()["tz"]("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
    var event_type = "Address Deleted";
    var event_type2 = "Address Deleted v2";
    var domain = "edu.byu";
    var entity = "BYU-IAM";
    var filters = [];
    var address_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id + "/addresses/" + address_type;
    var secure_url = "https://api.byu.edu/domains/legacy/identity/secureurl/v1/";
    var event_frame = {
        "events": {
            "event": []
        }
    };
    var header = [
        "domain",
        domain,
        "entity",
        entity,
        "event_type",
        event_type,
        "source_dt",
        source_dt,
        "event_dt",
        " ",
        "event_id",
        " "
    ];

    if (restricted !== "Y" && unlisted === "N") {
        var body = [
            "person_id",
            person_id,
            "byu_id",
            byu_id,
            "net_id",
            net_id,
            "address_type",
            address_type,
            "callback_url",
            address_url
        ];
        var event = eventBuilder.eventBuilder(header, body);
        event_frame.events.event.push(event);

        header[5] = event_type2;
        filters = [
            "identity_type",
            identity_type,
            "employee_type",
            employee_type,
            "student_status",
            student_status
        ];
        event = eventBuilder.eventBuilder(header, body, filters);
        event_frame.events.event.push(event);

        var sql_query = sql.eventPersonAddress.raiseEvent;
        var params = [JSON.stringify(event_frame)];
        return connection["ces"].executeWithCommit(sql_query, params)
          .then(function(){
            sql_query = sql.enqueue.sql;
            return connection["ces"].execute(sql_query, params)
          })
    }
    else {
        sql_query = sql.intermediaryId.get;
        params = [address_url];
        return connection["ces"].execute(sql_query, params)
            .then(function (results) {
                if (results.rows.length === 0) {
                    sql_query = sql.intermediaryId.put;
                    params = [
                        address_url,
                        " ",    // actor
                        " ",    // group_id
                        created_by_id
                    ];
                    return connection["ces"].executeWithCommit(sql_query, params)
                        .then(function () {
                            sql_query = sql.intermediaryId.get;
                            params = [address_url];
                            return connection["ces"].execute(sql_query, params)
                                .then(function (results) {
                                    secure_url += results.rows[0]["intermediary_id"]
                                })
                        })
                }
                else {
                    secure_url += results.rows[0]["intermediary_id"]
                }
                var restricted_body = [
                    "person_id",
                    " ",
                    "byu_id",
                    " ",
                    "net_id",
                    " ",
                    "address_type",
                    " ",
                    "secure_url",
                    secure_url
                ];
                event = eventBuilder.eventBuilder(header, restricted_body);
                event_frame.events.event.push(event);

                header[5] = event_type2;
                restricted_body.push("verified_flag");
                restricted_body.push(" ");
                filters.push("restricted");
                filters.push(restricted);
                event = eventBuilder.eventBuilder(header, restricted_body, filters);
                event_frame.events.event.push(event);

                sql_query = sql.eventPersonAddress.raiseEvent;
                params = [JSON.stringify(event_frame)];
                return connection["ces"].executeWithCommit(sql_query, params)
                  .then(function(){
                    sql_query = sql.enqueue.sql;
                    return connection["ces"].execute(sql_query, params)
                  })
            })
    }
}