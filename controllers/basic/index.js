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
var primary_role = " ";
var date_time_updated = "";
var updated_by_id = " ";
var date_time_created = "";
var created_by_id = " ";
var from_date_of_birth = "";
var from_deceased = " ";
var from_date_of_death = "";
var from_sex = " ";
var from_marital_status = " ";
var from_religion_code = " ";
var from_lds_unit_number = " ";
var from_citizenship_country_code = " ";
var from_birth_country_code = " ";
var from_home_town = " ";
var from_home_state_code = " ";
var from_home_country_code = " ";
var from_high_school_code = " ";
var from_restricted = " ";
var from_ssn = " ";
var from_ssn_verification_date = "";
var from_visa_type = " ";
var from_i20_expiration_date = "";
var from_visa_type_source = " ";
var from_lds_confirmation_date = "";
var date_of_birth = "";
var deceased = " ";
var date_of_death = "";
var sex = " ";
var marital_status = " ";
var religion_code = " ";
var lds_unit_number = " ";
var citizenship_country_code = " ";
var birth_country_code = " ";
var home_town = " ";
var home_state_code = " ";
var home_country_code = " ";
var high_school_code = " ";
var restricted = " ";
var ssn = " ";
var ssn_verification_date = "";
var visa_type = " ";
var i20_expiration_date = "";
var visa_type_source = " ";
var lds_confirmation_date = "";
var from_surname = " ";
var from_rest_of_name = " ";
var from_suffix = " ";
var from_preferred_first_name = " ";
var from_preferred_surname = " ";
var from_preferred_name = " ";
var from_sort_name = " ";
var from_first_name = " ";
var from_middle_name = " ";
var surname = " ";
var rest_of_name = " ";
var suffix = " ";
var preferred_first_name = " ";
var preferred_surname = " ";
var preferred_name = " ";
var sort_name = " ";
var first_name = " ";
var middle_name = " ";
var name_fnf = " ";
var display_name = " ";
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
var basic_elements = [
    "sex",
    "restricted",
    "first_name",
    "middle_name",
    "surname",
    "suffix",
    "preferred_first_name",
    "preferred_surname",
    "home_town",
    "home_state_code",
    "home_country_code",
    "high_school_code"
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

function isValidHighSchoolCode(high_school_code) {
    if (high_school_code && high_school_code.match(/^( |[0-9]{6})$/)) {
        var highSchoolCode = require("../../meta/high_schools/highSchoolCodes.json");
        var high_school_codes = highSchoolCode.items;

        for (var i = high_school_codes.length; i--;) {
            if (high_school_code === high_school_codes[i].high_school_code) {
                return true
            }
        }
    }
    return false
}

function isValidName(name) {
    return (name && name.match(/^(?=.*?[A-Z])([A-Za-z-]+ )*?[A-Za-z-]+$/))
}

function isValidSuffix(suffix) {
    return (suffix && (suffix.length < 11) &&
    suffix.match(/^( |Sr|SR|JR|Jr|M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3}))$/))
}

//Performs the GET method
exports.get = function (connection, resources, request) {
    //Declare variables
    var params = [];
    //identify DEF.JSON file to be filled
    var def = resources.sub_resource_definitions.basic;
    var sql_query = sql.sql.getPerson;

    //updates the URL to reflect the requested BYU_ID
    var links_map = {
        byu_id: request.params.resource_id[0]
    };
    core.updateHATEOASData(def.links, links_map);

    //add BYU_ID from the RESOURCE_ID in the url
    params.push(request.params.resource_id[0]);
    return connection["ces"].execute(sql_query, params)
        .then(function (results) {
            if (results.rows.length === 0) {
                throw new ClientError(404, 'BYU_ID not found in person')
            }
            if (results.rows[0].restricted === 'Y' && !inArray('person_restricted', request.params.auth)) {
                throw new ClientError(404, 'BYU_ID not found in person')
            }
            delete def.metadata['default_db'];
            if (inArray("person_view_basic", request.params.auth)) {
                //fill in the METADATA of the DEF.JSON
                def.metadata.collection_size = results.rows.length;
                //process the data and fill in the DEF.JSON values and descriptions
                def = core.sqlmap.map_row(results.rows[0], def, sql.sql.map);
                def.metadata.validation_response.return_code = 200;
                def.date_time_updated.value = moment(results.rows[0].date_time_updated)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
                def.date_time_created.value = moment(results.rows[0].date_time_created)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
                //display the DEF.JSON filled out
                //def = basic.def
                return def
            }
            else {

                if (results.rows.length === 0) {
                    throw new ClientError(404, "BYU_ID not found in person")
                }
                var primary_role = results.rows[0]["primary_role"];
                if (primary_role === "Student") {
                    def = core.sqlmap.map_row(results.rows[0], def, sql.sql.public_map_student)
                }
                else if (primary_role === "Employee" ||
                    primary_role === "Faculty") {
                    def = core.sqlmap.map_row(results.rows[0], def, sql.sql.public_map_employee)
                }
                else {
                    throw new ClientError(403, "User authorized to view PUBLIC DIRECTORY info only")
                }
                def.metadata.collection_size = results.rows.length;
                def.metadata.validation_response.return_code = 203;
                def.metadata.validation_response.response = "User authorized to view PUBLIC DIRECTORY info only";
                return def
            }
        })
};

