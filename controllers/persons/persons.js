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

const moment = require('moment-timezone');
const basic = require('../basic/basic');
const auth = require('../auth');
const db = require('../db');
const sql = require('./sql');
const Enforcer = require('swagger-enforcer');
const utils = require('../utils');
const eventy = require('../event');
const addresses = require('../addresses/addresses');
const alias_domains = require('../alias_domains/alias_domains');
const credentials = require('../credentials/credentials');
const delegated_operations_performed = require('../delegated_operations_performed/delegated_operations_performed');
const email_addresses = require('../email_addresses/email_addresses');
const email_aliases = require('../email_aliases/email_aliases');
const employee_summaries = require('../employee_summaries/employee_summaries');
const ethnicities = require('../ethnicities/ethnicities');
const family_phones = require('../family_phones/family_phones');
const government_records = require('../government_records/government_records');
const group_membership_events = require('../group_membership_events/group_membership_events');
const group_memberships = require('../group_memberships/group_memberships');
const groups_administered = require('../groups_administered/groups_administered');
const id_cards = require('../id_cards/id_cards');
const languages = require('../languages/languages');
const my_delegators = require('../my_delegators/my_delegators');
const my_guests = require('../my_guests/my_guests');
const personal_records = require('../personal_records/personal_records');
const phones = require('../phones/phones');
const relationships = require('../relationships/relationships');
const student_summaries = require('../student_summaries/student_summaries');

