exports.sql = {
  getGovernmentRecords: `
    select a.byu_id                                                                          as "byu_id",
           a.preferred_name                                                                  as "name",
           k.credential_id                                                                   as "net_id",
           to_char(a.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_updated", 
           a.updated_by_id                                                                   as "updated_by_id",
           ii.identity_name                                                                  as "updated_by_name",
           to_char(a.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_created", 
           a.created_by_id                                                                   as "created_by_id",
           iii.identity_name                                                                 as "created_by_name",
           a.citizenship_country_code                                                        as "citizenship_country_code",
           pro.code_country.country                                                          as "citizenship_country_name",
           a.birth_country_code                                                              as "birth_country_code",
           country_code1.country                                                             as "birth_country_name",
           a.ssn                                                                             as "ssn",
           to_char(a.ssn_verification_date, 'YYYY-MM-DD')                                    as "ssn_verification_date", 
           a.visa_type                                                                       as "visa_type",
           to_char(a.i20_expiration_date, 'YYYY-MM-DD')                                      as "i20_expiration_date", 
           a.visa_type_source                                                                as "visa_type_source",
           a.restricted                                                                      as "restricted",
           a.surname                                                                         as "surname",
           a.first_name                                                                      as "first_name",
           to_char(a.date_of_death, 'YYYY-MM-DD')                                            as "date_of_death", 
           a.sex                                                                             as "sex",
           a.religion_code                                                                   as "religion_code",
           a.ward_lds_unit_code                                                              as "lds_unit_number",
           to_char(a.lds_confirmation_date, 'YYYY-MM-DD')                                    as "lds_confirmation_date", 
           a.rest_of_name                                                                    as "rest_of_name",
           a.suffix                                                                          as "suffix",
           a.preferred_first_name                                                            as "preferred_first_name",
           a.preferred_surname                                                               as "preferred_surname",
           a.preferred_name                                                                  as "preferred_name",
           a.sort_name                                                                       as "sort_name",
           a.middle_name                                                                     as "middle_name",
           a.home_town                                                                       as "home_town",
           a.home_state_code                                                                 as "home_state_code",
           a.home_country_code                                                               as "home_country_code",
           a.high_school_code                                                                as "high_school_code",
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
           end                                                                               as "name_fnf"
    from   iam.person a 
           left join iam.identity ii 
                  on a.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on a.created_by_id = iii.byu_id 
           left join iam.credential k 
                  on a.byu_id = k.byu_id 
                     and k.credential_type = 'NET_ID' 
           left join pro.code_country 
                  on a.citizenship_country_code = pro.code_country.country_code 
                     and pro.code_country.valid_for_citizenship = 'Y' 
           left join pro.code_country country_code1 
                  on a.birth_country_code = country_code1.country_code 
                     and country_code1.valid_for_birth_country = 'Y' 
           left join std_reg_eligibility_lnk e 
                  on a.person_id = e.person_id 
           left join hr.per_warehouse 
                  on a.byu_id = hr.per_warehouse.byu_id 
    where  a.byu_id = :BYU_ID 
           and ( e.year_term is null 
                  or e.year_term = (select max(e2.year_term) 
                                    from   std_reg_eligibility_lnk e2 
                                    where  a.person_id = e2.person_id) )`
};

exports.modifyGovernmentRecords = {
  update: `
     update iam.person 
     set    date_time_updated = to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
            updated_by_id = :UPDATED_BY_ID, 
            citizenship_country_code = :CITIZENSHIP_COUNTRY_CODE, 
            birth_country_code = :BIRTH_COUNTRY_CODE, 
            ssn = :SSN, 
            ssn_verification_date = to_date(:SSN_VERIFICATION_DATE, 'YYYY-MM-DD'), 
            visa_type = :VISA_TYPE, 
            visa_type_source = :VISA_TYPE_SOURCE, 
            i20_expiration_date = to_date(:I20_EXPIRATION_DATE, 'YYYY-MM-DD') 
     where  byu_id = :BYU_ID`,
  logChange: `
     insert into iam.person_change 
     values      (iam.person_change_id_seq.nextval, 
                  :CHANGE_TYPE,
                  :BYU_ID,
                  to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF3'),
                  :UPDATED_BY_ID,
                  to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF3'),
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
                  to_date(:SSN_VERIFICATION_DATE, 'YYYY-MM-DD'),
                  :VISA_TYPE,
                  to_date(:I20_EXPIRATION_DATE, 'YYYY-MM-DD'),
                  :VISA_TYPE_SOURCE,
                  to_date(:LDS_CONFIRMATION_DATE, 'YYYY-MM-DD'))`
};