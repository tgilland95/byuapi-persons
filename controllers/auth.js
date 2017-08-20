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
 * limitation under the License.
 *
 */

const func = require('./shared_functions');
const Promise = require('bluebird');

/**
 *
 * @param req
 * @param fieldsets - Array of string fieldsets
 * @returns {Promise.<Array>}
 */
exports.getPermissions = async (req, fieldsets) => {
  console.log('verifiedJWTs: ', req.verifiedJWTs);
  const requirements = authRequests(req.method, req.verifiedJWTs.prioritizedClaims.byuId, fieldsets, req.params.byu_id);
  console.log('requirements: ', requirements);
  const info_areas_list = await authz_handle_auth(requirements);
  console.log('info_areas_list: ', info_areas_list);
  const permits = [];
  if (info_areas_list !== undefined) {
    for (let i = info_areas_list.length; i--;) {
      if (info_areas_list[i].response) {
        permits.push(info_areas_list[i].resource)
      }
    }
  }
  return permits;
};

function authRequests(method, subject, fieldsets, resource_owner, sub_res_id, body) {
  let reqArray = [];
  let req = {};

  // Sort through fieldsets being accessed and determine what actions need auth in each sub resource
  for (let i = fieldsets.length; i--;) {
    req = {};
    req.subject = subject;
    if (method === 'GET') {
      switch (fieldsets[i]) {
        case 'basic':
        case 'languages':
        case 'personal_records':
        case 'id_cards':
        case 'employee_summaries':
        case 'ethnicities':
        case 'student_summaries':
          req.resource = 'person_view_basic';
          break;
        case "credentials":
          let lds_view = {
            subject: subject,
            resource: "person_view_lds_cred",
            resource_owner: resource_owner
          };
          reqArray.push(lds_view);
          let wso2_view = {
            subject: subject,
            resource: "person_update_wso2_client_id",
            resource_owner: resource_owner
          };
          reqArray.push(wso2_view);
          req.resource = "person_view_basic";
          break;
        case 'addresses':
        case 'email_addresses':
        case 'phones':
        case 'family_phones':
          req.resource = 'person_view_contact';
          break;


        case 'my_guests':
          req.resource = 'person_view_guests';
          break;

        case 'my_delegators':
          req.resource = 'person_update_delegations';
          break;

        case 'group_membership_events':
        case 'group_memberships':
        case 'groups_administered':
          req.resource = 'person_view_groups';
          break;

        case 'government_records':
          let gov_req = {
            subject: subject,
            resource: 'person_view_ssn',
            resource_owner: resource_owner
          };
          reqArray.push(gov_req);
          req.resource = 'person_view_basic';
          break;

        case 'relationships':
          req.resource = 'person_view_relationship';
          break;

        default:
      }
    }
    else if (method === 'PUT') {
      switch (fieldsets[i]) {
        case 'credentials':
          let person_view_basic1 = {
            subject: subject,
            resource: 'person_view_basic',
            resource_owner: resource_owner
          };
          reqArray.push(person_view_basic1);
          let wso2_update = {
            subject: subject,
            resource: 'person_update_wso2_client_id',
            resource_owner: resource_owner
          };
          reqArray.push(wso2_update);
          let cas_update = {
            subject: subject,
            resource: 'person_update_cas_credential',
            resource_owner: resource_owner
          };
          reqArray.push(cas_update);
          req.resource = 'person_change_net_id';
          break;

        case 'addresses':
        case 'email_addresses':
        case 'phones':
        case 'family_phones':
          let person_view_contact = {
            subject: subject,
            resource: 'person_view_contact',
            resource_owner: resource_owner
          };
          reqArray.push(person_view_contact);
          req.resource = 'person_update_contact';
          break;


        case 'basic':
          let person_view_basic2 = {
            subject: subject,
            resource: 'person_view_basic',
            resource_owner: resource_owner
          };
          reqArray.push(person_view_basic2);
          let person_update_name = {
            subject: subject,
            resource: 'person_update_name',
            resource_owner: resource_owner
          };
          reqArray.push(person_update_name);
          req.resource = 'person_update_basic';
          break;
        case 'personal_records':
          let person_is_lds_sync = {
            subject: subject,
            resource: "person_is_lds_sync",
            resource_owner: resource_owner
          };
          reqArray.push(person_is_lds_sync);
          let person_view_basic3 = {
            subject: subject,
            resource: 'person_view_basic',
            resource_owner: resource_owner
          };
          reqArray.push(person_view_basic3);
          let DoD = {
            subject: subject,
            resource: 'person_update_DoB-DoD',
            resource_owner: resource_owner
          };
          let rel_code_req = {
            subject: subject,
            resource: 'person_update_religion',
            resource_owner: resource_owner,
            new_religion_code: body.religion_code
          };
          reqArray.push(rel_code_req);
          reqArray.push(DoD);
          req.resource = 'person_update_basic';
          break;
        case 'government_records':
          let person_view_basic4 = {
            subject: subject,
            resource: 'person_view_basic',
            resource_owner: resource_owner
          };
          reqArray.push(person_view_basic4);
          let person_update_ssn = {
            subject: subject,
            resource: 'person_update_ssn',
            resource_owner: resource_owner
          };
          let cit_code_req = {
            subject: subject,
            resource: 'person_update_citizenship',
            resource_owner: resource_owner,
            new_cit_code: body.citizenship_country_code
          };
          let gov_req1 = {
            subject: subject,
            resource: 'person_view_ssn',
            resource_owner: resource_owner
          };
          reqArray.push(gov_req1);
          reqArray.push(cit_code_req);
          reqArray.push(person_update_ssn);
          req.resource = 'person_update_basic';
          break;

        case 'languages':
        case 'ethnicities':
          let person_view_basic5 = {
            subject: subject,
            resource: 'person_view_basic',
            resource_owner: resource_owner
          };
          reqArray.push(person_view_basic5);
          req.resource = 'person_update_basic';
          break;

        case 'my_guests':
          let person_view_guest = {
            subject: subject,
            resource: 'person_view_guests',
            resource_owner: resource_owner
          };
          reqArray.push(person_view_guest);
          req.resource = 'person_update_guests';
          break;

        case 'my_delegators':
          req.resource = 'person_update_delegations';
          break;

        case 'id_cards':
          let person_view_basic6 = {
            subject: subject,
            resource: 'person_view_basic',
            resource_owner: resource_owner
          };
          reqArray.push(person_view_basic6);
          let unlisted_card = {
            subject: subject,
            resource: 'person_update_id_card_unlisted',
            resource_owner: resource_owner
          };
          let pref_name_card = {
            subject: subject,
            resource: 'person_update_preferred_name_card',
            resource_owner: resource_owner
          };
          reqArray.push(unlisted_card);
          reqArray.push(pref_name_card);
          req.resource = 'person_update_id_card';
          break;
        case 'relationships':
          let person_view_rel = {
            subject: subject,
            resource: 'person_view_relationship',
            resource_owner: resource_owner
          };
          reqArray.push(person_view_rel);
          req.resource = 'person_update_relationship';
          break;

        case 'group_membership_events':
        case 'group_memberships':
        case 'groups_administered':
          req.resource = ' ';
          break;

        default:
      }
    }
    else if (method === 'POST') {
      if (fieldsets[i] === 'my_guests') {
        let person_add_guest = {
          subject: subject,
          resource: 'person_view_guests',
          resource_owner: resource_owner
        };
        reqArray.push(person_add_guest);
        req.resource = 'person_update_guests'
      }
    }
    else if (method === 'DELETE') {
      switch (fieldsets[i]) {
        case 'credentials':
          req.resource = 'person_update_cas_credential';
          //req.resource = 'person_change_net_id'
          let c_net_id = {
            subject: subject,
            resource: 'person_change_net_id',
            resource_owner: resource_owner
          };
          let wso2_id = {
            subject: subject,
            resource: 'person_update_wso2_client_id',
            resource_owner: resource_owner
          };
          reqArray.push(wso2_id);
          reqArray.push(c_net_id);
          break;

        case 'addresses':
        case 'email_addresses':
        case 'phones':
        case 'family_phones':
          req.resource = 'person_update_contact';
          break;

        case 'basic':
          req.resource = 'person_delete_person';
          break;

        case 'relationships':
          req.related_byu_id = sub_res_id;
          req.resource = 'person_delete_relationship';
          break;

        case 'id_cards':
          req.resource = 'person_update_id_card';
          break;

        case 'languages':
        case 'employee_summaries':
        case 'ethnicities':
        case 'student_summaries':
          req.resource = 'person_update_basic';
          break;

        case 'my_guests':
          req.resource = ' ';
          break;

        case 'my_delegators':
          req.resource = ' ';
          break;

        case 'group_membership_events':
        case 'group_memberships':
        case 'groups_administered':
          req.resource = ' ';
          break;

        default:
      }
    }
    req.resource_owner = resource_owner;

    // Create array of actions needing auth
    let x;
    let exists = false;
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
  let restricted = {
    subject: subject,
    resource: 'person_restricted',
    resource_owner: resource_owner
  };
  reqArray.push(restricted);
  let restricted2 = {
    subject: subject,
    resource: 'person_restricted_other',
    resource_owner: resource_owner
  };
  reqArray.push(restricted2);
  return reqArray
}

async function authz_handle_auth(auth_info_list) {

  const results = await func.execute(`
      select informational_area         as "info_area", 
             update_type                as "update_type", 
             nvl(limitation_value, ' ') as "limitation_value" 
      from   common.user_authorization cua
             join iam.identity id 
               on cua.person_id = id.person_id 
      where  id.byu_id = :1 
             and expired_date is null`, [auth_info_list[0].subject]);
  let info_areas = results.rows;

  return Promise.map(auth_info_list, function (auth_info) {

    // Create a new output object for each request.
    let auth_info_out = {};
    auth_info_out.subject = auth_info.subject;
    auth_info_out.resource = auth_info.resource;
    if (auth_info.action) {
      auth_info_out.action = auth_info.action;
    }
    if (auth_info.env) {
      auth_info_out.env = auth_info.env;
    }
    if (auth_info.resource_owner) {
      auth_info_out.resource_owner = auth_info.resource_owner;
    }
    if (auth_info.new_religion_code) {
      auth_info_out.new_religion_code = auth_info.new_religion_code;
    }
    if (auth_info.new_cit_code) {
      auth_info_out.new_cit_code = auth_info.new_cit_code;
    }
    if (auth_info.related_byu_id) {
      auth_info_out.related_byu_id = auth_info.related_byu_id;
    }

    // Expect at least the subject and resource parameters.
    if (!auth_info.subject || !auth_info.resource) {
      auth_info_out.text = 'Missing subject or resource';
      auth_info_out.response = 'Unknown';
      return auth_info_out;
    }

    // Call 'person...' authorizations.
    if (auth_info_out.resource.substring(0, 6) === 'person') {
      return person_handle_auth(auth_info_out, info_areas);
    }
    // Call 'aim...' authorizations.
    //if (auth_info_out.resource.substring(0,3) === 'aim') {
    // return aim.handle_auth(connection, auth_info_out)
    //}
    // Add more authorizations here....

    switch (auth_info_out.resource) {
      //case 'aim...':
      default:
        auth_info_out.response = false;
        auth_info_out.text = 'Resource not found';
        return auth_info_out;
    }
  });
}

/**
 * Function to determine if the entity calling the resource
 * is the owner.
 * @param auth_info
 * @returns {boolean}
 */
function isSelfService(auth_info) {
  return auth_info.subject === auth_info.resource_owner;
}

function hasInfoArea(search_string, info_areas) {
  return info_areas.includes(search_string);
}

function hasUpdateTypeU(search_string, info_areas) {
  return (info_areas.includes(search_string) &&
    info_areas.indexOf(search_string).update_type === 'U');
}

function isRecordsOrEmployment(search_string, info_areas) {
  return (info_areas.indexOf(search_string).limitation_value === 'Records' ||
    info_areas.indexOf(search_string).limitation_value === 'Employment');
}

const employee_sql = `
  select standing
  from   hr.per_warehouse
  where  byu_id = :1`; //owner or subject

const religion_sql = `
  select nvl(st.year_term, 'NULL') as "year_term",
         p.religion_code           as "religion_code"
  from   iam.person p
         left join stdreg.std_term_status st
                on st.person_id = p.person_id
  where  p.byu_id = :1`; //owner

const citizenship_sql = `
  select nvl(st.year_term, 'NULL')  as "year_term",
         p.citizenship_country_code as "citizenship_country_code"
  from   iam.person p
         left join stdreg.std_term_status st
                on p.person_id = st.person_id
  where  p.byu_id = :1`; //owner

const relationship_sql = `
  select updated_by_id as "updated_by_id"
  from   iam.identity_relationship
  where  byu_id = :1
         and related_id = :2`; // owner

const wso2_sql = `
  select count(byu_id) as "count"
  from   gro.person_group
  where  group_id = 'WSO2 ADMINISTRATOR'
         and byu_id = :1`; //subject

const lds_sync_sql = `
  select count(byu_id) as "count"
  from   gro.person_group
  where  group_id = 'LDS_ACCOUNT'
         and byu_id = :1`; //subject

const cas_sql = `
  select count(byu_id) as "count"
  from   gro.person_group
  where  group_id = 'CAS'
         and byu_id = :1`; //subject

const restricted_sql = `
  select count(byu_id) as "count"
  from   gro.person_group
  where  group_id = 'RESTRICTED'
         and byu_id = :1`; //subject

const view_lds_sql = `
  select count(byu_id) as "count"
  from   gro.person_group
  where  group_id = 'VIEW_LDS_CRED'
         and byu_id = :1`; //subject

const birth_date_sql = `
  select nvl(date_of_birth, 0) as "date_of_birth",
         nvl(sex, '?') as "sex"
  from   iam.person 
  where  byu_id = :1`; //owner


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
  let student = false;
  let limitation;
  let standing;

  switch (auth_info.resource) {
    case 'person_change_net_id':
      // If a person has the NETID-CHANGE informational area,
      // then they can change or delete net-ids.
      auth_info.response = hasInfoArea('NETID-CHANGE', info_areas);
      return auth_info;
    case 'person_change_password':
      // If a person has the PASSWORD informational area with update,
      // then they can create a temporary password for other accounts.
      auth_info.response = (isSelfService(auth_info) || hasUpdateTypeU('PASSWORD', info_areas));
      return auth_info;
    case 'person_add_person':
      // If a person has the ADDPERSON informational area with update,
      // then they can manually create accounts, even without net-ids.
      auth_info.response = (hasUpdateTypeU('ADDPERSON', info_areas));
      return auth_info;
    case 'person_update_permanent_resident_status':
      // If a person has the PERSON informational area with update
      //   and the limitation of 'Employment' or 'Records'
      // then they can change the permanent resident status on any account.
      auth_info.response = (hasUpdateTypeU('PERSON', info_areas) &&
        isRecordsOrEmployment('PERSON', info_areas));
      return auth_info;
    case 'person_merge':
      // If a person has the PERSON informational area with update
      //   and the limitation of 'merge'
      // then they can change initiate a person merge.
      auth_info.response = (hasUpdateTypeU('PERSON', info_areas) &&
        info_areas.indexOf('PERSON').limitation_value === 'merge');
      return auth_info;
    case 'person_view_basic':
    case 'person_view_contact':
    case 'person_update_contact':
      // If a person has the PERSON informational area with display or update
      // then they can view the person basic information
      // they can also view and update the person contact information.
      auth_info.response = (isSelfService(auth_info) || hasInfoArea('PERSON', info_areas));
      return auth_info;
    case 'person_view_ssn':
      // If a person has the SSN informational area with display or update
      // and a limitation_value of:
      //   view,
      //   or 'update employee' and the person is an employee
      //   or 'update all'
      // they can view SSN's.

      limitation = info_areas.indexOf('SSN').limitation_value || '';
      if (limitation === 'update employee') {
        const sql_results = await func.execute(employee_sql, [auth_info.subject]);
        standing = sql_results.rows[0].standing;
      }
      auth_info.response = (isSelfService(auth_info) ||
        (hasInfoArea('SSN', info_areas) && (limitation === 'view' ||
          limitation === 'update all' || (limitation === 'update employee' &&
            (standing === 'ACT' || standing === 'LEV')))));
      return auth_info;
    case 'person_update_ssn':
      // If a person has the SSN informational area with update
      // and a limitation_value of:
      //   or 'update employee' and the person is an employee
      //   or 'update all'
      //
      // they can update SSN's.
      //**************************************************

      limitation = info_areas.indexOf('SSN').limitation_value || '';
      if (limitation === 'update employee') {
        const sql_results = await func.execute(employee_sql, [auth_info.subject]);
        standing = sql_results.rows[0].standing;
      }
      auth_info.response = (hasUpdateTypeU('SSN', info_areas) &&
        (limitation === 'update all' || (limitation === 'update employee' &&
          (standing === 'ACT' || standing === 'LEV'))));
      return auth_info;
    case 'person_view_guests':
      // If a person has the DELEGATE informational area
      // or if a person is doing self service
      // they can view GUEST info
      auth_info.response = (isSelfService(auth_info) || (hasInfoArea('DELEGATE', info_areas)));
      return auth_info;
    case 'person_update_delegations':
    case 'person_update_guests':
    case 'person_update_preferred_name_card':
      // if a person is doing self service
      // they can update guests info
      auth_info.response = isSelfService(auth_info);
      return Promise.resolve(auth_info);
    case 'person_view_groups':
      // If a person has the GRO informational area
      // or if a person is doing self service
      // they can view GROUP info
      auth_info.response = (isSelfService(auth_info) || hasInfoArea('GRO', info_areas));
      return auth_info;
    case 'person_update_basic':
      // This is used to update birth_country_code, preferred_surname, preferred_first_name,
      // id_card_unlisted
      // in basic sub resource
      auth_info.response = (isSelfService(auth_info) || hasUpdateTypeU('PERSON', info_areas));
      return auth_info;
    case 'person_update_religion':
      // This is used for updating religion_code
      // in personal_records sub resource
      // Permit to update if self service and
      // resource owner IS NOT a student or
      // resource owner IS
      // student where religion_code is not set or
      // student not switching from or to LDS or
      // or has PERSON update and is employment or records
      const query_results = await func.execute(religion_sql, [auth_info.resource_owner]);
      student = (query_results.rows[0].year_term !== 'NULL');

      auth_info.response = (isSelfService(auth_info) && (!student ||
        (student && (query_results.rows[0].religion_code === ' ' || query_results.rows[0].religion_code === '???')) ||
        (query_results.rows[0].religion_code !== 'LDS' && auth_info.new_religion_code !== 'LDS')) ||
        (hasUpdateTypeU('PERSON', info_areas) && isRecordsOrEmployment('PERSON', info_areas)));
      return auth_info;
    case 'person_update_vitals':
      // This is used for updating date_of_birth, date_of_death, deceased, sex
      // in basic and personal_records sub resources
      // self-service and date of birth and sex haven't been set yet
      // otherwise records or employment with update on PERSON info area required
      const birth_date_results = await func.execute(birth_date_sql, [auth_info.resource_owner]);
      auth_info.response = ((isSelfService(auth_info) && (!birth_date_results.rows[0].date_of_birth) ||
        birth_date_results.rows[0].sex === '?') ||
        hasUpdateTypeU('PERSON', info_areas) && isRecordsOrEmployment('PERSON', info_areas));
      return auth_info;
    case 'person_update_name':
      // This is used for updating surname, first_name, middle_name,
      // and derived fields rest_of_name, sort name
      // in basic sub resource
      auth_info.response = hasUpdateTypeU('PERSON', info_areas);
      return auth_info;
    case 'person_update_citizenship':
      // This is used for updating citizenship_country_code
      // in basic sub resource
      // Permit to update if self service and
      // resource owner IS NOT a student or
      // if NOT changing to or from LDS religion code or
      // resource owner IS a student and
      // current citizenship is not set
      // Any other cases are allowed only with PERSON info area
      // AND Records or Employment limitation_value with Update
      const citizenship_results = await func.execute(citizenship_sql, [auth_info.resource_owner]);
      student = (citizenship_results.rows[0].year_term !== 'NULL');

      auth_info.response = (isSelfService(auth_info) && (!student ||
        (citizenship_results.rows[0].citizenship_country_code !== 'USA' &&
          auth_info.new_cit_code !== 'USA') || (student &&
          (citizenship_results.rows[0].citizenship_country_code === ' ' ||
            citizenship_results.rows[0].new_cit_code === '???')) ||
        (hasUpdateTypeU('PERSON', info_areas) && isRecordsOrEmployment('PERSON', info_areas))));
      return auth_info;
    case 'person_update_id_card':
    case 'person_update_relationship':
      // If a person has the PERSON informational area with update
      // then they can update id_card information
      auth_info.response = hasUpdateTypeU('PERSON', info_areas);
      return auth_info;
    case 'person_view_relationship':
      // If a person has the PERSON informational area
      // then they can view relationship information
      auth_info.response = hasInfoArea('PERSON', info_areas);
      return auth_info;
    case 'person_delete_relationship':
      // If a person has the PERSON informational area with update
      // then they can update relationship information
      const relationship_results = await func.execute(relationship_sql, [auth_info.resource_owner, auth_info.related_byu_id]);
      auth_info.response = (hasUpdateTypeU('PERSON', info_areas) && (!relationship_results.rows.length ||
        relationship_results.rows[0].updated_by_id !== 'HR'));
      return auth_info;
    case 'person_update_wso2_client_id':
      const wso2_results = await func.execute(wso2_sql, [auth_info.subject]);
      auth_info.response = !!(wso2_results.count);
      return auth_info;
    case 'person_view_lds_cred':
      const view_lds_results = await func.execute(view_lds_sql, [auth_info.subject]);
      auth_info.response = !!(view_lds_results.count);
      return auth_info;
    case 'person_is_lds_sync':
      const lds_results = await func.execute(lds_sync_sql, [auth_info.subject]);
      auth_info.response = !!(lds_results.count);
      return auth_info;
    case 'person_update_cas_credential':
      const cas_results = await func.execute(cas_sql, [auth_info.subject]);
      auth_info.response = !!(cas_results.count);
      return auth_info;
    case 'person_delete_person':
      auth_info.response = (hasUpdateTypeU('PERSON', info_areas) &&
        info_areas.indexOf('PERSON').limitation_value === 'Records');
      return auth_info;
    case 'person_lookup_ssn':
      // If a person has the SSN informational area with display or update
      //  they can lookup a person by SSN.
      auth_info.response = hasInfoArea('SSN');
      return auth_info;
    case 'person_restricted':
      const results = await func.execute(restricted_sql, [auth_info.subject]);
      auth_info.response = (isSelfService(auth_info) || !!results.rows.length);
      return auth_info;
    default:
      auth_info.text = 'Resource not found';
      auth_info.response = false;
      return auth_info;
  }
}

exports.hasRestrictedRights = (permissions) => {
  return permissions.includes('person_restricted');
};

exports.canViewContact = (permissions) => {
  return permissions.includes('person_view_contact');
};

exports.canViewBasic = (permissions) => {
  return permissions.includes('person_view_basic');
};

exports.canUpdatePersonContact = (permissions) => {
  return permissions.includes('person_update_contact');
};

exports.canUpdateVitals = (permissions) => {
  return permissions.includes('person_update_vitals');
};

exports.canUpdateName = (permissions) => {
  return permissions.includes('person_update_name');
};

exports.canUpdateBasic = (permissions) => {
  return permissions.includes('person_update_basic');
};