exports.getPersons = async (definitions, query, permissions) => {
  let params = [];
  let sql_query_select = sql.getPersons.sql.select;
  let sql_query_from = sql.getPersons.sql.from;
  let sql_query_where = sql.getPersons.sql.where;

  if ('byu_id' in query) {
    let byu_id_query_array = query.byu_id.split(',');

    sql_query_where += ` and iam.person.byu_id in (`;

    for (let i = 0, length = byu_id_query_array.length; i < length; i++) {
      params.push(byu_id_query_array[i]);
      if (!/^[0-9]{9}$/g.test(byu_id_query_array[i])) {
        throw utils.Error(409, `Incorrect URL: 
          BYU_ID '${byu_id_query_array[i]}' must be a 9 digit number with no spaces or dashes`)
      }
      sql_query_where += (i === length - 1) ? `:byu${i})` : `:byu${i},`;
    }
  }
  if ('ssn' in query && auth.canLookupSSN(permissions)) {
    let ssn_query_array = query.ssn.split(',');

    sql_query_where += ` and iam.person.ssn in (`;

    for (let i = 0, length = ssn_query_array.length; i < length; i++) {
      params.push(ssn_query_array[i]);
      if (!/^[0-9]{9}$/g.test(ssn_query_array[i])) {
        throw utils.Error(409, `Incorrect URL: 
          SSN '${ssn_query_array[i]}' must be a 9 digit number with no spaces or dashes`);
      }
      sql_query_where += (i === length - 1) ? `:ssn${i})` : `:ssn${i},`;
    }
  } else if ('ssn' in query) {
    throw utils.Error(403, 'User not authorized to lookup by SSN');
  }
  if ('surname' in query) {
    let surname = `%${decodeURIComponent(query.surname).replace('*', '%').toLowerCase()}%`;
    params.push(surname);
    sql_query_where += ` and lower(iam.person.surname) like :s`;
  }
  if ('rest_of_name' in query) {
    let rest_of_name = `%${decodeURIComponent(query.rest_of_name).toLowerCase()}%`;
    params.push(rest_of_name);
    sql_query_where += ` and lower(iam.person.rest_of_name) like :ron`;
  }
  if ('preferred_surname' in query) {
    let preferred_surname = `%${decodeURIComponent(query.preferred_surname).toLowerCase()}%`;
    params.push(preferred_surname);
    sql_query_where += ` and lower(iam.person.preferred_surname) like :ps`;
  }
  if ('preferred_first_name' in query) {
    let preferred_first_name = `%${decodeURIComponent(query.preferred_first_name).toLowerCase()}%`;
    params.push(preferred_first_name);
    sql_query_where += ` and lower(iam.person.preferred_first_name) like :pf`;
  }
  if ('sex' in query) {
    //decode for question mark
    let sex = decodeURIComponent(query.sex).toUpperCase();
    params.push(sex);
    sql_query_where += ` and iam.person.sex = :g`;
  }
  if ('deceased' in query) {
    let deceased = (query.deceased) ? "Y" : "N";
    params.push(deceased);
    sql_query_where += ` and nvl(iam.person.deceased, 'N') = :d`;
  }
  if ('marital_status' in query) {
    //decode for question mark
    let marital_status = decodeURIComponent(query.marital_status).toUpperCase();
    params.push(marital_status);
    sql_query_where += ` and iam.person.marital_status = :ms`;
  }
  if ('religion_code' in query) {
    //decode for question marks
    let religion_code = `%${decodeURIComponent(query.religion_code).toUpperCase()}%`;
    params.push(religion_code);
    sql_query_where += ` and iam.person.religion_code like :r`;
  }
  if ('citizenship_country_code' in query) {
    let citizenship_country_code = `%${decodeURIComponent(query.citizenship_country_code).toUpperCase()}%`;
    params.push(citizenship_country_code);
    sql_query_where += ` and iam.person.citizenship_country_code like :ccc`;
  }
  if ('home_town' in query) {
    let home_town = decodeURIComponent(query.home_town).replace('*', '%').toLowerCase();
    params.push(home_town);
    sql_query_where += ` and lower(iam.person.home_town) like :ht`;
  }
  if ('home_state_code' in query) {
    let home_state_code = `%${decodeURIComponent(query.home_state_code).toUpperCase()}%`;
    params.push(home_state_code);
    sql_query_where += ` and iam.person.home_state_code like :hsc`;
  }
  if ('home_country_code' in query) {
    let home_country_code = `%${decodeURIComponent(query.home_country_code).toUpperCase()}%`;
    params.push(home_country_code);
    sql_query_where += ` and iam.person.home_country_code like :hcc`;
  }
  if ('restricted' in query) {
    let restricted = (query.restricted) ? "Y" : "N";
    params.push(restricted);
    sql_query_where += ` and nvl(iam.person.restricted, 'N') = :x`
  }
  if ('visa_type' in query) {
    let visa_type = `%${decodeURIComponent(query.visa_type).toUpperCase()}%`;
    params.push(visa_type);
    sql_query_where += ` and REGEXP_REPLACE(visa_type,'-','') = REGEXP_REPLACE(:vt,'-','')`;
  }
  if ('net_id' in query) {
    let net_id_query_array = query.net_id.split(',');

    sql_query_from += ` left join iam.credential n on iam.person.byu_id = n.byu_id`;

    sql_query_where += ` and n.credential_id in (`;

    let length = net_id_query_array.length;
    for (let i = 0; i < length; i++) {
      params.push(net_id_query_array[i]);
      if (!/^[a-z][a-z0-9]{0,8}$/g.test(net_id_query_array[i])) {
        throw utils.Error(409, 'Incorrect URL: NET_ID must be a 1 to 9 alphanumeric character string each net_id must be separated by a comma')
      }
      sql_query_where += (i === length - 1) ? ` :net${i})` : ` :net${i},`;
    }
    sql_query_where += ` and n.credential_type = 'NET_ID'`;
  }
  if ('credential_type' in query) {
    let credential_type = query.credential_type;

    if (!/^NET_ID$/g.test(credential_type)) {
      if (!auth.canViewBasic(permissions)) {
        throw utils.Error(403, `User not authorized to lookup by ${credential_type}`);
      }
    }

    params.push(credential_type);

    sql_query_from += ` left join iam.credential ct on iam.person.byu_id = ct.byu_id`;

    sql_query_where += ` and ct.credential_type = :ct`;
    if ('credential_id' in query) {
      let credential_id = query.credential_id;

      params.push(credential_id);
      sql_query_where += ` and ct.credential_id = :cid`;
    }
  }
  if (!('credential_type' in query) && ('+credential_id' in query)) {
    throw utils.Error(409, 'Invalid Query: You must include credential_type with credential_id');
  }
  if ('user_name' in query) {
    let user_name_query_array = query.user_name.split(',');

    sql_query_from += ` left join iam.credential un on iam.person.byu_id = un.byu_id`;

    sql_query_where += ` and un.user_name in (`;

    for (let i = 0, length = user_name_query_array.length; i < length; i++) {
      params.push(user_name_query_array[i]);
      sql_query_where += (i === length - 1) ? ` :un${i})` : ` :un${i},`;
    }
  }
  if ('email_address' in query) {
    let email_address_query_array = query.email_address.split(',');

    sql_query_from += ` left join iam.email_address ea on iam.person.byu_id = ea.byu_id`;

    sql_query_where += ` and lower(ea.email_address) like`;

    for (let i = 0, length = email_address_query_array.length; i < length; i++) {
      params.push(decodeURIComponent(email_address_query_array[i]).replace('*', '%').toLowerCase());
      sql_query_where += (i === length - 1) ? ` :ea${i}` : ` :ea${i} or ea.email_address like`;
    }
  }
  if ('phone_number' in query) {
    let phone_number_query_array = query.phone_number.split(',');

    sql_query_from += ` left join iam.phone_number pn on iam.person.byu_id = pn.byu_id`;
    sql_query_where += ` and pn.lookup_number in (`;

    for (let i = 0, length = phone_number_query_array.length; i < length; i++) {
      params.push(decodeURIComponent(phone_number_query_array[i]).replace(/\D/g, ''));
      sql_query_where += (i === length - 1) ? ` :pn${i})` : ` :pn${i},`;
    }
  }
  if ('employee_type' in query) {
    let employee_type = query.employee_type;
    for (let i = 3; i--;) {
      params.push(employee_type)
    }
    sql_query_from += ' left join hr.per_warehouse pwh' +
      ' on iam.person.byu_id = pwh.byu_id';

    sql_query_where += ' and pwh.classification = substr(:et1, 1, 3)' +
      ' and hr.per_warehouse.status = substr(:et2, 5, 2)' +
      ' and hr.per_warehouse.standing = substr(:et3, 8, 3)'
  }
  if ('student_status' in query) {
    let class_standing;
    let reg_status;
    let reg_eligibility;
    let class_standing_set = false;
    switch (decodeURIComponent(query.student_status).toLowerCase()) {
      case 'freshman':
        class_standing = '1';
        class_standing_set = true;
        break;
      case 'sophomore':
        class_standing = '2';
        class_standing_set = true;
        break;
      case 'junior':
        class_standing = '3';
        class_standing_set = true;
        break;
      case 'senior':
        class_standing = '4';
        class_standing_set = true;
        break;
      case 'post baccalaureate non degree':
        class_standing = '6';
        class_standing_set = true;
        break;
      case 'masters program':
        class_standing = '7';
        class_standing_set = true;
        break;
      case 'doctorate program':
        class_standing = '8';
        class_standing_set = true;
        break;
      case 'bgs':
        reg_status = 'B';
        reg_eligibility = 'BGS';
        break;
      case 'audit':
        reg_status = 'A';
        reg_eligibility = 'AO';
        break;
      case 'concurrent enrollment':
        reg_status = '2';
        reg_eligibility = 'CH';
        break;
      case 'visiting student':
        reg_status = 'V';
        reg_eligibility = 'SO';
        break;
      case 'elc':
        reg_status = 'E';
        reg_eligibility = 'LC';
        break;
      case 'evening school':
        reg_status = '3';
        reg_eligibility = 'CE';
        break;
      case 'salt lake center student':
        reg_status = '3';
        reg_eligibility = 'SL';
        break;
      default:
        class_standing = null;
        class_standing_set = true;
    }
    sql_query_from += ` left join ods.std_reg_eligibility sre on iam.person.person_id = sre.person_id`;

    if (class_standing_set) {
      params.push(class_standing);
      sql_query_where += ` and sre.class_standing = :cs`;
    }
    else {
      params.push(reg_status);
      params.push(reg_eligibility);
      sql_query_where += ` and sre.reg_status = :rs and sre.reg_eligibility = :re`;
    }
  }
  const results = await db.execute(`${sql_query_select}${sql_query_from}${sql_query_where}`, params);
  const values = (auth.hasRestrictedRights(permissions))? (
    await Promise.all(results.rows.map((row) => exports.getPerson(definitions, row.byu_id, query, permissions)))
  ) : (
    await Promise.all(results.rows.filter(row => /^N$/.test(row.restricted)).map(row => exports.getPerson(definitions, row.byu_id, query, permissions)))
  );


  const persons = Enforcer.applyTemplate(definitions.persons, definitions,
    {
      collection_size: results.rows.length, // TODO: Can we use the length of the results.rows? We may get results back with no addresses but have results.
      page_start: 0,
      page_end: results.rows.length,
      page_size: results.rows.length,
      default_page_size: 1,
      maximum_page_size: 100,
      field_sets_returned: query.field_sets,
      persons_values: values
    });
// TODO: Should we embellish the HATEOAS 'self' links with the query parameters specified on this specific request?
// TODO: Set :page_size in HATEOAS link to size of results from SQL query
  persons.values = values;
  return persons;
};

