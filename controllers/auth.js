/*
 * Copyright 2017 Brigham Young University
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
"use strict";
const shared_func     = require('./sql/shared_functions');
const Promise         = require('bluebird');

exports.getPermissions = async function (req) {
  console.log("verifiedJWTs: ", req.verifiedJWTs);
  const requirements = authRequests(req.method, req.verifiedJWTs.prioritizedClaims.byuId, ['addresses'], req.params.byu_id);
  console.log("requirements: ", requirements);
  const info_areas_list = await authz_handle_auth(requirements);
  console.log("info_areas_list: ", info_areas_list);
  const permits = [];
  if (info_areas_list !== undefined) {
    for (let i = info_areas_list.length; i--;) {
      if (info_areas_list[i].response === "Permit") {
        permits.push(info_areas_list[i].resource)
      }
    }
  }
  return permits;
};

function authRequests(method, subject, fieldsets, resource_owner, sub_res_id, body) {
  var reqArray = [];
  var req = {};

  // Sort through fieldsets being accessed and determine what actions need auth in each sub resource
  for (var i = fieldsets.length; i--;) {
    req = {};
    req.subject = subject;
    if (method === "GET") {
      switch (fieldsets[i]) {
        case "basic":
        case "languages":
        case "personal_records":
        case "id_cards":
        case "employee_summaries":
        case "ethnicities":
        case "student_summaries":
          req.resource = "person_view_basic";
          break;
        case "credentials":
          var wso2_view = {
            subject: subject,
            resource: "person_update_wso2_client_id",
            resource_owner: resource_owner
          };
          reqArray.push(wso2_view);
          req.resource = "person_view_basic";
          break;
        case "addresses":
        case "email_addresses":
        case "phones":
        case "family_phones":
          req.resource = "person_view_contact";
          break;


        case "my_guests":
          req.resource = "person_view_guests";
          break;

        case "my_delegators":
          req.resource = "person_update_delegations";
          break;

        case "group_membership_events":
        case "group_memberships":
        case "groups_administered":
          req.resource = "person_view_groups";
          break;

        case "government_records":
          var gov_req = {
            subject: subject,
            resource: "person_view_ssn",
            resource_owner: resource_owner
          };
          reqArray.push(gov_req);
          req.resource = "person_view_basic";
          break;

        case "relationships":
          req.resource = "person_view_relationship";
          break;

        default:
      }
    }
    else if (method === "PUT") {
      switch (fieldsets[i]) {
        case "credentials":
          var person_view_basic1 = {
            subject: subject,
            resource: "person_view_basic",
            resource_owner: resource_owner
          };
          reqArray.push(person_view_basic1);
          var wso2_update = {
            subject: subject,
            resource: "person_update_wso2_client_id",
            resource_owner: resource_owner
          };
          reqArray.push(wso2_update);
          var cas_update = {
            subject: subject,
            resource: "person_update_cas_credential",
            resource_owner: resource_owner
          };
          reqArray.push(cas_update);
          req.resource = "person_change_net_id";
          break;

        case "addresses":
        case "email_addresses":
        case "phones":
        case "family_phones":
          var person_view_contact = {
            subject: subject,
            resource: "person_view_contact",
            resource_owner: resource_owner
          };
          reqArray.push(person_view_contact);
          req.resource = "person_update_contact";
          break;


        case "basic":
          var person_view_basic2 = {
            subject: subject,
            resource: "person_view_basic",
            resource_owner: resource_owner
          };
          reqArray.push(person_view_basic2);
          var person_update_name = {
            subject: subject,
            resource: "person_update_name",
            resource_owner: resource_owner
          };
          reqArray.push(person_update_name);
          req.resource = "person_update_basic";
          break;
        case "personal_records":
          var person_view_basic3 = {
            subject: subject,
            resource: "person_view_basic",
            resource_owner: resource_owner
          };
          reqArray.push(person_view_basic3);
          var DoD = {
            subject: subject,
            resource: "person_update_DoB-DoD",
            resource_owner: resource_owner
          };
          var rel_code_req = {
            subject: subject,
            resource: "person_update_religion",
            resource_owner: resource_owner,
            new_religion_code: body.religion_code
          };
          reqArray.push(rel_code_req);
          reqArray.push(DoD);
          req.resource = "person_update_basic";
          break;
        case "government_records":
          var person_view_basic4 = {
            subject: subject,
            resource: "person_view_basic",
            resource_owner: resource_owner
          };
          reqArray.push(person_view_basic4);
          var person_update_ssn = {
            subject: subject,
            resource: "person_update_ssn",
            resource_owner: resource_owner
          };
          var cit_code_req = {
            subject: subject,
            resource: "person_update_citizenship",
            resource_owner: resource_owner,
            new_cit_code: body.citizenship_country_code
          };
          var gov_req1 = {
            subject: subject,
            resource: "person_view_ssn",
            resource_owner: resource_owner
          };
          reqArray.push(gov_req1);
          reqArray.push(cit_code_req);
          reqArray.push(person_update_ssn);
          req.resource = "person_update_basic";
          break;

        case "languages":
        case "ethnicities":
          var person_view_basic5 = {
            subject: subject,
            resource: "person_view_basic",
            resource_owner: resource_owner
          };
          reqArray.push(person_view_basic5);
          req.resource = "person_update_basic";
          break;

        case "my_guests":
          var person_view_guest = {
            subject: subject,
            resource: "person_view_guests",
            resource_owner: resource_owner
          };
          reqArray.push(person_view_guest);
          req.resource = "person_update_guests";
          break;

        case "my_delegators":
          req.resource = "person_update_delegations";
          break;

        case "id_cards":
          var person_view_basic6 = {
            subject: subject,
            resource: "person_view_basic",
            resource_owner: resource_owner
          };
          reqArray.push(person_view_basic6);
          var unlisted_card = {
            subject: subject,
            resource: "person_update_id_card_unlisted",
            resource_owner: resource_owner
          };
          var pref_name_card = {
            subject: subject,
            resource: "person_update_preferred_name_card",
            resource_owner: resource_owner
          };
          reqArray.push(unlisted_card);
          reqArray.push(pref_name_card);
          req.resource = "person_update_id_card";
          break;
        case "relationships":
          var person_view_rel = {
            subject: subject,
            resource: "person_view_relationship",
            resource_owner: resource_owner
          };
          reqArray.push(person_view_rel);
          req.resource = "person_update_relationship";
          break;

        case "group_membership_events":
        case "group_memberships":
        case "groups_administered":
          req.resource = " ";
          break;

        default:
      }
    }
    else if (method === "POST") {
      if (fieldsets[i] === "my_guests") {
        var person_add_guest = {
          subject: subject,
          resource: "person_view_guests",
          resource_owner: resource_owner
        };
        reqArray.push(person_add_guest);
        req.resource = "person_update_guests"
      }
    }
    else if (method === "DELETE") {
      switch (fieldsets[i]) {
        case "credentials":
          req.resource = "person_update_cas_credential";
          //req.resource = "person_change_net_id"
          var c_net_id = {
            subject: subject,
            resource: "person_change_net_id",
            resource_owner: resource_owner
          };
          var wso2_id = {
            subject: subject,
            resource: "person_update_wso2_client_id",
            resource_owner: resource_owner
          };
          reqArray.push(wso2_id);
          reqArray.push(c_net_id);
          break;

        case "addresses":
        case "email_addresses":
        case "phones":
        case "family_phones":
          req.resource = "person_update_contact";
          break;

        case "basic":
          req.resource = "person_delete_person";
          break;

        case "relationships":
          req.related_byu_id = sub_res_id;
          req.resource = "person_delete_relationship";
          break;

        case "id_cards":
          req.resource = "person_update_id_card";
          break;

        case "languages":
        case "employee_summaries":
        case "ethnicities":
        case "student_summaries":
          req.resource = "person_update_basic";
          break;

        case "my_guests":
          req.resource = " ";
          break;

        case "my_delegators":
          req.resource = " ";
          break;

        case "group_membership_events":
        case "group_memberships":
        case "groups_administered":
          req.resource = " ";
          break;

        default:
      }
    }
    req.resource_owner = resource_owner;

    // Create array of actions needing auth
    var x;
    var exists = false;
    for (x = reqArray.length; x--;) {
      if (reqArray[x].resource === req.resource) {
        exists = true;
        break
      }
    }

    if (!exists) {
      reqArray.push(req)
    }

  }
  var restricted = {
    subject: subject,
    resource: "person_restricted",
    resource_owner: resource_owner
  };
  reqArray.push(restricted);
  var restricted2 = {
    subject: subject,
    resource: "person_restricted_other",
    resource_owner: resource_owner
  };
  reqArray.push(restricted2);
  return reqArray
};

async function authz_handle_auth(auth_info_list) {

  const results = await shared_func.executeSelect(`select informational_area as "info_area",
       update_type as "update_type",
       nvl(limitation_value, ' ') as "limitation_value"
       from common.user_authorization cua
       join iam.identity id
       on cua.person_id = id.person_id
       where  id.byu_id = :1
       and expired_date is null`, [auth_info_list[0].subject]);
  var info_areas = results.rows;

  return Promise.map(auth_info_list, function (auth_info) {

    // Create a new output object for each request.
    var auth_info_out      = {};
    auth_info_out.subject  = auth_info.subject;
    auth_info_out.resource = auth_info.resource;
    if(auth_info.action) {auth_info_out.action = auth_info.action;}
    if(auth_info.env)    {auth_info_out.env    = auth_info.env;}
    if(auth_info.resource_owner) {auth_info_out.resource_owner = auth_info.resource_owner;}
    if(auth_info.new_religion_code) {auth_info_out.new_religion_code = auth_info.new_religion_code;}
    if(auth_info.new_cit_code) {auth_info_out.new_cit_code = auth_info.new_cit_code;}
    if(auth_info.related_byu_id) {auth_info_out.related_byu_id = auth_info.related_byu_id;}

    // Expect at least the subject and resource parameters.
    if(!auth_info.subject || !auth_info.resource) {
      auth_info_out.text     = "Missing subject or resource";
      auth_info_out.response = "Unknown";
      return auth_info_out;
    }

    // Call "person..." authorizations.
    if (auth_info_out.resource.substring(0,6) === "person") {
      return person_handle_auth(auth_info_out, info_areas);
    }
    // Call "aim..." authorizations.
    //if (auth_info_out.resource.substring(0,3) === "aim") {
    // return aim.handle_auth(connection, auth_info_out)
    //}
    // Add more authorizations here....

    switch(auth_info_out.resource){
      //case "aim...":
      default:
        auth_info_out.response  = "Deny";
        auth_info_out.text      = "Resource not found";
        return auth_info_out;
    }
  });
};

async function person_handle_auth(auth_info, info_areas) {
  // auth_info contains:
  //    subject,        (Authenticated User)
  //    resource,
  //    resource_owner, (User pertaining to the resource)
  //    action,         (View, Update, Delete, etc.)
  //    env             (location, IP address, Time of day,Dev/Prod, etc.)
  // returns:
  //    response,
  //    text,
  //    limitation_value
  //
  //These are the standard XACML response values:
  //      Permit,
  //      Deny,
  //      Indeterminate (an error occurred or some required value was missing,
  //            so a decision cannot be made)
  //      Not Applicable (the request can't be answered by this service).
  //
  var student = false;
  var position;
  var limitations;

  switch (auth_info.resource) {
    // case "person_change_net_id":
    //   // If a person has the NETID-CHANGE informational area,
    //   // then they can change or delete net-ids.
    //   position = inArrayPossition("NETID-CHANGE",info_areas);
    //   console.log("POSITION", position);
    //   console.log(info_areas[position]);
    //   if(position === -1) {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   auth_info.response = "Permit";
    //   return auth_info;
    // case "person_change_password":
    //   // If a person has the PASSWORD informational area with update,
    //   // then they can create a temporary password for other accounts.
    //
    //   if (auth_info.subject === auth_info.resource_owner) { /* Self service */
    //     auth_info.response = "Permit";
    //     return Promise.resolve(auth_info);
    //   }
    //   position = inArrayPossition("PASSWORD",info_areas);
    //   console.log("POSITION", position);
    //   console.log(info_areas[position]);
    //   if(position === -1) {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   if(info_areas[position].update_type === "U") {
    //     auth_info.response = "Permit";
    //   } else {
    //     auth_info.response = "Deny";
    //   }
    //   return auth_info;
    // case "person_add_person":
    //   // If a person has the ADDPERSON informational area with update,
    //   // then they can manually create accounts, even without net-ids.
    //   position = inArrayPossition("ADDPERSON",info_areas);
    //   console.log("POSITION", position);
    //   console.log(info_areas[position]);
    //   if(position === -1) {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   if(info_areas[position].update_type === "U") {
    //     auth_info.response = "Permit";
    //   } else {
    //     auth_info.response = "Deny";
    //   }
    //   return auth_info;
    // case "person_update_permanent_resident_status":
    //   // If a person has the PERSON informational area with update
    //   //   and the limitation of 'Employment' or 'Records'
    //   // then they can change the permanent resident status on any account.
    //   position = inArrayPossition("PERSON",info_areas);
    //   console.log("POSITION", position);
    //   console.log(info_areas[position]);
    //   if(position === -1) {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   if(info_areas[position].update_type === "U" &&
    //     (info_areas[position].limitation_value === "Records" ||
    //       info_areas[position].limitation_value === "Employment")) {
    //     auth_info.response = "Permit";
    //   } else {
    //     auth_info.response = "Deny";
    //   }
    //   return auth_info;
    // case "person_merge":
    //   // If a person has the PERSON informational area with update
    //   //   and the limitation of 'merge'
    //   // then they can change initiate a person merge.
    //   position = inArrayPossition("PERSON",info_areas);
    //   console.log("POSITION", position);
    //   console.log(info_areas[position]);
    //   if(position === -1) {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   if(info_areas[position].update_type === "U" &&
    //     info_areas[position].limitation_value === "merge") {
    //     auth_info.response = "Permit";
    //   } else {
    //     auth_info.response = "Deny";
    //   }
    //   return auth_info;
    case "person_view_basic":
    case "person_view_contact":
    case "person_update_contact":
      // If a person has the PERSON informational area with display or update
      // then they can view the person basic information
      // they can also view and update the person contact information.
      if (auth_info.subject === auth_info.resource_owner) { /* Self service */
        auth_info.response = "Permit";
        return Promise.resolve(auth_info);
      }
      auth_info.response = info_areas.includes('PERSON') ? "Permit" : "Deny";

      return auth_info;

    // case "person_view_ssn":
    //   // If a person has the SSN informational area with display or update
    //   // and a limitation_value of:
    //   //   view,
    //   //   or 'update employee' and the person is an employee
    //   //   or 'update all'
    //   // they can view SSN's.
    //
    //   if (auth_info.subject === auth_info.resource_owner) { // Self service
    //     auth_info.response = "Permit";
    //     return Promise.resolve(auth_info);
    //   }
    //   position = inArrayPossition("SSN",info_areas);
    //   if(position === -1) {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   limitations = info_areas[position].limitation_value;
    //   if ((limitations !== "view") &&
    //     (limitations !== "update employee") &&
    //     (limitations !== "update all")) {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   if ((limitations === "view") || (limitations === "update all")) {
    //     auth_info.response = "Permit";
    //     return auth_info;
    //   }
    //   if (limitations === "update employee") {
    //     const results = shared_func.executeSelect(""
    //       + "select classification, "
    //       + "       standing "
    //       + "from   hr.per_warehouse "
    //       + "where  byu_id = :1",
    //       [auth_info.subject])
    //       .then(function (results) {
    //         if (results.rows.length === 0) {
    //           auth_info.response = "Deny";
    //           return auth_info;
    //         }
    //         //var classification = results.rows[0].classification;
    //         var standing = results.rows[0].standing;
    //         if ((standing === "ACT") || (standing === "LEV")) {
    //           auth_info.response = "Permit";
    //           return auth_info;
    //         }
    //         auth_info.response = "Deny";
    //         return auth_info;
    //       });
    //   }
    //   // Should not get here.
    //   auth_info.response = "Deny";
    //   return auth_info;
    //
    // case "person_update_ssn":
    //   // If a person has the SSN informational area with update
    //   // and a limitation_value of:
    //   //   or 'update employee' and the person is an employee
    //   //   or 'update all'
    //   //
    //   // they can update SSN's.
    //   //**************************************************
    //
    //   position = inArrayPossition("SSN",info_areas);
    //   if(position === -1) {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   if (info_areas[position].update_type !== "U") {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   limitations = info_areas[position].limitation_value;
    //
    //   if ((limitations !== "update employee") && (limitations !== "update all")) {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   if (limitations === "update all") {
    //     auth_info.response = "Permit";
    //     return auth_info;
    //   }
    //   if (limitations === "update employee") {
    //     return connection.ces.execute(""
    //       + "select classification, "
    //       + "       standing "
    //       + "from   hr.per_warehouse "
    //       + "where  byu_id = :1",
    //       [auth_info.resource_owner])
    //       .then(function (results) {
    //         if (results.rows.length === 0) {
    //           auth_info.response = "Deny";
    //           return auth_info;
    //         }
    //         //var classification = results.rows[0].classification;
    //         var standing = results.rows[0].standing;
    //         if ((standing === "ACT") || (standing === "LEV")) {
    //           auth_info.response = "Permit";
    //           return auth_info;
    //         }
    //         auth_info.response = "Deny";
    //         return auth_info;
    //       });
    //   }
    //   // Should not get here.
    //   auth_info.response = "Deny";
    //   return auth_info;
    // case "person_view_guests":
    //   // If a person has the DELEGATE informational area
    //   // or if a person is doing self service
    //   // they can view GUEST info
    //   if (auth_info.subject === auth_info.resource_owner) { /* Self service */
    //     auth_info.response = "Permit";
    //     return Promise.resolve(auth_info);
    //   }
    //   position = inArrayPossition("DELEGATE",info_areas);
    //   if(position === -1) {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   auth_info.response = "Permit";
    //   return auth_info;
    // case "person_update_guests":
    //   // if a person is doing self service
    //   // they can update guests info
    //   if (auth_info.subject === auth_info.resource_owner) { /* Self service */
    //     auth_info.response = "Permit";
    //     return Promise.resolve(auth_info);
    //   }
    //   auth_info.response = "Deny";
    //   return Promise.resolve(auth_info);
    // case "person_update_delegations":
    //   // FOR USE OF BOTH VIEW and UPDATE
    //   // This is allowed in the case of self service only
    //   if (auth_info.subject === auth_info.resource_owner) { /* Self service */
    //     auth_info.response = "Permit";
    //     return Promise.resolve(auth_info);
    //   }
    //   auth_info.response = "Deny";
    //   return Promise.resolve(auth_info);
    // case "person_view_groups":
    //   // If a person has the GRO informational area
    //   // or if a person is doing self service
    //   // they can view GROUP info
    //   if (auth_info.subject === auth_info.resource_owner) { /* Self service */
    //     auth_info.response = "Permit";
    //     return Promise.resolve(auth_info);
    //   }
    //   position = inArrayPossition("GRO",info_areas);
    //   if(position === -1) {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   auth_info.response = "Permit";
    //   return auth_info;
    // case "person_update_basic":
    //   // This is used to update birth_country_code, preferred_surname, preferred_first_name, suffix
    //   // in basic sub resource
    //   if (auth_info.subject === auth_info.resource_owner) { /* Self service */
    //     auth_info.response = "Permit";
    //     return Promise.resolve(auth_info);
    //   }
    //   // If a person has the PERSON informational area with update
    //   // then they can update the person basic information
    //   position = inArrayPossition("PERSON",info_areas);
    //   if(position === -1) {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   if (info_areas[position].update_type !== "U") {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   auth_info.response = "Permit";
    //   return auth_info;
    // case "person_update_religion":
    //   // This is used for updating religion_code
    //   // in personal_records sub resource
    //   return connection.ces.execute(""
    //     + "select nvl(st.year_term, 'NULL') as \"year_term\", "
    //     + "       p.religion_code           as \"religion_code\" "
    //     + "from   iam.person p "
    //     + "       left join stdreg.std_term_status st "
    //     + "              on st.person_id = p.person_id "
    //     + "where  p.byu_id = :1",
    //     [auth_info.resource_owner])
    //     .then(function (results) {
    //
    //       student = (results.rows[0].year_term !== "NULL");
    //
    //       // Permit to update if self service
    //       // and if NOT changing to or from LDS religion code
    //       if ((auth_info.subject === auth_info.resource_owner) && /* Self service */
    //         (results.rows[0].religion_code !== "LDS") &&
    //         (auth_info.new_religion_code !== "LDS")) {
    //         console.log("SELF SERVICE NON LDS CHANGE");
    //         auth_info.response = "Permit";
    //         return auth_info;
    //       }
    //
    //       // Permit to update if resource owner IS NOT a student
    //       // and if self service
    //       if (!student &&
    //         auth_info.subject === auth_info.resource_owner) {
    //         console.log("SELF SERVICE NON STUDENT");
    //         auth_info.response = "Permit";
    //         return auth_info;
    //       }
    //
    //       // Permit to update if resource owner IS a student
    //       // and if self service
    //       // and current religion_code is not set
    //       if (student &&
    //         ((results.rows[0].religion_code === " ") || (results.rows[0].religion_code === "???")) &&
    //         (auth_info.subject === auth_info.resource_owner)) {
    //         console.log("SELF SERVICE STUDENT UNSET RELIGION_CODE");
    //         auth_info.response = "Permit";
    //         return auth_info;
    //       }
    //
    //       // Any other cases are allowed only with PERSON info area with Update
    //       position = inArrayPossition("PERSON",info_areas);
    //       if(position === -1) {
    //         auth_info.response = "Deny";
    //         return auth_info;
    //       }
    //       if (info_areas[position].update_type !== "U") {
    //         auth_info.response = "Deny";
    //         return auth_info;
    //       }
    //       limitations = info_areas[position].limitation_value;
    //
    //       if ((limitations === "Employment") || (limitations === "Records")) {
    //         auth_info.response = "Permit";
    //         return auth_info;
    //       }
    //       auth_info.response = "Deny";
    //       return auth_info;
    //     });
    // case "person_update_DoB-DoD":
    //   // This is used for updating date_of_birth, date_of_death, deceased, sex
    //   // in basic and personal_records sub resources
    //   position = inArrayPossition("PERSON",info_areas);
    //   if(position === -1) {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   if (info_areas[position].update_type !== "U") {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   limitations = info_areas[position].limitation_value;
    //
    //   if ((limitations === "Employment") || (limitations === "Records")) {
    //     auth_info.response = "Permit";
    //     return auth_info;
    //   }
    //   auth_info.response = "Deny";
    //   return auth_info;
    // case "person_update_name":
    //   // This is used for updating surname, first_name, middle_name,
    //   // and derived fields rest_of_name, sort name
    //   // in basic sub resource
    //   position = inArrayPossition("PERSON",info_areas);
    //   if(position === -1) {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   if (info_areas[position].update_type === "U") {
    //     auth_info.response = "Permit";
    //     return auth_info;
    //   }
    //   auth_info.response = "Deny";
    //   return auth_info;
    // case "person_update_citizenship":
    //   // This is used for updating citizenship_country_code
    //   // in basic sub resource
    //   return connection.ces.execute(""
    //     + "select nvl(st.year_term, 'NULL')  as \"year_term\", "
    //     + "       p.citizenship_country_code as \"citizenship_country_code\" "
    //     + "from   iam.person p "
    //     + "       left join stdreg.std_term_status st "
    //     + "              on p.person_id = st.person_id "
    //     + "where  p.byu_id = :1",
    //     [auth_info.resource_owner])
    //     .then(function (results) {
    //       student = (results.rows[0].year_term !== "NULL");
    //       console.log("THING", results.rows[0].citizenship_country_code + ":" + auth_info.new_cit_code);
    //       // Permit to update if self service
    //       // and if NOT changing to or from LDS religion code
    //       if ((auth_info.subject === auth_info.resource_owner) && /* Self service */
    //         (results.rows[0].citizenship_country_code !== "USA") &&
    //         (auth_info.new_cit_code !== "USA")) {
    //         console.log("SELF SERVICE NON USA CHANGE");
    //         auth_info.response = "Permit";
    //         return auth_info;
    //       }
    //
    //       // Permit to update if resource owner IS NOT a student
    //       // and if self service
    //       if (!student && (auth_info.subject === auth_info.resource_owner)) {
    //         console.log("SELF SERVICE NON STUDENT");
    //         auth_info.response = "Permit";
    //         return auth_info;
    //       }
    //
    //       // Permit to update if resource owner IS a student
    //       // and if self service
    //       // and current religion_code is not set
    //       if (student &&
    //         ((results.rows[0].citizenship_country_code === " ") || (results.rows[0].new_cit_code === "???")) &&
    //         (auth_info.subject === auth_info.resource_owner)) {
    //         console.log("SELF SERVICE STUDENT UNSET citizenship_country_code");
    //         auth_info.response = "Permit";
    //         return auth_info;
    //       }
    //
    //       // Any other cases are allowed only with PERSON info area
    //       // AND Records or Employment limitation_value with Update
    //       position = inArrayPossition("PERSON",info_areas);
    //       if(position === -1) {
    //         auth_info.response = "Deny";
    //         return auth_info;
    //       }
    //       if (info_areas[position].update_type !== "U") {
    //         auth_info.response = "Deny";
    //         return auth_info;
    //       }
    //       limitations = info_areas[position].limitation_value;
    //
    //       if ((limitations === "Employment") || (limitations === "Records")) {
    //         auth_info.response = "Permit";
    //         return auth_info;
    //       }
    //       auth_info.response = "Deny";
    //       return auth_info;
    //     });
    // case "person_update_preferred_name_card":
    //   // This is used for updating use_preferred_name_on_id_card
    //   // in basic sub resource
    //
    //   // Self service only
    //   if (auth_info.subject === auth_info.resource_owner) {
    //     auth_info.response = "Permit";
    //   } else {
    //     auth_info.response = "Deny";
    //   }
    //   return Promise.resolve(auth_info);
    // case "person_update_id_card":
    //   // If a person has the PERSON informational area with update
    //   // then they can update id_card information
    //   position = inArrayPossition("PERSON",info_areas);
    //   if(position === -1) {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   if (info_areas[position].update_type === "U") {
    //     auth_info.response = "Permit";
    //     return auth_info;
    //   }
    //   auth_info.response = "Deny";
    //   return auth_info;
    // case "person_update_id_card_unlisted":
    //   // This is used for updating unlisted or lost_or_stolen
    //   // in id_card sub resource
    //
    //   // Self service
    //   if (auth_info.subject === auth_info.resource_owner) { /* Self service */
    //     auth_info.response = "Permit";
    //     return Promise.resolve(auth_info);
    //   }
    //   // If a person has the PERSON informational area with update
    //   // then they can update id_card information
    //   position = inArrayPossition("PERSON",info_areas);
    //   if(position === -1) {
    //     auth_info.response = "Deny";
    //     return Promise.resolve(auth_info);
    //   }
    //   if (info_areas[position].update_type === "U") {
    //     auth_info.response = "Permit";
    //     return Promise.resolve(auth_info);
    //   }
    //   auth_info.response = "Deny";
    //   return auth_info;
    // case "person_view_relationship":
    //   // If a person has the PERSON informational area
    //   // then they can view relationship information
    //   position = inArrayPossition("PERSON",info_areas);
    //   if(position === -1) {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   auth_info.response = "Permit";
    //   return auth_info;
    // case "person_update_relationship":
    //   // If a person has the PERSON informational area with update
    //   // then they can update relationship information
    //   position = inArrayPossition("PERSON",info_areas);
    //   if(position === -1) {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   if (info_areas[position].update_type === "U") {
    //     auth_info.response = "Permit";
    //     return auth_info;
    //   }
    //   auth_info.response = "Deny";
    //   return auth_info;
    // case "person_delete_relationship":
    //   // If a person has the PERSON informational area with update
    //   // then they can update relationship information
    //   position = inArrayPossition("PERSON",info_areas);
    //   if(position === -1) {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   if (info_areas[position].update_type === "U") {
    //     return connection.ces.execute(""
    //       + "select updated_by_id as \"updated_by_id\" "
    //       + "from iam.identity_relationship "
    //       + "where  byu_id = :1 "
    //       + "       and related_id = :2",
    //       [
    //         auth_info.resource_owner,
    //         auth_info.related_byu_id
    //       ])
    //       .then(function (results) {
    //         if(results.rows.length === 0) {
    //           auth_info.response = "Permit";
    //           return auth_info;
    //         }
    //         if(results.rows[0].updated_by_id === "HR") {
    //           auth_info.response = "Deny"
    //         }
    //         auth_info.response = "Permit";
    //         return auth_info;
    //       });
    //   }
    //
    //   auth_info.response = "Deny";
    //   return auth_info;
    // case "person_update_wso2_client_id":
    //   return connection.ces.execute(""
    //     + "select * "
    //     + "from   gro.person_group "
    //     + "where  group_id = 'WSO2 ADMINISTRATOR' "
    //     + "       and byu_id = :1",
    //     [auth_info.subject])
    //     .then(function (results) {
    //       if(results.rows.length === 0) {
    //         auth_info.response = "Deny";
    //         return auth_info;
    //       }
    //       auth_info.response = "Permit";
    //       return auth_info;
    //     });
    // case "is_lds_sync":
    //   return connection.ces.execute(""
    //     + "select * "
    //     + "from   gro.person_group "
    //     + "where  group_id = 'LDS_ACCOUNT' "
    //     + "       and byu_id = :1",
    //     [auth_info.subject])
    //     .then(function (results) {
    //       if(results.rows.length === 0) {
    //         auth_info.response = "Deny";
    //         return auth_info;
    //       }
    //       auth_info.response = "Permit";
    //       return auth_info;
    //     });
    // case "person_update_cas_credential":
    //   return connection.ces.execute(""
    //     + "select * "
    //     + "from   gro.person_group "
    //     + "where  group_id = 'CAS' "
    //     + "       and byu_id = :1",
    //     [auth_info.subject])
    //     .then(function (results) {
    //       if(results.rows.length === 0) {
    //         auth_info.response = "Deny";
    //         return auth_info;
    //       }
    //       auth_info.response = "Permit";
    //       return auth_info;
    //     });
    // case "person_delete_person":
    //   position = inArrayPossition("PERSON",info_areas);
    //   if(position === -1) {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   if (info_areas[position].update_type !== "U") {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   if (info_areas[position].limitation_value !== "Records") {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   auth_info.response = "Permit";
    //   return auth_info;

    // case "person_lookup_ssn":
    //   // If a person has the SSN informational area with display or update
    //   //  they can lookup a person by SSN.
    //
    //   position = inArrayPossition("SSN",info_areas);
    //   if(position === -1) {
    //     auth_info.response = "Deny";
    //     return auth_info;
    //   }
    //   auth_info.response = "Permit";
    //   return auth_info;
    //
    case "person_restricted":
      if (auth_info.subject === auth_info.resource_owner) {
        auth_info.response = "Permit";
        return auth_info;
      }
      const results = await shared_func.executeSelect(""
        + "select * "
        + "from   gro.person_group "
        + "where  group_id = 'RESTRICTED' "
        + "       and byu_id = :1",
        [auth_info.subject]);
      auth_info.response = results.rows.length ? "Permit" : "Deny";
      return auth_info;
    default:
      auth_info.text = "Resource not found";
      auth_info.response = "Deny";
      return auth_info;
  }
};

exports.hasRestrictedRights = function (permissions) {
  return permissions.includes("person_restricted");
};

exports.canViewContact = function (permissions) {
  return permissions.includes("person_view_contact");
};