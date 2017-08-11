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
var auth_req_array = utils.authRequests("GET", req.verifiedJWTs.authorized_byu_id, fs, res_owner, request);

exports.authRequests = function(method, subject, fieldsets, resource_owner, request) {
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
            new_religion_code: request.body.religion_code
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
            new_cit_code: request.body.citizenship_country_code
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
          req.related_byu_id = request.params.sub_resource_id[0];
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

exports.hasRestrictedRights = function (req) {
  return true;
};

exports.canViewContact = function (req) {
  // inArray("person_view_contact", req.params.auth)
  return true;
}