exports.getPerson = async (definitions, byu_id, query, permissions) => {
  const promises = [];
  const result = {};
  const all_field_sets = [
    {
      name: 'addresses',
      functionName: addresses.getAddresses
    },
    {
      name: 'alias_domains',
      functionName: alias_domains.getAliasDomains
    },
    {
      name: 'credentials',
      functionName: credentials.getCredentials
    },
    {
      name: 'delegated_operations_performed',
      functionName: delegated_operations_performed.getDelegatedOperationsPerformed
    },
    {
      name: 'email_addresses',
      functionName: email_addresses.getEmailAddresses
    },
    {
      name: 'email_aliases',
      functionName: email_aliases.getEmailAliases
    },
    {
      name: 'employee_summaries',
      functionName: employee_summaries.getEmployeeSummaries
    },
    {
      name: 'ethnicities',
      functionName: ethnicities.getEthnicities
    },
    {
      name: 'family_phones',
      functionName: family_phones.getFamilyPhones
    },
    {
      name: 'government_records',
      functionName: government_records.getGovernmentRecords
    },
    {
      name: 'group_membership_events',
      functionName: group_membership_events.getGroupMembershipEvents
    },
    {
      name: 'group_memberships',
      functionName: group_memberships.getGroupMemberships
    },
    {
      name: 'groups_administered',
      functionName: groups_administered.getGroupsAdministered
    },
    {
      name: 'id_cards',
      functionName: id_cards.getIdCards
    },
    {
      name: 'languages',
      functionName: languages.getLanguages
    },
    {
      name: 'my_delegators',
      functionName: my_delegators.getMyDelegators
    },
    {
      name: 'my_guests',
      functionName: my_guests.getMyGuests
    },
    {
      name: 'personal_records',
      functionName: personal_records.getPersonalRecords
    },
    {
      name: 'phones',
      functionName: phones.getPhones
    },
    {
      name: 'relationships',
      functionName: relationships.getRelationships
    },
    {
      name: 'student_summaries',
      functionName: student_summaries.getStudentSummaries
    }
  ];

  if (query.field_sets.includes('basic')) {
    promises.push(basic.getBasic(definitions, byu_id, permissions)
      .then(basic_result => {
        result.basic = basic_result;
      })
      .catch(error => {
        console.error(error.stack);
        result.basic = Enforcer.applyTemplate(definitions.basic, null,
          {
            byu_id: byu_id,
            validation_response_code: error.status || 500,
            validation_response_message: error.message || 'Internal Server Error'
          }, { ignoreMissingRequired: false });
        //
      }));
  }

  for (let i = 0, length = all_field_sets.length; i < length; i++) {
    if (query.field_sets.includes(all_field_sets[i].name)) {
      promises.push(all_field_sets[i].functionName(definitions, byu_id, permissions)
        .then(function (field_set_result) {
          result[all_field_sets[i].name] = field_set_result;
        })
        .catch(function (error) {
          let objectResult = { values: [] };
          objectResult.metadata = Enforcer.applyTemplate(definitions.sub_level_metadata, null,
            {
              validation_response_code: error.status || 500,
              validation_response_message: error.message || 'Internal Server Error'
            });
          result[all_field_sets[i].name] = objectResult;
        }));
    }
  }

  await Promise.all(promises);
  return result;
};

exports.modifyPerson = async (definitions, byu_id, authorized_byu_id, body, permissions) => {
  return basic.putBasic(definitions, byu_id, authorized_byu_id, body, permissions);
};

async function generateByuId(connection) {
  const sql_y_random = `
      select y_random(9) as "card_id" 
      from   dual`;
  const sql_count = `
      select count(*) as "count" 
      from   person_log 
      where  byu_id = :BYU_ID`;


  async function validate_id(attempts_left) {
    if (!attempts_left) {
      throw utils.Error(504, `Unable to generate a valid BYU_ID. Please try again.`);
    }

    const y_rand_num = await connection.execute(sql_y_random, []);
    const card_id = y_rand_num.rows[0].card_id;

    const is_valid_card_id = (
      !(card_id >= "000080000" && card_id <= "000199999") &&
      !(card_id >= "042000000" && card_id <= "042309999") &&
      !(card_id >= "051650000" && card_id <= "051659999") &&
      !(card_id >= "777000000" && card_id <= "777009999") &&
      !(card_id >= "800000000" && card_id <= "800100999") &&
      !(card_id >= "887000000" && card_id <= "889999999") &&
      !(card_id >= "999000000"));

    if (is_valid_card_id) {
      const count = await  connection.execute(sql_count, [card_id]);

      if (!count.rows[0].count) {
        return card_id;
      }
      return validate_id(attempts_left - 1);
    }
    return validate_id(attempts_left - 1);
  }

  return Promise.resolve(validate_id(10));
}

async function generatePersonId(connection) {
  const sql_person_id = `
    select ( substr(lpad(person_id_seq.nextval, 12, '0'), 10) 
             || '2' 
             || substr(lpad(person_id_seq.nextval, 12, '0'), 6, 4) 
             || '2' ) as "person_id" 
    from   dual`;
  const sql_count = `
    select count(*) as "count" 
    from   (select person_id 
            from   person_log 
            where  person_id = :PERSON_ID 
            union 
            select identifier 
            from   identifier 
            where  identifier = :PERSON_ID)`;

  async function validate_person_id(attempts_left) {
    if (!attempts_left) {
      throw utils.Error(504, 'Unable to generate a valid PERSON_ID. Please try again.')
    }
    let person_id = await connection.execute(sql_person_id, []);
    person_id = person_id.rows[0].person_id;

    const count = await connection.execute(sql_count, [person_id, person_id]);

    if (!count.rows[0].count) {
      return person_id;
    }
    return validate_person_id(attempts_left - 1);
  }

  return Promise.resolve(validate_person_id(10));
}

