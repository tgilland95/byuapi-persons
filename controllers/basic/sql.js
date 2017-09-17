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

exports.sql = {
    getBasic: `
      select a.byu_id                                                                          as "byu_id",
             a.person_id                                                                       as "person_id",
             k.credential_id                                                                   as "net_id",
             a.deceased                                                                        as "deceased",
             ema.email_address                                                                 as "personal_email_address",
             phn.phone_number                                                                  as "phone_number",
             to_char(a.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_updated", 
             a.updated_by_id                                                                   as "updated_by_id",
             ii.identity_name                                                                  as "updated_by_name",
             to_char(a.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_created", 
             a.created_by_id                                                                   as "created_by_id",
             iii.identity_name                                                                 as "created_by_name",
             a.sex                                                                             as "sex",
             a.first_name                                                                      as "first_name",
             a.middle_name                                                                     as "middle_name",
             a.surname                                                                         as "surname",
             a.suffix                                                                          as "suffix",
             a.preferred_first_name                                                            as "preferred_first_name",
             a.preferred_surname                                                               as "preferred_surname",
             a.rest_of_name                                                                    as "rest_of_name",
             case 
               when a.suffix != ' ' then a.sort_name 
                                         || ', ' 
                                         || a.suffix 
               else a.sort_name 
             end                                                                               as "name_lnf",
             case 
               when a.suffix != ' ' then a.rest_of_name 
                                         || ' ' 
                                         || a.surname 
                                         || ' ' 
                                         || a.suffix 
               else a.rest_of_name 
                    || ' ' 
                    || a.surname 
             end                                                                               as "name_fnf",
             a.preferred_name                                                                  as "preferred_name",
             a.home_town                                                                       as "home_town",
             a.home_state_code                                                                 as "home_state_code",
             cs.state                                                                          as "home_state_name",
             a.home_country_code                                                               as "home_country_code",
             cc.country                                                                        as "home_country_name",
             a.high_school_code                                                                as "high_school_code",
             chs.high_school_name                                                              as "high_school_name",
             chs.city                                                                          as "high_school_city",
             chs.state_code                                                                    as "high_school_state_code",
             cs1.state                                                                         as "high_school_state_name",
             (select case 
                       when count(*) > 0 then 'Y' 
                       else 'N' 
                     end 
              from   iam.identity_merge 
              where  iam.identity_merge.old_byu_id = a.byu_id)                                 as "merge_in_process",
             a.restricted                                                                      as "restricted",
             nvl(icv.primary_role, ' ')                                                        as "primary_role"
      from   iam.person a 
             left join iam.credential k 
                    on a.byu_id = k.byu_id 
                       and k.credential_type = 'NET_ID' 
             left join iam.email_address ema 
                    on a.byu_id = ema.byu_id 
                       and ema.email_address_type = 'PERSONAL' 
                       and ema.email_unlisted = 'N' 
             left join iam.phone phn 
                    on a.byu_id = phn.byu_id 
                       and phn.primary_f = 'Y' 
                       and phn.unlisted = 'N' 
             left join iam.identity ii 
                    on a.updated_by_id = ii.byu_id 
             left join iam.identity iii 
                    on a.created_by_id = iii.byu_id 
             left join pro.code_state cs 
                    on a.home_country_code = cs.country_code 
                       and a.home_state_code = cs.state_code 
             left join pro.code_country cc 
                    on a.home_country_code = cc.country_code 
                       and cc.valid_for_home_country = 'Y' 
             left join pro.code_high_school chs 
                    on a.high_school_code = chs.high_school_code 
             left join pro.code_state cs1 
                    on chs.state_code = cs1.state_code 
                       and cs1.country_code = 'USA' 
             left join pro.id_card_vw icv 
                    on a.byu_id = icv.byu_id 
      where  a.byu_id = :BYU_ID`,
    fromBasic: `
      select a.byu_id                                                                          as "byu_id",
             a.person_id                                                                       as "person_id",
             k.credential_id                                                                   as "net_id",
             a.deceased                                                                        as "deceased",
             to_char(a.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_updated", 
             a.updated_by_id                                                                   as "updated_by_id",
             to_char(a.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_created", 
             a.created_by_id                                                                   as "created_by_id",
             a.sex                                                                             as "sex",
             a.first_name                                                                      as "first_name",
             a.middle_name                                                                     as "middle_name",
             a.surname                                                                         as "surname",
             a.suffix                                                                          as "suffix",
             a.preferred_first_name                                                            as "preferred_first_name",
             a.preferred_surname                                                               as "preferred_surname",
             a.preferred_name                                                                  as "preferred_name",
             a.rest_of_name                                                                    as "rest_of_name",
             a.sort_name                                                                       as "sort_name",
             case 
               when a.suffix != ' ' then a.sort_name 
                                         || ', ' 
                                         || a.suffix 
               else a.sort_name 
             end                                                                               as "name_lnf",
             case 
               when a.suffix != ' ' then a.rest_of_name 
                                         || ' ' 
                                         || a.surname 
                                         || ' ' 
                                         || a.suffix 
               else a.rest_of_name 
                    || ' ' 
                    || a.surname 
             end                                                                               as "name_fnf",
             a.home_town                                                                       as "home_town",
             a.home_state_code                                                                 as "home_state_code",
             a.home_country_code                                                               as "home_country_code",
             a.high_school_code                                                                as "high_school_code",
             (select case 
                       when count(*) > 0 then 'Y' 
                       else 'N' 
                     end 
              from   iam.identity_merge 
              where  iam.identity_merge.old_byu_id = a.byu_id)                                 as "merge_in_process",
             a.restricted                                                                      as "restricted",
             nvl(icv.primary_role, ' ')                                                        as "primary_role",
             a.ward_lds_unit_code                                                              as "lds_unit_number",
             a.citizenship_country_code                                                        as "citizenship_country_code",
             a.birth_country_code                                                              as "birth_country_code",
             to_char(a.date_of_death, 'YYYY-MM-DD')                                            as "date_of_death",
             a.religion_code                                                                   as "religion_code",
             a.visa_type                                                                       as "visa_type",
             to_char(a.i20_expiration_date, 'YYYY-MM-DD')                                      as "i20_expiration_date",
             a.visa_type_source                                                                as "visa_type_source",
             case 
               when e.class_standing = '8' then 'Doctorate Program' 
               when e.class_standing = '7' then 'Masters Program' 
               when e.class_standing = '6' then 'Post Baccalaureate Non Degree' 
               when e.class_standing = '4' then 'Senior' 
               when e.class_standing = '3' then 'Junior' 
               when e.class_standing = '2' then 'Sophomore' 
               when e.class_standing = '1' then 'Freshman' 
               else 
                 case 
                   when e.reg_status = 'B' 
                        and e.reg_eligibility = 'BG' then 'BGS' 
                   when e.reg_status = 'A' 
                        and e.reg_eligibility = 'AO' then 'Audit' 
                   when e.reg_status = '2' 
                        and e.reg_eligibility = 'CH' then 'Concurrent Enrollment' 
                   when e.reg_status = 'V' 
                        and e.reg_eligibility = 'SO' then 'Visiting Student' 
                   when e.reg_status = 'E' 
                        and e.reg_eligibility = 'LC' then 'ELC' 
                   when e.reg_status = '3' 
                        and e.reg_eligibility = 'CE' then 'Evening School' 
                   when e.reg_status = '3' 
                        and e.reg_eligibility = 'SL' then 'Salt Lake Center Student' 
                   else 'Non-student' 
                 end 
             end                                                                               as "student_status",
             hr.per_warehouse.classification 
             || '-' 
             || hr.per_warehouse.status 
             || '-' 
             || hr.per_warehouse.standing                                                      as "employee_type",
             to_char(a.date_of_birth, 'YYYY-MM-DD')                                            as "date_of_birth",
             a.marital_status                                                                  as "marital_status",
             a.ssn                                                                             as "ssn",
             to_char(a.ssn_verification_date, 'YYYY-MM-DD')                                    as "ssn_verification_date",
             to_char(a.lds_confirmation_date, 'YYYY-MM-DD')                                    as "lds_confirmation_date"
      from   iam.person a 
             left join iam.credential k 
                    on a.byu_id = k.byu_id 
                       and k.credential_type = 'NET_ID' 
             left join pro.id_card_vw icv 
                    on a.byu_id = icv.byu_id 
             left join hr.per_warehouse 
                    on a.byu_id = hr.per_warehouse.byu_id 
             left join std_reg_eligibility_lnk e 
                    on a.person_id = e.person_id 
                       and ( e.year_term is null 
                              or e.year_term = (select max(e2.year_term) 
                                                from   std_reg_eligibility_lnk e2 
                                                where  a.person_id = e2.person_id) ) 
             left join control_dates d 
                    on e.year_term = d.year_term 
                       and d.date_type = 'CURRENT_YYT' 
                       and trunc(d.start_date) <= trunc(sysdate) 
                       and trunc(d.end_date) >= trunc(sysdate) 
      where  a.byu_id = :BYU_ID`
};

