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

const db = require('./db');
const Promise = require('bluebird');

function authRequests(method, subject, fieldsets, resource_owner, request) {
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
        case 'credentials':
          const lds_view = {
            subject: subject,
            resource: 'person_view_lds_cred',
            resource_owner: resource_owner
          };
          reqArray.push(lds_view);
          const wso2_view = {
            subject: subject,
            resource: 'person_update_wso2_client_id',
            resource_owner: resource_owner
          };
          reqArray.push(wso2_view);
          req.resource = 'person_view_basic';
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
          const gov_req = {
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
          const person_view_basic1 = {
            subject: subject,
            resource: 'person_view_basic',
            resource_owner: resource_owner
          };
          reqArray.push(person_view_basic1);
          const wso2_update = {
            subject: subject,
            resource: 'person_update_wso2_client_id',
            resource_owner: resource_owner
          };
          reqArray.push(wso2_update);
          const cas_update = {
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
          const person_view_contact = {
            subject: subject,
            resource: 'person_view_contact',
            resource_owner: resource_owner
          };
          reqArray.push(person_view_contact);
          req.resource = 'person_update_contact';
          break;


        case 'basic':
          const person_view_basic2 = {
            subject: subject,
            resource: 'person_view_basic',
            resource_owner: resource_owner
          };
          reqArray.push(person_view_basic2);
          const person_update_name = {
            subject: subject,
            resource: 'person_update_name',
            resource_owner: resource_owner
          };
          reqArray.push(person_update_name);
          req.resource = 'person_update_basic';
          break;
        case 'personal_records':
          const person_is_lds_sync = {
            subject: subject,
            resource: 'person_is_lds_sync',
            resource_owner: resource_owner
          };
          reqArray.push(person_is_lds_sync);
          const person_view_basic3 = {
            subject: subject,
            resource: 'person_view_basic',
            resource_owner: resource_owner
          };
          reqArray.push(person_view_basic3);
          const DoD = {
            subject: subject,
            resource: 'person_update_DoB-DoD',
            resource_owner: resource_owner
          };
          const rel_code_req = {
            subject: subject,
            resource: 'person_update_religion',
            resource_owner: resource_owner,
            new_religion_code: request.body.religion_code
          };
          reqArray.push(rel_code_req);
          reqArray.push(DoD);
          req.resource = 'person_update_basic';
          break;
        case 'government_records':
          const person_view_basic4 = {
            subject: subject,
            resource: 'person_view_basic',
            resource_owner: resource_owner
          };
          reqArray.push(person_view_basic4);
          const person_update_ssn = {
            subject: subject,
            resource: 'person_update_ssn',
            resource_owner: resource_owner
          };
          const cit_code_req = {
            subject: subject,
            resource: 'person_update_citizenship',
            resource_owner: resource_owner,
            new_cit_code: request.body.citizenship_country_code
          };
          const gov_req1 = {
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
          const person_view_basic5 = {
            subject: subject,
            resource: 'person_view_basic',
            resource_owner: resource_owner
          };
          reqArray.push(person_view_basic5);
          req.resource = 'person_update_basic';
          break;

        case 'my_guests':
          const person_view_guest = {
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
          const person_view_basic6 = {
            subject: subject,
            resource: 'person_view_basic',
            resource_owner: resource_owner
          };
          reqArray.push(person_view_basic6);
          const unlisted_card = {
            subject: subject,
            resource: 'person_update_id_card_unlisted',
            resource_owner: resource_owner
          };
          const pref_name_card = {
            subject: subject,
            resource: 'person_update_preferred_name_card',
            resource_owner: resource_owner
          };
          reqArray.push(unlisted_card);
          reqArray.push(pref_name_card);
          req.resource = 'person_update_id_card';
          break;
        case 'relationships':
          const person_view_rel = {
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
        const person_add_guest = {
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
          const c_net_id = {
            subject: subject,
            resource: 'person_change_net_id',
            resource_owner: resource_owner
          };
          const wso2_id = {
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
          req.related_byu_id = request.params.related_id;
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
    let exists = false;
    for (let x = reqArray.length; x--;) {
      if (reqArray[x].resource === req.resource) {
        exists = true;
        break;
      }
    }

    if (!exists) {
      reqArray.push(req)
    }

  }
  const restricted = {
    subject: subject,
    resource: 'person_restricted',
    resource_owner: resource_owner
  };
  reqArray.push(restricted);
  const restricted2 = {
    subject: subject,
    resource: 'person_restricted_other',
    resource_owner: resource_owner
  };
  reqArray.push(restricted2);
  return reqArray;
}

function inArrayPosition(needle, haystack) {
  for (let i = haystack.length; i--;) {
    if (haystack[i].info_area === needle) {
      return i;
    }
  }
  return -1;
}

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
  let position;

  switch (auth_info.resource) {
    case 'person_change_net_id':
      // If a person has the NETID-CHANGE informational area,
      // then they can change or delete net-ids.
      position = inArrayPosition('NETID-CHANGE', info_areas);
      console.log('POSITION', position);
      console.log(info_areas[position]);
      auth_info.response = (position === -1) ? 'Deny' : 'Permit';
      return auth_info;
    case 'person_change_password':
      // If a person has the PASSWORD informational area with update,
      // then they can create a temporary password for other accounts.

      if (auth_info.subject === auth_info.resource_owner) { /* Self service */
        auth_info.response = 'Permit';
        return Promise.resolve(auth_info);
      }
      position = inArrayPosition('PASSWORD', info_areas);
      console.log('POSITION', position);
      console.log(info_areas[position]);
      auth_info.response = (position === -1 || !/^U$/g.test(info_areas[position].update_type)) ? 'Deny' : 'Permit';
      return auth_info;
    case 'person_add_person':
      // If a person has the ADDPERSON informational area with update,
      // then they can manually create accounts, even without net-ids.
      position = inArrayPosition('ADDPERSON', info_areas);
      console.log('POSITION', position);
      console.log(info_areas[position]);
      auth_info.response = (position === -1 || !/^U$/g.test(info_areas[position].update_type)) ? 'Deny' : 'Permit';
      return auth_info;
    case 'person_update_permanent_resident_status':
      // If a person has the PERSON informational area with update
      //   and the limitation of 'Employment' or 'Records'
      // then they can change the permanent resident status on any account.
      position = inArrayPosition('PERSON', info_areas);
      console.log('POSITION', position);
      console.log(info_areas[position]);
      auth_info.response = (position === -1 || !/^U$/g.test(info_areas[position].update_type) ||
        !/^(Employment|Records)$/g.test(info_areas[position].limitation_value)) ? 'Deny' : 'Permit';
      return auth_info;
    case 'person_merge':
      // If a person has the PERSON informational area with update
      //   and the limitation of 'merge'
      // then they can change initiate a person merge.
      position = inArrayPosition('PERSON', info_areas);
      console.log('POSITION', position);
      console.log(info_areas[position]);
      auth_info.response = (position === -1 || !/^U$/g.test(info_areas[position].update_type) ||
        !/^merge$/g.test(info_areas[position].limitation_value)) ? 'Deny' : 'Permit';
      return auth_info;
    case 'person_view_basic':
    case 'person_view_contact':
    case 'person_update_contact':
      // If a person has the PERSON informational area with display or update
      // then they can view the person basic information
      // they can also view and update the person contact information.
      if (auth_info.subject === auth_info.resource_owner) { /* Self service */
        auth_info.response = 'Permit';
        return Promise.resolve(auth_info);
      }
      position = inArrayPosition('PERSON', info_areas);
      auth_info.response = (position === -1) ? 'Deny' : 'Permit';
      return auth_info;
    case 'person_view_ssn':
      // If a person has the SSN informational area with display or update
      // and a limitation_value of:
      //   view,
      //   or 'update employee' and the person is an employee
      //   or 'update all'
      // they can view SSN's.

      if (auth_info.subject === auth_info.resource_owner) { // Self service
        auth_info.response = 'Permit';
        return Promise.resolve(auth_info);
      }
      position = inArrayPosition('SSN', info_areas);
      if (position === -1 || !/^(view|update employee|update all)$/g.test(info_areas[position].limitation_value)) {
        auth_info.response = 'Deny';
        return auth_info;
      } else if (/^(view|update all)$/g.test(info_areas[position].limitation_value)) {
        auth_info.response = 'Permit';
        return auth_info;
      } else if (/^update employee$/g.test(info_areas[position].limitation_value)) {
        const results = await db.execute(`
          select classification, 
                 standing 
          from   hr.per_warehouse 
          where  byu_id = :BYU_ID`,
          [auth_info.subject]);

        auth_info.response = (!results.rows.length ||
          !/^(ACT|LEV)$/g.test(results.rows[0].standing)) ? 'Deny' : 'Permit';
        return auth_info;
      } else {
        // Should not get here.
        auth_info.response = 'Deny';
        return auth_info;
      }
    case 'person_update_ssn':
      // If a person has the SSN informational area with update
      // and a limitation_value of:
      //   or 'update employee' and the person is an employee
      //   or 'update all'
      //
      // they can update SSN's.
      //**************************************************

      position = inArrayPosition('SSN', info_areas);
      if (position === -1 || !/^U$/g.test(info_areas[position].update_type) ||
        !/^(update employee|update all)$/g.test(info_areas[position].limitation_value)) {
        auth_info.response = 'Deny';
        return auth_info;
      } else if (/^update all$/g.test(info_areas[position].limitation_value)) {
        auth_info.response = 'Permit';
        return auth_info;
      } else if (/^update employee$/g.test(info_areas[position].limitation_value)) {
        const results = await db.execute(`
          select classification as "classification", 
                 standing       as "standing"
          from   hr.per_warehouse 
          where  byu_id = :BYU_ID`,
          [auth_info.resource_owner]);

        auth_info.response = (!results.rows.length ||
          !/^(ACT|LEV)$/g.test(results.rows[0].standing)) ? 'Deny' : 'Permit';
        return auth_info;
      } else {
        // Should not get here.
        auth_info.response = 'Deny';
        return auth_info;
      }
    case 'person_view_guests':
      // If a person has the DELEGATE informational area
      // or if a person is doing self service
      // they can view GUEST info
      if (auth_info.subject === auth_info.resource_owner) { /* Self service */
        auth_info.response = 'Permit';
        return Promise.resolve(auth_info);
      }
      position = inArrayPosition('DELEGATE', info_areas);
      auth_info.response = (position === -1) ? 'Deny' : 'Permit';
      return auth_info;
    case 'person_update_guests':
    case 'person_update_delegations':
    case 'person_update_preferred_name_card':
      // This is used for updating use_preferred_name_on_id_card
      // in basic sub resource
      // if a person is doing self service
      // they can update guests info
      // FOR USE OF BOTH VIEW and UPDATE
      // This is allowed in the case of self service only
      auth_info.response = (auth_info.subject !== auth_info.resource_owner) ? 'Deny' : 'Permit';
      return Promise.resolve(auth_info);
    case 'person_view_groups':
      // If a person has the GRO informational area
      // or if a person is doing self service
      // they can view GROUP info
      if (auth_info.subject === auth_info.resource_owner) { /* Self service */
        auth_info.response = 'Permit';
        return Promise.resolve(auth_info);
      }
      position = inArrayPosition('GRO', info_areas);
      auth_info.response = (position === -1) ? 'Deny' : 'Permit';
      return auth_info;
    case 'person_update_basic':
    case 'person_update_id_card_unlisted':
      // This is used for updating unlisted or lost_or_stolen
      // in id_card sub resource

      // This is used to update birth_country_code, preferred_surname, preferred_first_name, suffix
      // in basic sub resource
      if (auth_info.subject === auth_info.resource_owner) { /* Self service */
        auth_info.response = 'Permit';
        return Promise.resolve(auth_info);
      }
      // If a person has the PERSON informational area with update
      // then they can update the person basic information
      position = inArrayPosition('PERSON', info_areas);
      auth_info.response = (position === -1 || !/^U$/g.test(info_areas[position].update_type)) ? 'Deny' : 'Permit';
      return auth_info;
    case 'person_update_religion':
      // This is used for updating religion_code
      // in personal_records sub resource
      const rel_results = await db.execute(`
        select nvl(st.year_term, 'NULL') as "year_term", 
               p.religion_code           as "religion_code" 
        from   iam.person p 
               left join stdreg.std_term_status st 
                      on st.person_id = p.person_id 
        where  p.byu_id = :BYU_ID`,
        [auth_info.resource_owner]);

      student = (rel_results.rows[0].year_term !== 'NULL');

      // Permit to update if self service
      // and if NOT changing to or from LDS religion code

      // Permit to update if resource owner IS NOT a student
      // and if self service

      // Permit to update if resource owner IS a student
      // and if self service
      // and current religion_code is not set
      if (auth_info.subject === auth_info.resource_owner && (!student || (!/^LDS$/g.test(rel_results.rows[0].religion_code) &&
          !/^LDS$/g.test(auth_info.new_religion_code)) || (student && /^( |[?]{3})$/g.test(rel_results.rows[0].religion_code)))) {
        auth_info.response = 'Permit';
        return Promise.resolve(auth_info);
      }

      // Any other cases are allowed only with PERSON info area with Update
      position = inArrayPosition('PERSON', info_areas);
      auth_info.response = (position === -1 || !/^U$/g.test(info_areas[position].update_type ||
        !/^(Employment|Records)$/g.test(info_areas[position].limitation_value))) ? 'Deny' : 'Permit';
      return auth_info;
    case 'person_update_DoB-DoD':
      // This is used for updating date_of_birth, date_of_death, deceased, sex
      // in basic and personal_records sub resources
      position = inArrayPosition('PERSON', info_areas);
      auth_info.response = (position === -1 || !/^U$/g.test(info_areas[position].update_type ||
        !/^(Employment|Records)$/g.test(info_areas[position].limitation_value))) ? 'Deny' : 'Permit';
      return auth_info;
    case 'person_update_name':
    case 'person_update_id_card':
    case 'person_update_relationship':
      // If a person has the PERSON informational area with update
      // then they can update relationship information

      // If a person has the PERSON informational area with update
      // then they can update id_card information

      // This is used for updating surname, first_name, middle_name,
      // and derived fields rest_of_name, sort name
      // in basic sub resource
      position = inArrayPosition('PERSON', info_areas);
      auth_info.response = (position === -1 || !/^U$/g.test(info_areas[position].update_type)) ? 'Deny' : 'Permit';
      return auth_info;
    case 'person_update_citizenship':
      // This is used for updating citizenship_country_code
      // in basic sub resource
      const cit_results = await db.execute(`
        select nvl(st.year_term, 'NULL')  as "year_term", 
               p.citizenship_country_code as "citizenship_country_code" 
        from   iam.person p 
               left join stdreg.std_term_status st 
                      on p.person_id = st.person_id 
        where  p.byu_id = :BYU_ID`,
        [auth_info.resource_owner]);

      student = (cit_results.rows[0].year_term !== 'NULL');
      console.log('THING', cit_results.rows[0].citizenship_country_code + ':' + auth_info.new_cit_code);
      // Permit to update if self service
      // and if NOT changing to or from USA citizenship

      // Permit to update if resource owner IS NOT a student
      // and if self service

      // Permit to update if resource owner IS a student
      // and if self service
      // and current citizenship is not set
      if (auth_info.subject === auth_info.resource_owner && (!student ||
          (!/^USA$/g.test(cit_results.rows[0].citizenship_country_code) && !/^USA$/g.test(auth_info.new_cit_code)) ||
          (student && /^( |[?]{3})$/g.test(cit_results.rows[0].citizenship_country_code)))) {
        console.log('SELF SERVICE NON USA CHANGE');
        auth_info.response = 'Permit';
        return auth_info;
      }

      // Any other cases are allowed only with PERSON info area
      // AND Records or Employment limitation_value with Update
      position = inArrayPosition('PERSON', info_areas);
      auth_info.response = (position === -1 || !/^U$/g.test(info_areas[position].update_type ||
        !/^(Employment|Records)$/g.test(info_areas[position].limitation_value))) ? 'Deny' : 'Permit';
      return auth_info;
    case 'person_view_relationship':
      // If a person has the PERSON informational area
      // then they can view relationship information
      position = inArrayPosition('PERSON', info_areas);
      auth_info.response = (position === -1) ? 'Deny' : 'Permit';
      return auth_info;
    case 'person_delete_relationship':
      // If a person has the PERSON informational area with update
      // then they can update relationship information
      position = inArrayPosition('PERSON', info_areas);
      if (position === -1 || !/^U$/g.test(info_areas[position].update_type)) {
        auth_info.response = 'Deny';
        return auth_info;
      }
      else if (/^U$/g.test(info_areas[position].update_type)) {
        const rel_results = await db.execute(`
          select updated_by_id as "updated_by_id" 
          from iam.identity_relationship 
          where  byu_id = :BYU_ID 
                 and related_id = :RELATED_ID`,
          [
            auth_info.resource_owner,
            auth_info.related_byu_id
          ]);
        auth_info.response = (/^HR$/g.test(rel_results.rows[0].updated_by_id)) ? 'Deny' : 'Permit';
        return auth_info;
      }
      auth_info.response = 'Deny';
      return auth_info;
    case 'person_update_wso2_client_id':
      const wa_results = await db.execute(`
        select count(*) as "count" 
        from   gro.person_group 
        where  group_id = 'WSO2 ADMINISTRATOR' 
               and byu_id = :BYU_ID`,
        [auth_info.subject]);
      auth_info.response = (!wa_results.rows[0].count) ? 'Deny' : 'Permit';
      return auth_info;
    case 'person_view_lds_cred':
      const lds_results = await db.execute(`
        select count(*) as "count" 
        from   gro.person_group 
        where  group_id = 'VIEW_LDS_CRED' 
               and byu_id = :BYU_ID`,
        [auth_info.subject]);
      auth_info.response = (!lds_results.rows[0].count) ? 'Deny' : 'Permit';
      return auth_info;
    case 'person_is_lds_sync':
      const lds_acc_results = await db.execute(`
        select count(*) as "count" 
        from   gro.person_group 
        where  group_id = 'LDS_ACCOUNT' 
               and byu_id = :1`,
        [auth_info.subject]);
      auth_info.response = (!lds_acc_results.rows[0].count) ? 'Deny' : 'Permit';
      return auth_info;
    case 'person_update_cas_credential':
      const cas_results = await db.execute(`
        select count(*) as "count" 
        from   gro.person_group 
        where  group_id = 'CAS' 
               and byu_id = :BYU_ID`,
        [auth_info.subject]);
      auth_info.response = (!cas_results.rows[0].count) ? 'Deny' : 'Permit';
      return auth_info;
    case 'person_delete_person':
      position = inArrayPosition('PERSON', info_areas);
      auth_info.response = (position === -1 || !/^U$/g.test(info_areas[position].update_type) ||
        !/^Records$/g.test(info_areas[position].limitation_value)) ? 'Deny' : 'Permit';
      return auth_info;
    case 'person_lookup_ssn':
      // If a person has the SSN informational area with display or update
      //  they can lookup a person by SSN.

      position = inArrayPosition('SSN', info_areas);
      auth_info.response = (position === -1) ? 'Deny' : 'Permit';
      return auth_info;
    case 'person_restricted':
      //self service
      if (auth_info.subject === auth_info.resource_owner) {
        auth_info.response = 'Permit';
        return Promise.resolve(auth_info);
      }

      //or in group
      const rest_results = await db.execute(`
        select count(*) as "count" 
        from   gro.person_group 
        where  group_id = 'RESTRICTED' 
               and byu_id = :BYU_ID`,
        [auth_info.subject]);
      auth_info.response = (!rest_results.rows[0].count) ? 'Deny' : 'Permit';
      return auth_info;
    default:
      auth_info.text = 'Resource not found';
      auth_info.response = 'Deny';
      return auth_info;
  }
}

async function authz_handle_auth(auth_info_list) {
  try {
    const results = await db.execute(`
    select informational_area         as "info_area", 
           update_type                as "update_type", 
           nvl(limitation_value, ' ') as "limitation_value" 
    from   common.user_authorization cua 
           join iam.identity id 
             on cua.person_id = id.person_id 
    where  id.byu_id = :BYU_ID 
           and expired_date is null`, [auth_info_list[0].subject]);
    const info_areas = results.rows;

    return Promise.map(auth_info_list, auth_info => {

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
      // return aim.handle_auth(auth_info_out)
      //}
      // Add more authorizations here....

      switch (auth_info_out.resource) {
        //case 'aim...':
        default:
          auth_info_out.response = 'Deny';
          auth_info_out.text = 'Resource not found';
          return auth_info_out;
      }
    });
  } catch (err) {
    console.error(err.stack);
    return err;
  }
}

exports.getPermissions = async function (req, field_sets) {
  // console.log('verifiedJWTs: ', req.verifiedJWTs);
  const requirements = await authRequests(req.method, req.verifiedJWTs.prioritizedClaims.byuId, field_sets, req.params.byu_id, req);
  // console.log('requirements: ', requirements);
  const info_areas_list = await authz_handle_auth(requirements);
  // console.log('info_areas_list: ', info_areas_list);
  let permits = [];
  if (info_areas_list !== undefined) {
    for (let i = info_areas_list.length; i--;) {
      if (info_areas_list[i].response === 'Permit') {
        permits.push(info_areas_list[i].resource)
      }
    }
  }
  return permits;
};

exports.hasRestrictedRights = permissions => permissions.includes('person_restricted');

exports.canChangeNetId = permissions => permissions.includes('person_change_net_id');

exports.canChangePassword = permissions => permissions.includes('person_change_password');

exports.canAddPerson = permissions => permissions.includes('person_add_person');

exports.canUpdatePermanentResidentStatus = permissions => permissions.includes('person_update_permanent_resident_status');

exports.canMerge = permissions => permissions.includes('person_merge');

exports.canViewBasic = permissions => permissions.includes('person_view_basic');

exports.canViewContact = permissions => permissions.includes('person_view_contact');

exports.canUpdateContact = permissions => permissions.includes('person_update_contact');

exports.canViewSSN = permissions => permissions.includes('person_view_ssn');

exports.canUpdateSSN = permissions => permissions.includes('person_update_ssn');

exports.canViewGuests = permissions => permissions.includes('person_view_guests');

exports.canUpdateGuests = permissions => permissions.includes('person_update_guests');

exports.canUpdateDelegations = permissions => permissions.includes('person_update_delegations');

exports.canUpdatePreferredNameCard = permissions => permissions.includes('person_update_preferred_name_card');

exports.canViewGroups = permissions => permissions.includes('person_view_groups');

exports.canUpdateBasic = permissions => permissions.includes('person_update_basic');

exports.canUpdateIdCardUnlisted = permissions => permissions.includes('person_update_id_card_unlisted');

exports.canUpdateReligion = permissions => permissions.includes('person_update_religion');

exports.canUpdateDoB = permissions => permissions.includes('person_update_DoB-DoD');

exports.canUpdateName = permissions => permissions.includes('person_update_name');

exports.canUpdateIdCard = permissions => permissions.includes('person_update_id_card');

exports.canUpdateRelationship = permissions => permissions.includes('person_update_relationship');

exports.canUpdateCitizenship = permissions => permissions.includes('person_update_citizenship');

exports.canViewRelationship = permissions => permissions.includes('person_view_relationship');

exports.canDeleteRelationship = permissions => permissions.includes('person_delete_relationship');

exports.canUpdateWso2ClientId = permissions => permissions.includes('person_update_wso2_client_id');

exports.canViewLdsCred = permissions => permissions.includes('person_view_lds_cred');

exports.canIsLdsSync = permissions => permissions.includes('person_is_lds_sync');

exports.canUpdateCasCredential = permissions => permissions.includes('person_update_cas_credential');

exports.canDeletePerson = permissions => permissions.includes('person_delete_person');

exports.canLookupSSN = permissions => permissions.includes('person_lookup_ssn');