async function personAddedEvents(connection, new_body) {
  console.log("EVENT NEW BODY", new_body);
  try {
    const source_dt = new Date().toISOString();
    let event_type = "Person Added";
    let event_type2 = "Person Added v2";
    const domain = "edu.byu";
    const entity = "BYU-IAM";
    let filters = [
      "identity_type",
      new_body.identity_type,
      "employee_type",
      new_body.employee_type,
      "student_status",
      new_body.student_status
    ];
    const basic_url = `https://api.byu.edu/byuapi/persons/v1/?byu_id=${new_body.byu_id}&field_sets=basic,personal_records,government_records`;
    let secure_url = `https://api.byu.edu/domains/legacy/identity/secureurl/v1/`;
    let sql_query = '';
    let params = [];
    const header = [
      "domain",
      domain,
      "entity",
      entity,
      "event_type",
      event_type,
      "source_dt",
      source_dt,
      "event_dt",
      ' ',
      "event_id",
      ' '
    ];
    console.log(new_body.restricted);
    const restricted = /^Y$/g.test(new_body.restricted);
    console.log(restricted);
    if (restricted) {
      if (new_body.person_added) {
        let event_frame = {
          "events": {
            "event": []
          }
        };
        let body = [
          "person_id",
          new_body.person_id,
          "byu_id",
          new_body.byu_id,
          "net_id",
          new_body.net_id,
          "updated_by_id",
          new_body.updated_by_id,
          "date_time_updated",
          new_body.date_time_updated,
          "created_by_id",
          new_body.created_by_id,
          "date_time_created",
          new_body.date_time_created,
          "callback_url",
          basic_url,
          "surname",
          new_body.surname,
          "rest_of_name",
          new_body.rest_of_name,
          "first_name",
          new_body.first_name,
          "middle_name",
          new_body.middle_name,
          "suffix",
          new_body.suffix,
          "preferred_first_name",
          new_body.preferred_first_name,
          "sort_name",
          new_body.sort_name,
          "home_town",
          new_body.home_town,
          "home_state_code",
          new_body.home_state_code,
          "home_country_code",
          new_body.home_country_code,
          "deceased",
          new_body.deceased,
          "sex",
          new_body.sex,
          "display_name",
          new_body.display_name,
          "prefix",
          ' ',
          "surname_position",
          ' '
        ];
        let event = eventy.Builder(header, body);
        event_frame.events.event.push(event);

        //start of event v2
        header[5] = event_type2;
        //get rid of prefix and surname position
        for (let i = 6; i--;) {
          body.pop()
        }
        body.unshift(new_body.preferred_surname);
        body.unshift("preferred_surname");
        body.unshift(new_body.preferred_name);
        body.unshift("preferred_name");
        body.unshift(new_body.high_school_code);
        body.unshift("high_school_code");
        event = eventy.Builder(header, body, filters);
        event_frame.events.event.push(event);

        sql_query = db.raiseEvent;
        params = [];
        params.push(JSON.stringify(event_frame));
        await connection.execute(sql_query, params, { autoCommit: true });
        console.log("ENQUEUE SQL", sql_query);
        console.log("ENQUEUE PARAMS", params);
        sql_query = db.enqueue;
        await connection.execute(sql_query, params);

        let name_event_frame = {
          "events": {
            "event": []
          }
        };
        event_type = "Name Added";
        header[5] = event_type;
        for (let i = 6; i--;) {
          body.shift()
        }
        for (let i = 16; i--;) {
          body.pop()
        }
        body.push("prefix");
        body.push(' ');
        body.push("surname_position");
        body.push(' ');
        body.push("display_name");
        body.push(new_body.display_name);
        let name_event = eventy.Builder(header, body);
        name_event_frame.events.event.push(name_event);

        event_type2 = "Name Added v2";
        header[5] = event_type2;
        for (let i = 6; i--;) {
          body.pop()
        }
        body.push("preferred_surname");
        body.push(new_body.preferred_surname);
        body.push("preferred_name");
        body.push(new_body.preferred_name);
        body.push("name_fnf");
        body.push(new_body.name_fnf);
        body.push("name_lnf");
        body.push(new_body.sort_name);
        name_event = eventy.Builder(header, body, filters);
        name_event_frame.events.event.push(name_event);

        params = [];
        sql_query = db.raiseEvent;
        params.push(JSON.stringify(name_event_frame));
        await connection.execute(sql_query, params, { autoCommit: true });

        console.log("ENQUEUE SQL", sql_query);
        console.log("ENQUEUE PARAMS", params);
        sql_query = db.enqueue;
        await connection.execute(sql_query, params);


        if (new_body.identity_added) {
          let identity_event_frame = {
            "events": {
              "event": []
            }
          };
          event_type = "Identity Added";
          header[5] = event_type;
          body = [
            "person_id",
            person_id,
            "byu_id",
            byu_id,
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
            "identity_name",
            preferred_name,
            "identity_type",
            identity_type
          ];
          let identity_event = eventy.Builder(header, body);
          identity_event_frame.events.event.push(identity_event);

          event_type2 = "Identity Added v2";
          header[5] = event_type2;
          for (let i = 6; i--;) {
            body.pop()
          }
          body.push("preferred_surname");
          body.push(new_body.preferred_surname);
          body.push("preferred_name");
          body.push(new_body.preferred_name);
          body.push("name_fnf");
          body.push(new_body.name_fnf);
          body.push("name_lnf");
          body.push(new_body.sort_name);
          identity_event = eventy.Builder(header, body, filters);
          identity_event_frame.events.event.push(identity_event);

          sql_query = db.raiseEvent;
          params = [];
          params.push(JSON.stringify(identity_event_frame));
          await connection.execute(sql_query, params, { autoCommit: true });

          console.log("ENQUEUE SQL", sql_query);
          console.log("ENQUEUE PARAMS", params);
          sql_query = db.enqueue;
          await connection.execute(sql_query, params);
        }
      }
    } else {
      sql_query = db.intermediaryId.put;
      params = [
        basic_url,
        ' ',    // actor
        ' ',    // group_id
        new_body.created_by_id
      ];
      await connection.execute(sql_query, params);
      sql_query = db.intermediaryId.get;
      params = [basic_url];
      const results = await connection.execute(sql_query, params);

      secure_url += results.rows[0].intermediary_id;

      if (new_body.person_added) {
        let event_frame = {
          "events": {
            "event": []
          }
        };
        let restricted_body = [
          "person_id",
          ' ',
          "byu_id",
          ' ',
          "net_id",
          ' ',
          "updated_by_id",
          ' ',
          "date_time_updated",
          ' ',
          "created_by_id",
          ' ',
          "date_time_created",
          ' ',
          "secure_url",
          secure_url,
          "surname",
          ' ',
          "rest_of_name",
          ' ',
          "first_name",
          ' ',
          "middle_name",
          ' ',
          "suffix",
          ' ',
          "preferred_first_name",
          ' ',
          "sort_name",
          ' ',
          "home_town",
          ' ',
          "home_state_code",
          ' ',
          "home_country_code",
          ' ',
          "deceased",
          ' ',
          "sex",
          ' ',
          "display_name",
          ' ',
          "prefix",
          ' ',
          "surname_position",
          ' '
        ];
        let event = eventy.Builder(header, restricted_body);
        event_frame.events.event.push(event);

        header[5] = event_type2;
        //get rid of prefix and surname position
        for (let i = 6; i--;) {
          restricted_body.pop()
        }
        restricted_body.unshift("high_school_code");
        restricted_body.unshift(' ');
        filters.push("restricted");
        filters.push(restricted);
        event = eventy.Builder(header, restricted_body, filters);
        event_frame.events.event.push(event);

        sql_query = db.raiseEvent;
        params = [];
        params = [JSON.stringify(event_frame)];
        await connection.execute(sql_query, params);
        console.log("ENQUEUE SQL", sql_query);
        console.log("ENQUEUE PARAMS", params);
        sql_query = db.enqueue;
        await connection.execute(sql_query, params);
        let name_event_frame = {
          "events": {
            "event": []
          }
        };
        event_type = "Name Added";
        header[5] = event_type;
        for (let i = 6; i--;) {
          restricted_body.shift()
        }
        for (let i = 16; i--;) {
          restricted_body.pop()
        }
        restricted_body.push("prefix");
        restricted_body.push(' ');
        restricted_body.push("surname_position");
        restricted_body.push(' ');
        restricted_body.push("display_name");
        restricted_body.push(' ');
        let name_event = eventy.Builder(header, restricted_body);
        name_event_frame.events.event.push(name_event);

        event_type2 = "Name Added v2";
        header[5] = event_type2;
        for (let i = 6; i--;) {
          restricted_body.pop()
        }
        restricted_body.push("preferred_surname");
        restricted_body.push(' ');
        restricted_body.push("preferred_name");
        restricted_body.push(' ');
        restricted_body.push("name_fnf");
        restricted_body.push(' ');
        restricted_body.push("name_lnf");
        restricted_body.push(' ');
        name_event = eventy.Builder(header, restricted_body, filters);
        name_event_frame.events.event.push(name_event);

        sql_query = db.raiseEvent;
        params = [];
        params = [JSON.stringify(name_event_frame)];
        await connection.execute(sql_query, params, { autoCommit: true });

        console.log("ENQUEUE SQL", sql_query);
        console.log("ENQUEUE PARAMS", params);
        sql_query = db.enqueue;
        await connection.execute(sql_query, params);


        if (new_body.identity_added) {
          let identity_event_frame = {
            "events": {
              "event": []
            }
          };
          event_type = "Identity Added";
          header[5] = event_type;
          restricted_body = [
            "person_id",
            ' ',
            "byu_id",
            ' ',
            "updated_by_id",
            ' ',
            "date_time_updated",
            ' ',
            "created_by_id",
            ' ',
            "date_time_created",
            ' ',
            "secure_url",
            secure_url,
            "identity_name",
            ' ',
            "identity_type",
            ' '
          ];
          let identity_event = eventy.Builder(header, restricted_body);
          identity_event_frame.events.event.push(identity_event);

          event_type2 = "Identity Added v2";
          header[5] = event_type2;
          for (let i = 6; i--;) {
            restricted_body.pop()
          }
          restricted_body.push("preferred_surname");
          restricted_body.push(' ');
          restricted_body.push("preferred_name");
          restricted_body.push(' ');
          restricted_body.push("name_fnf");
          restricted_body.push(' ');
          restricted_body.push("name_lnf");
          restricted_body.push(' ');
          identity_event = eventy.Builder(header, restricted_body, filters);
          identity_event_frame.events.event.push(identity_event);

          sql_query = db.raiseEvent;
          params = [];
          params = [JSON.stringify(identity_event_frame)];
          await connection.execute(sql_query, params, { autoCommit: true });

          console.log("ENQUEUE SQL", sql_query);
          console.log("ENQUEUE PARAMS", params);
          sql_query = db.enqueue;
          await connection.execute(sql_query, params);
        }
      }
    }
  } catch (error) {
    console.error(error.stack);
    throw utils.Error(207, 'Person Created, Event Raising Failed');
  }
}