exports.modifyBasic = {
    create: `
      insert into iam.person
      values      (:BYU_ID,
                   to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'),
                   :UPDATED_BY_ID,
                   to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF'),
                   :CREATED_BY_ID,
                   :SURNAME,
                   :REST_OF_NAME,
                   :SUFFIX,
                   :PREFERRED_FIRST_NAME,
                   :PREFERRED_SURNAME,
                   :PREFERRED_NAME,
                   :SORT_NAME,
                   :FIRST_NAME,
                   :MIDDLE_NAME,
                   to_date(:DATE_OF_BIRTH, 'YYYY-MM-DD'),
                   :DECEASED,
                   to_date(:DATE_OF_DEATH, 'YYYY-MM-DD'),
                   :SEX,
                   :MARITAL_STATUS,
                   :RELIGION_CODE,
                   :WARD_LDS_UNIT_CODE,
                   :CITIZENSHIP_COUNTRY_CODE,
                   :BIRTH_COUNTRY_CODE,
                   :HOME_TOWN,
                   :HOME_STATE_CODE,
                   :HOME_COUNTRY_CODE,
                   :HIGH_SCHOOL_CODE,
                   :RESTRICTED,
                   :SSN,
                   to_date(:SSN_VERIFICATION_DATE, 'YYYY-MM-DD'),
                   :VISA_TYPE,
                   to_date(:I20_EXPIRATION_DATE, 'YYYY-MM-DD'),
                   :VISA_TYPE_SOURCE,
                   :PERSON_ID,
                   to_date(:LDS_CONFIRMATION_DATE, 'YYYY-MM-DD'))`,
    update: `
      update iam.person
      set    date_time_updated = to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'),
             updated_by_id = :UPDATED_BY_ID,
             surname = :SURNAME,
             first_name = :FIRST_NAME,
             rest_of_name = :REST_OF_NAME,
             preferred_surname = :PREFERRED_SURNAME,
             preferred_first_name = :PREFERRED_FIRST_NAME,
             preferred_name = :PREFERRED_NAME,
             sort_name = :SORT_NAME,
             middle_name = :MIDDLE_NAME,
             suffix = :SUFFIX,
             home_town = :HOME_TOWN,
             home_state_code = :HOME_STATE_CODE,
             home_country_code = :HOME_COUNTRY_CODE,
             high_school_code = :HIGH_SCHOOL_CODE,
             sex = :SEX,
             restricted = :RESTRICTED
      where  byu_id = :BYU_ID`,
    logNameChange: `
      insert into iam.name_change
      values      (iam.name_change_id_seq.nextval,
                   :CHANGE_TYPE,
                   :BYU_ID,
                   to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'),
                   :UPDATED_BY_ID,
                   to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF'),
                   :CREATED_BY_ID,
                   :FROM_SURNAME,
                   :FROM_REST_OF_NAME,
                   :FROM_SUFFIX,
                   :FROM_PREFERRED_FIRST_NAME,
                   :FROM_PREFERRED_SURNAME,
                   :FROM_PREFERRED_NAME,
                   :FROM_SORT_NAME,
                   :FROM_FIRST_NAME,
                   :FROM_MIDDLE_NAME,
                   :SURNAME,
                   :REST_OF_NAME,
                   :SUFFIX,
                   :PREFERRED_FIRST_NAME,
                   :PREFERRED_SURNAME,
                   :PREFERRED_NAME,
                   :SORT_NAME,
                   :FIRST_NAME,
                   :MIDDLE_NAME)`,
    logPersonalChange: `
      insert into iam.person_change
      values      (iam.person_change_id_seq.nextval,
                   :CHANGE_TYPE,
                   :BYU_ID,
                   to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'),
                   :UPDATED_BY_ID,
                   to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF'),
                   :CREATED_BY_ID,
                   to_date(:FROM_DATE_OF_BIRTH, 'YYYY-MM-DD'),
                   :FROM_DECEASED,
                   to_date(:FROM_DATE_OF_DEATH, 'YYYY-MM-DD'),
                   :FROM_SEX,
                   :FROM_MARITAL_STATUS,
                   :FROM_RELIGION_CODE,
                   :FROM_WARD_LDS_UNIT_CODE,
                   :FROM_CITIZENSHIP_COUNTRY_CODE,
                   :FROM_BIRTH_COUNTRY_CODE,
                   :FROM_HOME_TOWN,
                   :FROM_HOME_STATE_CODE,
                   :FROM_HOME_COUNTRY_CODE,
                   :FROM_HIGH_SCHOOL_CODE,
                   :FROM_RESTRICTED,
                   :FROM_SSN,
                   to_date(:FROM_SSN_VERIFICATION_DATE, 'YYYY-MM-DD'),
                   :FROM_VISA_TYPE,
                   to_date(:FROM_I20_EXPIRATION_DATE, 'YYYY-MM-DD'),
                   :FROM_VISA_TYPE_SOURCE,
                   to_date(:FROM_LDS_CONFIRMATION_DATE, 'YYYY-MM-DD'),
                   to_date(:DATE_OF_BIRTH, 'YYYY-MM-DD'),
                   :DECEASED,
                   to_date(:DATE_OF_DEATH, 'YYYY-MM-DD'),
                   :SEX,
                   :MARITAL_STATUS,
                   :RELIGION_CODE,
                   :WARD_LDS_UNIT_CODE,
                   :CITIZENSHIP_COUNTRY_CODE,
                   :BIRTH_COUNTRY_CODE,
                   :HOME_TOWN,
                   :HOME_STATE_CODE,
                   :HOME_COUNTRY_CODE,
                   :HIGH_SCHOOL_CODE,
                   :RESTRICTED,
                   :SSN,
                   :SSN,
                   to_date(:SSN_VERIFICATION_DATE, 'YYYY-MM-DD'),
                   :VISA_TYPE,
                   to_date(:I20_EXPIRATION_DATE, 'YYYY-MM-DD'),
                   :VISA_TYPE_SOURCE,
                   to_date(:LDS_CONFIRMATION_DATE, 'YYYY-MM-DD'))`
};

exports.deletePerson = {
    sql: `
      delete from iam.person
      where  iam.person.byu_id = :BYU_ID`
};