exports.put = function (connection, resources, request) {
    byu_id = request.params.resource_id[0];
    sex = (request.body.sex && (request.body.sex === "M" || request.body.sex === "F")) ? request.body.sex : "?";
    surname = request.body.surname;
    first_name = request.body.first_name;
    preferred_surname = (request.body.preferred_surname) ? request.body.preferred_surname : request.body.surname;
    preferred_first_name = (request.body.preferred_first_name) ? request.body.preferred_first_name : request.body.first_name;
    preferred_name = preferred_first_name + " " + preferred_surname;
    middle_name = (request.body.middle_name) ? request.body.middle_name : " ";
    suffix = (request.body.suffix) ? request.body.suffix : " ";
    home_town = (request.body.home_town) ? request.body.home_town : " ";
    home_state_code = (request.body.home_state_code) ? request.body.home_state_code : "??";
    home_country_code = (request.body.home_country_code) ? request.body.home_country_code : "???";
    high_school_code = (request.body.high_school_code) ? request.body.high_school_code : " ";
    rest_of_name = (middle_name === " ") ? first_name : first_name + " " + middle_name;
    sort_name = surname + ", " + rest_of_name;
    restricted = (request.body.restricted && request.body.restricted === "Y") ? "Y" : "N";
    current_date_time = moment();
    updated_by_id = (!request.body.updated_by_id || (request.body.updated_by_id === " ")) ? request.verifiedJWTs.authorized_byu_id : request.body.updated_by_id;
    date_time_updated = (!request.body.date_time_updated || (request.body.date_time_updated === " ")) ? current_date_time["clone"]().tz("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS") : moment["tz"](request.body.date_time_updated, accepted_date_formats, "America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
    var log_name_params = [];
    var log_personal_params = [];

    var error = false;
    var msg = "Incorrect BODY: Missing ";
    basic_elements.forEach(function (item) {
        if (request.body[item] === undefined) {
            if (item === "high_school_code") {
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
    basic_elements.forEach(function (item) {
        switch (item) {
            case "first_name":
            case "surname":
            case "preferred_first_name":
            case "preferred_surname":
                if (!isValidName(request.body[item])) {
                    msg += "\n\tNames must have at least one capital letter and Nothing beside '-', space or letters.";
                    error = true
                }
                break;
            case "middle_name":
            case "home_town":
                if (request.body[item] !== " ") {
                    if (!isValidName(request.body[item])) {
                        msg += "\n\tNames must have at least one capital letter and Nothing beside '-', space or letters.";
                        error = true
                    }
                }
                break;
            default:
                break
        }
    });
    if (!isValidSuffix(suffix)) {
        msg += "\n\tInvalid Suffix: Must be a space, roman numeral(No more than 10 characters long), SR, Sr, JR, or Jr";
        error = true
    }
    if (!isValidCountryCode(home_country_code)) {
        msg += "\n\tInvalid Country Code if unknown use, ???";
        error = true
    }
    if (!isValidStateCode(home_state_code, home_country_code)) {
        msg += "\n\tInvalid State Code if unknown use, ??";
        error = true
    }
    if (!isValidHighSchoolCode(high_school_code)) {
        msg += "\n\tIncorrect High School Code if you don't have one use, single space";
        error = true
    }
    if (error) {
        throw new ClientError(409, msg)
    }
    if (!inArray("person_update_basic", request.params.auth)) {
        throw new ClientError(403, "User not authorized to update PERSON data")
    }

    var sql_query = sql.sql.fromPerson;
    var params = [
        byu_id
    ];
    return connection["ces"].execute(sql_query, params)
        .then(function (results) {
            if (results.rows.length === 0) {
                throw new ClientError(404, "Could not find BYU_ID in Person Table")
            }
            if (results.rows[0].merge_in_process === "Y") {
                throw new ClientError(403, "User is not authorized to change a Person who is in process of being merged")
            }
            person_id = (results.rows[0].person_id) ? results.rows[0].person_id : " ";
            net_id = (results.rows[0].net_id) ? results.rows[0].net_id : " ";
            employee_type = (results.rows[0].employee_type && results.rows[0].employee_type !== "--") ? results.rows[0].employee_type : "Not An Employee";
            student_status = results.rows[0].student_status;
            primary_role = results.rows[0]["primary_role"];
            display_name = preferred_name;
            name_fnf = (results.rows[0].name_fnf) ? results.rows[0].name_fnf : " ";
            created_by_id = (results.rows[0].created_by_id) ? results.rows[0].created_by_id : created_by_id;
            date_time_created = (results.rows[0].date_time_created) ? moment(results.rows[0].date_time_created, accepted_date_formats)["format"]("YYYY-MM-DD HH:mm:ss.SSS") : "";

            change_type = "C";
            from_date_of_birth = (results.rows[0].date_of_birth) ? moment(results.rows[0].date_of_birth, accepted_date_formats)["format"]("YYYY-MM-DD") : "";
            from_deceased = (results.rows[0].deceased) ? results.rows[0].deceased : " ";
            from_date_of_death = (results.rows[0].date_of_death) ? moment(results.rows[0].date_of_death, accepted_date_formats)["format"]("YYYY-MM-DD") : "";
            from_sex = (results.rows[0].sex) ? results.rows[0].sex : " ";
            from_marital_status = (results.rows[0].marital_status) ? results.rows[0].marital_status : " ";
            from_religion_code = (results.rows[0].religion_code) ? results.rows[0].religion_code : " ";
            from_lds_unit_number = (results.rows[0].lds_unit_number) ? results.rows[0].lds_unit_number : " ";
            from_citizenship_country_code = (results.rows[0].citizenship_country_code) ? results.rows[0].citizenship_country_code : " ";
            from_birth_country_code = (results.rows[0].birth_country_code) ? results.rows[0].birth_country_code : " ";
            from_home_town = (results.rows[0].home_town) ? results.rows[0].home_town : " ";
            from_home_state_code = (results.rows[0].home_state_code) ? results.rows[0].home_state_code : " ";
            from_home_country_code = (results.rows[0].home_country_code) ? results.rows[0].home_country_code : " ";
            from_high_school_code = (results.rows[0].high_school_code) ? results.rows[0].high_school_code : " ";
            from_restricted = (results.rows[0].restricted) ? results.rows[0].restricted : " ";
            from_ssn = (results.rows[0].ssn) ? results.rows[0].ssn : " ";
            from_ssn_verification_date = (results.rows[0].ssn_verification_date) ? moment(results.rows[0].ssn_verification_date, accepted_date_formats)["format"]("YYYY-MM-DD") : "";
            from_visa_type = (results.rows[0].visa_type) ? results.rows[0].visa_type : " ";
            from_i20_expiration_date = (results.rows[0].i20_expiration_date) ? moment(results.rows[0].i20_expiration_date, accepted_date_formats)["format"]("YYYY-MM-DD") : "";
            from_visa_type_source = (results.rows[0].visa_type_source) ? results.rows[0].visa_type_source : " ";
            from_lds_confirmation_date = (results.rows[0].lds_confirmation_date) ? moment(results.rows[0].lds_confirmation_date, accepted_date_formats)["format"]("YYYY-MM-DD") : "";
            date_of_birth = (results.rows[0].date_of_birth) ? moment(results.rows[0].date_of_birth, accepted_date_formats)["format"]("YYYY-MM-DD") : "";
            deceased = (results.rows[0].deceased) ? results.rows[0].deceased : " ";
            date_of_death = (results.rows[0].date_of_death) ? moment(results.rows[0].date_of_death, accepted_date_formats)["format"]("YYYY-MM-DD") : "";
            marital_status = (results.rows[0].marital_status) ? results.rows[0].marital_status : " ";
            religion_code = (results.rows[0].religion_code) ? results.rows[0].religion_code : " ";
            lds_unit_number = (results.rows[0].lds_unit_number) ? results.rows[0].lds_unit_number : " ";
            citizenship_country_code = (results.rows[0].citizenship_country_code) ? results.rows[0].citizenship_country_code : " ";
            birth_country_code = (results.rows[0].birth_country_code) ? results.rows[0].birth_country_code : " ";
            ssn = (results.rows[0].ssn) ? results.rows[0].ssn : " ";
            ssn_verification_date = (results.rows[0].ssn_verification_date) ? moment(results.rows[0].ssn_verification_date, accepted_date_formats)["format"]("YYYY-MM-DD") : "";
            visa_type = (results.rows[0].visa_type) ? results.rows[0].visa_type : " ";
            i20_expiration_date = (results.rows[0].i20_expiration_date) ? moment(results.rows[0].i20_expiration_date, accepted_date_formats)["format"]("YYYY-MM-DD") : "";
            visa_type_source = (results.rows[0].visa_type_source) ? results.rows[0].visa_type_source : " ";
            lds_confirmation_date = (results.rows[0].lds_confirmation_date) ? moment(results.rows[0].lds_confirmation_date, accepted_date_formats)["format"]("YYYY-MM-DD") : "";
            from_surname = (results.rows[0].surname) ? results.rows[0].surname : " ";
            from_rest_of_name = (results.rows[0].rest_of_name) ? results.rows[0].rest_of_name : " ";
            from_suffix = (results.rows[0].suffix) ? results.rows[0].suffix : " ";
            from_preferred_first_name = (results.rows[0].preferred_first_name) ? results.rows[0].preferred_first_name : " ";
            from_preferred_surname = (results.rows[0].preferred_surname) ? results.rows[0].preferred_surname : " ";
            from_preferred_name = (results.rows[0].preferred_name) ? results.rows[0].preferred_name : " ";
            from_sort_name = (results.rows[0].sort_name) ? results.rows[0].sort_name : " ";
            from_first_name = (results.rows[0].first_name) ? results.rows[0].first_name : " ";
            from_middle_name = (results.rows[0].middle_name) ? results.rows[0].middle_name : " ";

            log_name_params = [
                change_type,
                byu_id,
                date_time_updated,
                updated_by_id,
                date_time_created,
                created_by_id,
                from_surname,
                from_rest_of_name,
                from_suffix,
                from_preferred_first_name,
                from_preferred_surname,
                from_preferred_name,
                from_sort_name,
                from_first_name,
                from_middle_name,
                surname,
                rest_of_name,
                suffix,
                preferred_first_name,
                preferred_surname,
                preferred_name,
                sort_name,
                first_name,
                middle_name
            ];
            log_personal_params = [
                change_type,
                byu_id,
                date_time_updated,
                updated_by_id,
                date_time_created,
                created_by_id,
                from_date_of_birth,
                from_deceased,
                from_date_of_death,
                from_sex,
                from_marital_status,
                from_religion_code,
                from_lds_unit_number,
                from_citizenship_country_code,
                from_birth_country_code,
                from_home_town,
                from_home_state_code,
                from_home_country_code,
                from_high_school_code,
                from_restricted,
                from_ssn,
                from_ssn_verification_date,
                from_visa_type,
                from_i20_expiration_date,
                from_visa_type_source,
                from_lds_confirmation_date,
                date_of_birth,
                deceased,
                date_of_death,
                sex,
                marital_status,
                religion_code,
                lds_unit_number,
                citizenship_country_code,
                birth_country_code,
                home_town,
                home_state_code,
                home_country_code,
                high_school_code,
                restricted,
                ssn,
                ssn_verification_date,
                visa_type,
                i20_expiration_date,
                visa_type_source,
                lds_confirmation_date
            ];

            var name_dif = false;
            var basic_dif = false;
            if ((from_surname !== surname) ||
                (from_first_name !== first_name) ||
                (from_middle_name !== middle_name)) {
                if (!inArray("person_update_name", request.params.auth)) {
                    throw new ClientError(403, "User not authorized to update name")
                }
                name_dif = true
            }
            if ((from_home_town !== home_town) ||
                (from_home_state_code !== home_state_code) ||
                (from_home_country_code !== home_country_code) ||
                (from_high_school_code !== high_school_code) ||
                (from_preferred_surname !== preferred_surname) ||
                (from_preferred_first_name !== preferred_first_name) ||
                (from_suffix !== suffix) ||
                (from_sex !== sex) ||
                (from_restricted !== restricted)) {
                if (!inArray("person_update_basic", request.params.auth)) {
                    throw new ClientError(403, "User not authorized")
                }
                basic_dif = true
            }
            if (name_dif || basic_dif) {
                sql_query = sql.modifyPerson.update;
                params = [
                    date_time_updated,
                    updated_by_id,
                    surname,
                    first_name,
                    rest_of_name,
                    preferred_surname,
                    preferred_first_name,
                    preferred_name,
                    sort_name,
                    middle_name,
                    suffix,
                    home_town,
                    home_state_code,
                    home_country_code,
                    high_school_code,
                    sex,
                    restricted,
                    byu_id
                ];
                return connection["ces"].executeWithCommit(sql_query, params)
                    .then(function () {
                        if (name_dif ||
                            (from_preferred_surname !== preferred_surname) ||
                            (from_preferred_first_name !== preferred_first_name) ||
                            (from_suffix !== suffix)) {
                            sql_query = sql.modifyPerson.logNameChange;
                            return connection["ces"].executeWithCommit(sql_query, log_name_params)
                        }
                    })
                    .then(function () {
                        if ((from_home_town !== home_town) ||
                            (from_home_state_code !== home_state_code) ||
                            (from_home_country_code !== home_country_code) ||
                            (from_high_school_code !== high_school_code) ||
                            (from_sex !== sex) ||
                            (from_restricted !== restricted)) {
                            sql_query = sql.modifyPerson.logPersonalChange;
                            return connection["ces"].executeWithCommit(sql_query, log_personal_params)
                        }
                    })
                    .then(function () {
                        return personChangedEvents(connection)
                    })
            }
        })
        .then(function () {
            return exports.get(connection, resources, request)
        })
};

exports.delete = function (connection, resources, request) {
    if (!inArray("person_delete_person", request.params.auth)) {
        throw new ClientError(403, "User not authorized to delete PERSON data")
    }
    byu_id = request.params.resource_id[0];
    date_time_updated = moment()["tz"]("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
    updated_by_id = request.verifiedJWTs.authorized_byu_id;
    change_type = "D";

    var sql_query = sql.sql.fromPerson;
    var params = [
        byu_id
    ];
    return connection["ces"].execute(sql_query, params)
        .then(function (results) {
            if (results.rows.length === 0) {
                throw new ClientError(404, "Could not find BYU_ID in Person Table")
            }
            person_id = (results.rows[0].person_id) ? results.rows[0].person_id : " ";
            net_id = (results.rows[0].net_id) ? results.rows[0].net_id : " ";
            employee_type = (results.rows[0].employee_type && results.rows[0].employee_type === "--") ? results.rows[0].employee_type : "Not An Employee";
            student_status = results.rows[0].student_status;
            restricted = (results.rows[0].restricted && results.rows[0].restricted === "Y") ? "Y" : "N";

            date_time_created = moment(results.rows[0].date_time_created, accepted_date_formats)["format"]("YYYY-MM-DD HH:mm:ss.SSS");
            created_by_id = results.rows[0].created_by_id;
            surname = " ";
            rest_of_name = " ";
            suffix = " ";
            preferred_first_name = " ";
            preferred_surname = " ";
            preferred_name = " ";
            sort_name = " ";
            first_name = " ";
            middle_name = " ";
            date_of_birth = "";
            deceased = " ";
            date_of_death = "";
            sex = " ";
            marital_status = " ";
            religion_code = " ";
            lds_unit_number = " ";
            citizenship_country_code = " ";
            birth_country_code = " ";
            home_town = " ";
            home_state_code = " ";
            home_country_code = " ";
            high_school_code = " ";
            ssn = " ";
            ssn_verification_date = "";
            visa_type = " ";
            i20_expiration_date = "";
            visa_type_source = " ";
            person_id = " ";
            lds_confirmation_date = "";
            from_surname = results.rows[0].surname;
            from_rest_of_name = results.rows[0].rest_of_name;
            from_suffix = results.rows[0].suffix;
            from_preferred_first_name = results.rows[0].preferred_first_name;
            from_preferred_surname = results.rows[0].preferred_surname;
            from_preferred_name = results.rows[0].preferred_name;
            from_sort_name = results.rows[0].sort_name;
            from_first_name = results.rows[0].first_name;
            from_middle_name = results.rows[0].middle_name;
            from_date_of_birth = (results.rows[0].date_of_birth) ? moment(results.rows[0].date_of_birth, accepted_date_formats)["format"]("YYYY-MM-DD") : "";
            from_deceased = results.rows[0].deceased;
            from_date_of_death = (results.rows[0].date_of_death) ? moment(results.rows[0].date_of_death, accepted_date_formats)["format"]("YYYY-MM-DD") : "";
            from_sex = results.rows[0].sex;
            from_marital_status = results.rows[0].marital_status;
            from_religion_code = results.rows[0].religion_code;
            from_lds_unit_number = results.rows[0].lds_unit_number;
            from_citizenship_country_code = results.rows[0].citizenship_country_code;
            from_birth_country_code = results.rows[0].birth_country_code;
            from_home_town = results.rows[0].home_town;
            from_home_state_code = results.rows[0].home_state_code;
            from_home_country_code = results.rows[0].home_country_code;
            from_high_school_code = results.rows[0].high_school_code;
            from_restricted = results.rows[0].restricted;
            from_ssn = results.rows[0].ssn;
            from_ssn_verification_date = (results.rows[0].ssn_verification_date) ? moment(results.rows[0].ssn_verification_date, accepted_date_formats)["format"]("YYYY-MM-DD") : "";
            from_visa_type = results.rows[0].visa_type;
            from_i20_expiration_date = (results.rows[0].i20_expiration_date) ? moment(results.rows[0].i20_expiration_date, accepted_date_formats)["format"]("YYYY-MM-DD") : "";
            from_visa_type_source = results.rows[0].visa_type_source;
            from_lds_confirmation_date = (results.rows[0].lds_confirmation_date) ? moment(results.rows[0].lds_confirmation_date, accepted_date_formats)["format"]("YYYY-MM-DD") : "";

            var log_name_params = [
                change_type,
                byu_id,
                date_time_updated,
                updated_by_id,
                date_time_created,
                created_by_id,
                from_surname,
                from_rest_of_name,
                from_suffix,
                from_preferred_first_name,
                from_preferred_surname,
                from_preferred_name,
                from_sort_name,
                from_first_name,
                from_middle_name,
                surname,
                rest_of_name,
                suffix,
                preferred_first_name,
                preferred_surname,
                preferred_name,
                sort_name,
                first_name,
                middle_name
            ];
            var log_personal_params = [
                change_type,
                byu_id,
                date_time_updated,
                updated_by_id,
                date_time_created,
                created_by_id,
                from_date_of_birth,
                from_deceased,
                from_date_of_death,
                from_sex,
                from_marital_status,
                from_religion_code,
                from_lds_unit_number,
                from_citizenship_country_code,
                from_birth_country_code,
                from_home_town,
                from_home_state_code,
                from_home_country_code,
                from_high_school_code,
                from_restricted,
                from_ssn,
                from_ssn_verification_date,
                from_visa_type,
                from_i20_expiration_date,
                from_visa_type_source,
                from_lds_confirmation_date,
                date_of_birth,
                deceased,
                date_of_death,
                sex,
                marital_status,
                religion_code,
                lds_unit_number,
                citizenship_country_code,
                birth_country_code,
                home_town,
                home_state_code,
                home_country_code,
                high_school_code,
                restricted,
                ssn,
                ssn_verification_date,
                visa_type,
                i20_expiration_date,
                visa_type_source,
                lds_confirmation_date
            ];

            sql_query = sql.deletePerson.sql;
            return connection["ces"].executeWithCommit(sql_query, params)
                .then(function () {
                    sql_query = sql.modifyPerson.logNameChange;
                    return connection["ces"].executeWithCommit(sql_query, log_name_params)
                })
                .then(function () {
                    sql_query = sql.modifyPerson.logPersonalChange;
                    return connection["ces"].executeWithCommit(sql_query, log_personal_params)
                })
                .then(function () {
                    return personDeletedEvents(connection)
                })
        })
        .then(function () {
            return ""
        })
};

function personChangedEvents(connection) {
    var source_dt = moment()["tz"]("America/Denver")["format"]("YYYY-MM-DD HH:mm:ss.SSS");
    var event_type = "Person Changed";
    var event_type2 = "Person Changed v2";
    var domain = "edu.byu";
    var entity = "BYU-IAM";
    var filters = [];
    var basic_url = "https://api.byu.edu/byuapi/persons/v1/" + byu_id;
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
    if (restricted === "N") {
        var body = [
            "person_id",
            person_id,
            "byu_id",
            byu_id,
            "net_id",
            net_id,
            "updated_by_id",
            updated_by_id,
            "date_time_updated",
            date_time_updated,
            "created_by_id",
            created_by_id,
            "date_time_created",
            date_time_created,
            "callback_url",
            basic_url,
            "surname",
            surname,
            "rest_of_name",
            rest_of_name,
            "first_name",
            first_name,
            "middle_name",
            middle_name,
            "suffix",
            suffix,
            "preferred_first_name",
            preferred_first_name,
            "sort_name",
            sort_name,
            "home_town",
            home_town,
            "home_state_code",
            home_state_code,
            "home_country_code",
            home_country_code,
            "deceased",
            deceased,
            "sex",
            sex,
            "display_name",
            display_name,
            "prefix",
            " ",
            "surname_position",
            " "
        ];
        var event = eventBuilder.eventBuilder(header, body);
        event_frame.events.event.push(event);

        header[5] = event_type2;
        for (var i = 6; i--;) {
            body.pop()
        }
        body.unshift(preferred_surname);
        body.unshift("preferred_surname");
        body.unshift(preferred_name);
        body.unshift("preferred_name");
        body.unshift(high_school_code);
        body.unshift("high_school_code");
        filters.push("identity_type");
        filters.push(identity_type);
        filters.push("employee_type");
        filters.push(employee_type);
        filters.push("student_status");
        filters.push(student_status);
        event = eventBuilder.eventBuilder(header, body, filters);
        event_frame.events.event.push(event);

        event_type = "Name Changed";
        header[5] = event_type;
        for (i = 6; i--;) {
            body.shift()
        }
        for (i = 16; i--;) {
            body.pop()
        }
        body.push("prefix");
        body.push(" ");
        body.push("surname_position");
        body.push(" ");
        body.push("display_name");
        body.push(display_name);
        event = eventBuilder.eventBuilder(header, body);
        event_frame.events.event.push(event);

        event_type2 = "Name Changed v2";
        header[5] = event_type2;
        for (i = 6; i--;) {
            body.pop()
        }
        body.push("preferred_surname");
        body.push(preferred_surname);
        body.push("preferred_name");
        body.push(preferred_name);
        body.push("name_fnf");
        body.push(name_fnf);
        body.push("name_lnf");
        body.push(sort_name);
        event = eventBuilder.eventBuilder(header, body, filters);
        event_frame.events.event.push(event);

        sql_query = sql.eventPerson.raiseEvent;
        params = [JSON.stringify(event_frame)];
        return connection["ces"].executeWithCommit(sql_query, params)
          .then(function(){
            sql_query = sql.enqueue.sql;
            return connection["ces"].execute(sql_query, params)
          })
    }
    else if (restricted === "Y") {
        sql_query = sql.intermediaryId.get;
        params = [basic_url];
        return connection["ces"].execute(sql_query, params)
            .then(function (results) {
                if (results.rows.length === 0) {
                    sql_query = sql.intermediaryId.put;
                    params = [
                        basic_url,
                        " ",    // actor
                        " ",    // group_id
                        created_by_id
                    ];
                    return connection["ces"].executeWithCommit(sql_query, params)
                        .then(function () {
                            sql_query = sql.intermediaryId.get;
                            params = [basic_url];
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
                    "updated_by_id",
                    " ",
                    "date_time_updated",
                    " ",
                    "created_by_id",
                    " ",
                    "date_time_created",
                    " ",
                    "secure_url",
                    secure_url,
                    "surname",
                    " ",
                    "rest_of_name",
                    " ",
                    "first_name",
                    " ",
                    "middle_name",
                    " ",
                    "suffix",
                    " ",
                    "preferred_first_name",
                    " ",
                    "sort_name",
                    " ",
                    "home_town",
                    " ",
                    "home_state_code",
                    " ",
                    "home_country_code",
                    " ",
                    "deceased",
                    " ",
                    "sex",
                    " ",
                    "display_name",
                    " ",
                    "prefix",
                    " ",
                    "surname_position",
                    " "
                ];
                event = eventBuilder.eventBuilder(header, restricted_body);
                event_frame.events.event.push(event);

                header[5] = event_type2;
                //get rid of prefix and surname position
                for (i = 6; i--;) {
                    restricted_body.pop()
                }
                restricted_body.unshift(" ");
                restricted_body.unshift("high_school_code");
                filters.push("restricted");
                filters.push(restricted);
                event = eventBuilder.eventBuilder(header, restricted_body, filters);
                event_frame.events.event.push(event);

                event_type = "Name Changed";
                header[5] = event_type;
                for (i = 6; i--;) {
                    restricted_body.shift()
                }
                for (i = 16; i--;) {
                    restricted_body.pop()
                }
                restricted_body.push("prefix");
                restricted_body.push(" ");
                restricted_body.push("surname_position");
                restricted_body.push(" ");
                restricted_body.push("display_name");
                restricted_body.push(" ");
                event = eventBuilder.eventBuilder(header, restricted_body);
                event_frame.events.event.push(event);

                event_type2 = "Name Changed v2";
                header[5] = event_type2;
                for (i = 6; i--;) {
                    restricted_body.pop()
                }
                restricted_body.push("preferred_surname");
                restricted_body.push(" ");
                restricted_body.push("preferred_name");
                restricted_body.push(" ");
                restricted_body.push("name_fnf");
                restricted_body.push(" ");
                restricted_body.push("name_lnf");
                restricted_body.push(" ");
                event = eventBuilder.eventBuilder(header, restricted_body, filters);
                event_frame.events.event.push(event);

                sql_query = sql.eventPerson.raiseEvent;
                params = [JSON.stringify(event_frame)];
                return connection["ces"].executeWithCommit(sql_query, params)
                  .then(function(){
                    sql_query = sql.enqueue.sql;
                    return connection["ces"].execute(sql_query, params)
                  })
            })
    }
}

function personDeletedEvents(connection) {
    var source_dt = moment()["tz"]("America/Denver").format("YYYY-MM-DD HH:mm:ss.SSS");
    var event_type = "Person Deleted";
    var event_type2 = "Person Deleted v2";
    var domain = "edu.byu";
    var entity = "BYU-IAM";
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

    var body = [
        "person_id",
        person_id,
        "byu_id",
        byu_id,
        "net_id",
        net_id
    ];
    var event = eventBuilder.eventBuilder(header, body);
    event_frame.events.event.push(event);

    header[5] = event_type2;
    var filters = [
        "identity_type",
        identity_type,
        "employee_type",
        employee_type,
        "student_status",
        student_status
    ];
    event = eventBuilder.eventBuilder(header, body, filters);
    event_frame.events.event.push(event);

    var sql_query = sql.eventPerson.raiseEvent;
    var params = [JSON.stringify(event_frame)];
    return connection["ces"].executeWithCommit(sql_query, params)
      .then(function(){
        sql_query = sql.enqueue.sql;
        return connection["ces"].execute(sql_query, params)
      })
}