function processBody(authorized_byu_id, body) {
  let current_date_time = moment();
  current_date_time = current_date_time.clone().tz('America/Denver');
  let new_body = {};
  new_body.byu_id = body.byu_id || '';
  new_body.person_id = body.person_id || '';
  new_body.surname = body.surname || '';
  new_body.first_name = body.first_name || '';
  new_body.preferred_surname = body.preferred_surname || body.surname;
  new_body.preferred_first_name = body.preferred_first_name || body.first_name;
  new_body.preferred_name = `${new_body.preferred_first_name} ${new_body.preferred_surname}`;
  new_body.middle_name = body.middle_name || ' ';
  new_body.suffix = body.suffix || ' ';
  new_body.home_town = body.home_town || ' ';
  new_body.home_state_code = body.home_state_code || '??';
  new_body.home_country_code = body.home_country_code || '???';
  new_body.high_school_code = body.high_school_code || ' ';
  new_body.rest_of_name = (new_body.middle_name === ' ') ? new_body.first_name.trim() : (
    `${new_body.first_name} ${new_body.middle_name}`);
  new_body.sort_name = `${new_body.surname}, ${new_body.rest_of_name}`;
  new_body.citizenship_country_code = body.citizenship_country_code || '???';
  new_body.birth_country_code = body.birth_country_code || '???';
  new_body.ssn = body.ssn || ' ';
  new_body.ssn_verification_date = body.ssn_verification_date || '';
  new_body.visa_type = body.visa_type || ' ';
  new_body.visa_type_source = body.visa_type_source || ' ';
  new_body.i20_expiration_date = body.i20_expiration_date || '';
  new_body.updated_by_id = (!body.updated_by_id || !body.updated_by_id.trim()) ? authorized_byu_id : body.updated_by_id;
  if (!body.date_time_updated || !body.date_time_updated.trim()) {
    new_body.date_time_updated = current_date_time.format('YYYY-MM-DD HH:mm:ss.SSS');
  } else {
    new_body.date_time_updated = moment.tz(body.date_time_updated, 'America/Danmarkshavn');
    new_body.date_time_updated = new_body.date_time_updated.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
  }
  new_body.created_by_id = (!body.created_by_id || !body.created_by_id.trim()) ? authorized_byu_id : body.created_by_id;
  if (!body.date_time_created || !body.date_time_created.trim()) {
    new_body.date_time_created = current_date_time.format('YYYY-MM-DD HH:mm:ss.SSS');
  } else {
    new_body.date_time_created = moment.tz(body.date_time_created, 'America/Danmarkshavn');
    new_body.date_time_created = new_body.date_time_created.clone().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss.SSS');
  }
  new_body.sex = (/^[?FM]$/g.test(body.sex)) ? body.sex : '?';
  new_body.religion_code = body.religion_code || '???';
  new_body.lds_unit_number = body.lds_unit_number || ' ';
  new_body.lds_confirmation_date = body.lds_confirmation_date || '';
  new_body.date_of_birth = body.date_of_birth || '';
  new_body.date_of_death = body.date_of_death || '';
  new_body.deceased = (body.deceased) ? 'Y' : 'N';
  new_body.marital_status = body.marital_status || '?';
  new_body.citizenship_country_code = body.citizenship_country_code || '???';
  new_body.birth_country_code = body.birth_country_code || "???";
  new_body.ssn = body.ssn || ' ';
  new_body.ssn_verification_date = body.ssn_verification_date || '';
  new_body.visa_type = body.visa_type || ' ';
  new_body.visa_type_source = body.visa_type_source || ' ';
  new_body.i20_expiration_date = body.i20_expiration_date || '';
  new_body.display_name = new_body.preferred_name;
  new_body.name_fnf = (new_body.suffix === ' ') ? `${new_body.rest_of_name} ${new_body.surname}` : (
    `${new_body.rest_of_name} ${new_body.surname} ${new_body.suffix}`);
  new_body.restricted = (body.restricted) ? 'Y' : 'N';

  new_body.date_time_ferpa_last_displayed = '';
  new_body.from_time_ferpa_last_displayed = '';
  new_body.test_record_responsible_id = '';
  new_body.validation_phrase = '';
  new_body.identity_name = new_body.preferred_name;
  new_body.identity_added = false;
  new_body.person_added = false;
  new_body.change_type = 'A';
  new_body.identity_type = 'Person';
  new_body.from_identity_name = ' ';
  new_body.from_test_responsible_id = '';
  new_body.from_validation_phrase = '';
  new_body.from_date_of_birth = '';
  new_body.from_deceased = ' ';
  new_body.from_date_of_death = '';
  new_body.from_sex = ' ';
  new_body.from_marital_status = ' ';
  new_body.from_religion_code = ' ';
  new_body.from_lds_unit_number = ' ';
  new_body.from_citizenship_country_code = ' ';
  new_body.from_birth_country_code = ' ';
  new_body.from_home_town = ' ';
  new_body.from_home_state_code = ' ';
  new_body.from_home_country_code = ' ';
  new_body.from_high_school_code = ' ';
  new_body.from_restricted = ' ';
  new_body.from_ssn = ' ';
  new_body.from_ssn_verification_date = '';
  new_body.from_visa_type = ' ';
  new_body.from_i20_expiration_date = '';
  new_body.from_visa_type_source = ' ';
  new_body.from_lds_confirmation_date = '';
  new_body.from_surname = ' ';
  new_body.from_rest_of_name = ' ';
  new_body.from_suffix = ' ';
  new_body.from_preferred_first_name = ' ';
  new_body.from_preferred_surname = ' ';
  new_body.from_preferred_name = ' ';
  new_body.from_sort_name = ' ';
  new_body.from_first_name = ' ';
  new_body.from_middle_name = ' ';

  let error = false;
  let msg = `Invalid Body:`;
  if (!utils.isValidStateCode(new_body.home_state_code, new_body.home_country_code)) {
    msg += `\n\t${new_body.home_state_code} is an invalid state_code for the given country code`;
    error = true;
  }

  if (new_body.date_of_birth && (moment.tz(new_body.date_of_birth, 'YYYY-MM-DD', 'America/Denver') > current_date_time.endOf('day') ||
      moment(new_body.date_of_birth, 'YYYY-MM-DD') < moment('1850-01-01', 'YYYY-MM-DD'))) {
    msg += `\n\tdate_of_birth must be after 1850 and before tomorrow`;
    error = true;
  }

  if (new_body.date_of_death && (moment(new_body.date_of_death, 'YYYY-MM-DD', 'America/Denver') > current_date_time.endOf('day') ||
      moment(new_body.date_of_death, 'YYYY-MM-DD') < moment(new_body.date_of_birth, 'YYYY-MM-DD'))) {
    msg += `\n\tdate_of_death must be after date_of_birth and before tomorrow`;
    error = true;
  }

  if (new_body.lds_confirmation_date && (moment.tz(new_body.lds_confirmation_date, 'YYYY-MM-DD', 'America/Denver') > current_date_time.endOf('day') ||
      (new_body.date_of_birth && moment(new_body.lds_confirmation_date, 'YYYY-MM-DD') < moment(new_body.date_of_birth, 'YYYY-MM-DD').add(8, 'years')))) {
    msg += `\n\tlds_confirmation_date must be after 8th birthday and before tomorrow`;
    error = true;
  }

  if (!utils.isValidReligionCode(new_body.religion_code)) {
    msg += `\n\t${new_body.religion_code} is an invalid religion code.`;
    error = true;
  }

  if (new_body.ssn_verification_date && (moment(new_body.ssn_verification_date, 'YYYY-MM-DD') < moment('2004-01-01', 'YYYY-MM-DD') ||
      moment.tz(new_body.ssn_verification_date, 'YYYY-MM-DD', "America/Denver") > current_date_time.endOf('day'))) {
    msg += `\n\tssn_verification_date must be after 2004 and before tomorrow`;
    error = true;
  }

  if (error) {
    throw utils.Error(409, msg);
  }
  return new_body;
}

