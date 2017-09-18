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

const basic = require('../basic/basic');
const auth = require('../auth');
const db = require('../db');
const sql = require('./sql');
const Enforcer = require('swagger-enforcer');
const utils = require('../utils');
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

exports.getPersons = async function (definitions, query, permissions) {
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
  if (!('credential_type' in query) && ('credential_id' in query)) {
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
  const values = (auth.hasRestrictedRights(permissions)) ? (
    await Promise.all(results.rows.map(row => exports.getPerson(definitions, row.byu_id, query, permissions)))
  ): (
    await Promise.all(results.rows.filter(row=> /^N$/g.test(row.restricted)).map(row => exports.getPerson(definitions, row.byu_id, query, permissions)))
  );
  const persons = Enforcer.applyTemplate(definitions.persons, definitions,
    {
      collection_size: results.rows.length, // TODO: Can we use the length of the results.rows? We may get results back with no addresses but have results.
      page_start: 0,
      page_end: results.rows.length,
      page_size: results.rows.length,
      default_page_size: 1,
      maximum_page_size: 100,
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
        result.basic = Enforcer.applyTemplate(definitions.basic, null,
          {
            byu_id: byu_id,
            validation_response_code: error.status || 500,
            validation_response_message: error.message || 'Internal Server Error'
          }, { ignoreMissingRequired: false });
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

exports.modifyPerson = async function (definitions, byu_id, authorized_byu_id, body, permissions) {
  return basic.putBasic(definitions, byu_id, authorized_byu_id, body, permissions);
};

// if (query.field_sets.includes('addresses')) {
//   promises.push(addresses.getAddresses(definitions, byu_id, permissions)
//     .then(function (addresses_result) {
//       result.addresses = addresses_result;
//     })
//     .catch(function (error) {
//       let addresses = { values: [] };
//       addresses.metadata = Enforcer.applyTemplate(definitions.sub_level_metadata, null,
//         {
//           validation_response_code: error.status || 500,
//           validation_response_message: error.message || 'Internal Server Error'
//         });
//       result.addresses = addresses;
//     }));
// }
// if (query.field_sets.includes('alias_domains')) {
//   promises.push(alias_domains.getAliasDomains(definitions, byu_id, permissions)
//     .then(function (alias_domains_result) {
//       result.alias_domains = alias_domains_result;
//     })
//     .catch(function (error) {
//       let alias_domains = { values: [] };
//       alias_domains.metadata = Enforcer.applyTemplate(definitions.sub_level_metadata, null,
//         {
//           validation_response_code: error.status || 500,
//           validation_response_message: error.message || 'Internal Server Error'
//         });
//       result.alias_domains = alias_domains;
//     }));
// }
// if (query.field_sets.includes('credentials')) {
//   promises.push(credentials.getCredentials(definitions, byu_id, permissions)
//     .then(function (credentials_result) {
//       result.credentials = credentials_result;
//     })
//     .catch(function (error) {
//       let credentials = { values: [] };
//       credentials.metadata = Enforcer.applyTemplate(definitions.sub_level_metadata, null,
//         {
//           validation_response_code: error.status || 500,
//           validation_response_message: error.message || 'Internal Server Error'
//         });
//       result.credentials = credentials;
//     }));
// }
// if (query.field_sets.includes('email_addresses')) {
//   promises.push(email_addresses.getEmailAddresses(definitions, byu_id, permissions)
//     .then(function (email_addresses_result) {
//       result.email_addresses = email_addresses_result;
//     })
//     .catch(function (error) {
//       let email_addresses = { values: [] };
//       email_addresses.metadata = Enforcer.applyTemplate(definitions.sub_level_metadata, null,
//         {
//           validation_response_code: error.status || 500,
//           validation_response_message: error.message || 'Internal Server Error'
//         });
//       result.email_addresses = email_addresses;
//     }));
// }
// if (query.field_sets.includes('email_aliases')) {
//   promises.push(email_aliases.getEmailAliases(definitions, byu_id, permissions)
//     .then(function (email_aliases_result) {
//       result.email_aliases = email_aliases_result;
//     })
//     .catch(function (error) {
//       let email_aliases = { values: [] };
//       email_aliases.metadata = Enforcer.applyTemplate(definitions.sub_level_metadata, null,
//         {
//           validation_response_code: error.status || 500,
//           validation_response_message: error.message || 'Internal Server Error'
//         });
//       result.email_aliases = email_aliases;
//     }));
// }
// if (query.field_sets.includes('employee_summaries')) {
//   promises.push(basic.getBasic(definitions, byu_id, permissions)
//     .then(function (employee_summaries_result) {
//       result.employee_summaries = employee_summaries_result;
//     })
//     .catch(function (error) {
//       result.employee_summaries = Enforcer.applyTemplate(definitions.employee_summaries, null,
//         {
//           byu_id: byu_id,
//           validation_response_code: error.status || 500,
//           validation_response_message: error.message || 'Internal Server Error'
//         }, { ignoreMissingRequired: false });
//     }));
// }
// if (query.field_sets.includes('ethnicities')) {
//   promises.push(ethnicities.getEthnicities(definitions, byu_id, permissions)
//     .then(function (ethnicities_result) {
//       result.ethnicities = ethnicities_result;
//     })
//     .catch(function (error) {
//       let ethnicities = { values: [] };
//       ethnicities.metadata = Enforcer.applyTemplate(definitions.sub_level_metadata, null,
//         {
//           validation_response_code: error.status || 500,
//           validation_response_message: error.message || 'Internal Server Error'
//         });
//       result.ethnicities = ethnicities;
//     }));
// }
// if (query.field_sets.includes('family_phones')) {
//   promises.push(family_phones.getFamilyPhones(definitions, byu_id, permissions)
//     .then(function (family_phones_result) {
//       result.family_phones = family_phones_result;
//     })
//     .catch(function (error) {
//       let family_phones = { values: [] };
//       family_phones.metadata = Enforcer.applyTemplate(definitions.sub_level_metadata, null,
//         {
//           validation_response_code: error.status || 500,
//           validation_response_message: error.message || 'Internal Server Error'
//         });
//       result.family_phones = family_phones;
//     }));
// }
// if (query.field_sets.includes('addresses')) {
//   promises.push(addresses.getAddresses(definitions, byu_id, permissions)
//     .then(function (addresses_result) {
//       result.addresses = addresses_result;
//     })
//     .catch(function (error) {
//       let addresses = { values: [] };
//       addresses.metadata = Enforcer.applyTemplate(definitions.sub_level_metadata, null,
//         {
//           validation_response_code: error.status || 500,
//           validation_response_message: error.message || 'Internal Server Error'
//         });
//       result.addresses = addresses;
//     }));
// }