function getStateName(state_code, country_code) {
  const state_codes = require('../../meta/states/stateCodes.json');
  if (/^(|[? ]+)$/g.test(state_code)) {
    return 'Unknown';
  }

  for (let i = state_codes.items.length; i--;) {
    if (state_codes.items[i].state_code === state_code &&
      state_codes.items[i].country_code === country_code) {
      return state_codes.items[i].state;
    }
  }

  return 'Unknown';
}

function getCountryName(country_code) {
  const country_codes = require('../../meta/countries/countryCodes.json');
  if (/^(|[? ]+)$/g.test(country_code)) {
    return 'Unknown';
  }

  for (let i = country_codes.items.length; i--;) {
    if (country_codes.items[i].country_code === country_code) {
      return country_codes.items[i].country;
    }
  }

  return 'Unknown';
}

function getReligionName(religion_code) {
  const religion_codes = require('../../meta/religions/religionCodes.json');
  if (/^(|[? ]+)$/g.test(religion_code)) {
    return 'Religion Unidentified';
  }
  for (let i = religion_codes.items.length; i--;) {
    if (religion_codes.items[i].religion_code === religion_code) {
      return religion_codes.items[i].religion_name;
    }
  }
  return 'Religion Unidentified';
}

function getHighSchool(high_school_code) {
  const high_school_codes = require('../../meta/high_schools/highSchoolCodes.json');
  if (/^(|[? ]+)$/g.test(high_school_code)) {
    return {};
  }

  for (let i = high_school_codes.items.length; i--;) {
    if (high_school_codes.items[i].high_school_code === high_school_code) {
      return high_school_codes.items[i];
    }
  }
  return {};
}

function mapBasic(definitions, row, name_api_type, basic_api_type) {
  const high_school = getHighSchool(row.high_school_code);
  row.date_time_updated = moment.tz(row.date_time_updated, 'YYYY-MM-DD HH:mm:ss.SSS', 'America/Denver');
  row.date_time_updated = row.date_time_updated.clone().tz('America/Danmarkshavn').toISOString();
  row.date_time_created = moment.tz(row.date_time_created, 'YYYY-MM-DD HH:mm:ss.SSS', 'America/Denver');
  row.date_time_created = row.date_time_created.clone().tz('America/Danmarkshavn').toISOString();

  return Enforcer.applyTemplate(definitions.basic, definitions,
    {
      validation_response_code: 201,
      cache_date_time: new Date().toISOString(),
      byu_id: row.byu_id,
      person_id: row.person_id,
      name_api_type: name_api_type,
      basic_api_type: basic_api_type,
      deceased: /^Y$/g.test(row.deceased),
      sex: row.sex,
      date_time_updated: row.date_time_updated,
      updated_by_id: row.updated_by_id,
      date_time_created: row.date_time_created,
      created_by_id: row.created_by_id,
      first_name: row.first_name,
      middle_name: row.middle_name,
      surname: row.surname,
      suffix: row.suffix,
      preferred_first_name: row.preferred_first_name,
      preferred_surname: row.preferred_surname,
      rest_of_name: row.rest_of_name,
      name_lnf: row.sort_name,
      name_fnf: row.name_fnf,
      preferred_name: row.preferred_name,
      home_town: row.home_town,
      home_state_code: row.home_state_code,
      home_state_name: getStateName(row.home_state_code, row.home_country_code),
      home_country_code: row.home_country_code,
      home_country_name: getCountryName(row.home_country_code),
      high_school_code: row.high_school_code,
      high_school_name: high_school.high_school_name || '',
      high_school_state_code: high_school.state_code || '',
      high_school_state_name: getStateName(high_school.state_code, 'USA'),
      high_school_city: high_school.city || '',
      restricted: /^Y$/g.test(row.restricted) || false,
      merge_in_process: /^Y$/g.test(row.merge_in_process) || false
    }
  );
}

function mapGovernmentRecords(definitions, row) {
  row.date_time_updated = moment.tz(row.date_time_updated, 'YYYY-MM-DD HH:mm:ss.SSS', 'America/Denver');
  row.date_time_updated = row.date_time_updated.clone().tz('America/Danmarkshavn').toISOString();
  row.date_time_created = moment.tz(row.date_time_created, 'YYYY-MM-DD HH:mm:ss.SSS', 'America/Denver');
  row.date_time_created = row.date_time_created.clone().tz('America/Danmarkshavn').toISOString();

  return Enforcer.applyTemplate(definitions.government_records, definitions,
    {
      validation_response_code: 201,
      cache_date_time: new Date().toISOString(),
      byu_id: row.byu_id,
      cit_api_type: (/^USA$/g.test(row.citizenship_country_code)) ? 'read-only' : 'modifiable',
      api_type: 'modifiable',
      ssn_api_type: (/^ $/g.test(row.ssn)) ? 'modifiable' : 'read-only',
      date_time_updated: row.date_time_updated,
      updated_by_id: row.updated_by_id,
      date_time_created: row.date_time_created,
      created_by_id: row.created_by_id,
      citizenship_country_code: row.citizenship_country_code,
      citizenship_country_name: getCountryName(row.citizenship_country_code),
      birth_country_code: row.birth_country_code,
      birth_country_name: getCountryName(row.birth_country_code),
      ssn: row.ssn,
      ssn_verification_date: row.ssn_verification_date || undefined,
      visa_type: row.visa_type,
      visa_type_source: row.visa_type_source,
      i20_expiration_date: row.i20_expiration_date || undefined
    }
  );
}

function getLdsUnit(lds_unit_number) {
  const lds_unit_numbers = require('../../meta/lds_units/ldsUnitNumbers.json');
  if (!/^[0-9]{7}$/g.test(lds_unit_number)) {
    return {};
  }

  for (let i = lds_unit_numbers.items.length; i--;) {
    if (lds_unit_numbers.items[i].lds_unit_number === lds_unit_number) {
      return lds_unit_numbers.items[i];
    }
  }

  return {};
}

function getMaritalDescription(marital_status) {
  switch (marital_status) {
    case 'D':
      return 'Divorced';
    case 'M':
      return 'Married';
    case 'S':
      return 'Single';
    case 'W':
      return 'Widowed';
    default:
      return 'Unknown'
  }
}

function mapPersonalRecords(definitions, row) {
  const lds_unit = getLdsUnit(row.lds_unit_number);
  row.date_time_updated = moment.tz(row.date_time_updated, 'YYYY-MM-DD HH:mm:ss.SSS', 'America/Denver');
  row.date_time_updated = row.date_time_updated.clone().tz('America/Danmarkshavn').toISOString();
  row.date_time_created = moment.tz(row.date_time_created, 'YYYY-MM-DD HH:mm:ss.SSS', 'America/Denver');
  row.date_time_created = row.date_time_created.clone().tz('America/Danmarkshavn').toISOString();

  return Enforcer.applyTemplate(definitions.personal_records, definitions,
    {
      validation_response_code: 201,
      cache_date_time: new Date().toISOString(),
      byu_id: row.byu_id,
      birth_api_type: (row.date_of_birth) ? 'read-only' : 'modifiable',
      death_api_type: 'read-only',
      lds_api_type: (/^ $/g.test(row.lds_unit_number)) ? 'modifiable' : 'read-only',
      rel_api_type: (/^LDS$/g.test(row.religion_code)) ? 'read-only' : 'modifiable',
      api_type: 'modifiable',
      date_time_updated: row.date_time_updated,
      updated_by_id: row.updated_by_id,
      date_time_created: row.date_time_created,
      created_by_id: row.created_by_id,
      date_of_birth: row.date_of_birth || undefined,
      date_of_death: row.date_of_death || undefined,
      deceased: /^Y$/g.test(row.deceased),
      sex: row.sex,
      lds_unit_number: row.lds_unit_number,
      lds_unit_name: lds_unit.lds_unit_name || undefined,
      parent_lds_unit_number: lds_unit.parent_lds_unit_number || undefined,
      parent_lds_unit_name: lds_unit.parent_lds_unit_name || undefined,
      lds_confirmation_date: row.lds_confirmation_date || undefined,
      religion_code: row.religion_code,
      religion_name: getReligionName(row.religion_code),
      marital_status: row.marital_status,
      marital_status_desc: getMaritalDescription(row.marital_status)
    }
  );
}

exports.createPerson = async (definitions, authorized_byu_id, body) => {
  const connection = await db.getConnection();
  let new_body = processBody(authorized_byu_id, body);
  console.log('NEW BODY', new_body);

  let sql_query = sql.addPerson.check;
  let params = [
    new_body.created_by_id,
    new_body.byu_id,
    new_body.person_id,
    new_body.byu_id,
    new_body.person_id,
    new_body.surname,
    new_body.first_name,
    new_body.date_of_birth,
    new_body.ssn
  ];
  const check = await connection.execute(sql_query, params);

  const is_valid_auth = check.rows[0].is_valid_auth;
  const is_identity = check.rows[0].is_identity;
  const is_person = check.rows[0].is_person;
  const match_found = check.rows[0].match_found;
  const ssn_found = check.rows[0].ssn_found;
  if (new_body.ssn !== ' ' && ssn_found) {
    throw utils.Error(403, `Person already exists, use PUT to update`);
  }
  // if (match_found && ssn === ' ' ) {
  //     throw new ClientError(403, "Possible match found please provide ssn")
  // }
  if ((!new_body.person_id && new_body.byu_id) || (new_body.person_id && !new_body.byu_id)) {
    throw  utils.Error(403, `PERSON_ID must be included if BYU_ID is included in the body or vice versa`);
  }

  if (new_body.byu_id) {
    if (!is_valid_auth) {
      throw utils.Error(403, `User not authorized to include 'byu_id' nor 'person_id' in body`);
    }
    if (is_identity && is_person) {
      throw utils.Error(405, `Person already exists, use PUT to update`);
    }
  } else {
    new_body.byu_id = await generateByuId(connection);
    console.log("BYU_ID", new_body.byu_id);
    new_body.person_id = await generatePersonId(connection);
    console.log("PERSON_ID", new_body.person_id);
  }

  if (!is_identity) {
    //build SQL query to check if BYU_ID has an address of the specified type
    sql_query = sql.addPerson.createIdentity;
    new_body.identity_added = true;
    params = [
      new_body.byu_id,
      new_body.date_time_updated,
      new_body.updated_by_id,
      new_body.date_time_created,
      new_body.created_by_id,
      new_body.identity_type,
      new_body.identity_name,
      new_body.test_record_responsible_id,
      new_body.validation_phrase,
      new_body.date_time_ferpa_last_displayed,
      new_body.person_id
    ];
    console.log('Add Identity');
    await connection.execute(sql_query, params);

    sql_query = sql.addPerson.logIdentityChange;
    params = [
      new_body.change_type,
      new_body.byu_id,
      new_body.date_time_updated,
      new_body.updated_by_id,
      new_body.date_time_created,
      new_body.created_by_id,
      new_body.identity_type,
      new_body.from_identity_name,
      new_body.from_test_responsible_id,
      new_body.from_validation_phrase,
      new_body.from_time_ferpa_last_displayed,
      new_body.identity_name,
      new_body.test_record_responsible_id,
      new_body.validation_phrase,
      new_body.date_time_ferpa_last_displayed,
      new_body.person_id
    ];
    console.log('Log Identity');
    await connection.execute(sql_query, params, { autoCommit: true })

  }

  if (!is_person) {
    new_body.person_added = true;
    //SQL to add record
    sql_query = sql.addPerson.createPerson;
    params = [
      new_body.byu_id,
      new_body.date_time_updated,
      new_body.updated_by_id,
      new_body.date_time_created,
      new_body.created_by_id,
      new_body.surname,
      new_body.rest_of_name,
      new_body.suffix,
      new_body.preferred_first_name,
      new_body.preferred_surname,
      new_body.preferred_name,
      new_body.sort_name,
      new_body.first_name,
      new_body.middle_name,
      new_body.date_of_birth,
      new_body.deceased,
      new_body.date_of_death,
      new_body.sex,
      new_body.marital_status,
      new_body.religion_code,
      new_body.lds_unit_number,
      new_body.citizenship_country_code,
      new_body.birth_country_code,
      new_body.home_town,
      new_body.home_state_code,
      new_body.home_country_code,
      new_body.high_school_code,
      new_body.restricted,
      new_body.ssn,
      new_body.ssn_verification_date,
      new_body.visa_type,
      new_body.i20_expiration_date,
      new_body.visa_type_source,
      new_body.person_id,
      new_body.lds_confirmation_date
    ];
    console.log("Add Person");
    await connection.execute(sql_query, params);

    //select new SQL query to log changes
    sql_query = sql.addPerson.logPersonChange;
    params = [
      new_body.change_type,
      new_body.byu_id,
      new_body.date_time_updated,
      new_body.updated_by_id,
      new_body.date_time_created,
      new_body.created_by_id,
      new_body.from_date_of_birth,
      new_body.from_deceased,
      new_body.from_date_of_death,
      new_body.from_sex,
      new_body.from_marital_status,
      new_body.from_religion_code,
      new_body.from_lds_unit_number,
      new_body.from_citizenship_country_code,
      new_body.from_birth_country_code,
      new_body.from_home_town,
      new_body.from_home_state_code,
      new_body.from_home_country_code,
      new_body.from_high_school_code,
      new_body.from_restricted,
      new_body.from_ssn,
      new_body.from_ssn_verification_date,
      new_body.from_visa_type,
      new_body.from_i20_expiration_date,
      new_body.from_visa_type_source,
      new_body.from_lds_confirmation_date,
      new_body.date_of_birth,
      new_body.deceased,
      new_body.date_of_death,
      new_body.sex,
      new_body.marital_status,
      new_body.religion_code,
      new_body.lds_unit_number,
      new_body.citizenship_country_code,
      new_body.birth_country_code,
      new_body.home_town,
      new_body.home_state_code,
      new_body.home_country_code,
      new_body.high_school_code,
      new_body.restricted,
      new_body.ssn,
      new_body.ssn_verification_date,
      new_body.visa_type,
      new_body.i20_expiration_date,
      new_body.visa_type_source,
      new_body.lds_confirmation_date
    ];
    console.log('Log Person');
    await connection.execute(sql_query, params);

    //select new SQL query to log changes
    sql_query = sql.addPerson.logNameChange;
    params = [
      new_body.change_type,
      new_body.byu_id,
      new_body.date_time_updated,
      new_body.updated_by_id,
      new_body.date_time_created,
      new_body.created_by_id,
      new_body.from_surname,
      new_body.from_rest_of_name,
      new_body.from_suffix,
      new_body.from_preferred_first_name,
      new_body.from_preferred_surname,
      new_body.from_preferred_name,
      new_body.from_sort_name,
      new_body.from_first_name,
      new_body.from_middle_name,
      new_body.surname,
      new_body.rest_of_name,
      new_body.suffix,
      new_body.preferred_first_name,
      new_body.preferred_surname,
      new_body.preferred_name,
      new_body.sort_name,
      new_body.first_name,
      new_body.middle_name
    ];
    console.log("Log Name");
    await connection.execute(sql_query, params, { autoCommit: true })
  }

  await personAddedEvents(connection, new_body);

  connection.close();

  let values = [{
    basic: {},
    government_records: {},
    "personal_records": {}
  }];

  values[0].basic = mapBasic(definitions, new_body, 'modifiable', 'modifiable');
  console.log(values[0].basic);
  values[0].government_records = mapGovernmentRecords(definitions, new_body);
  console.log(values[0].government_records);
  values[0].personal_records = mapPersonalRecords(definitions, new_body);
  console.log(values[0].personal_records);
  const persons = Enforcer.applyTemplate(definitions.persons, definitions,
    {
      validation_response_code: 201,
      collection_size: 1, // TODO: Can we use the length of the results.rows? We may get results back with no addresses but have results.
      page_start: 0,
      page_end: 1,
      page_size: 1,
      default_page_size: 1,
      maximum_page_size: 100,
      field_sets_returned: ['basic', 'personal_records', 'government_records'],
      persons_values: values
    });

  persons.values = values;
  console.log(persons);
  return persons;
};

exports.deletePerson = function (definitions, byu_id, authorized_byu_id, body, permissions) {
  if (!auth.canDeletePerson(permissions)) {
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