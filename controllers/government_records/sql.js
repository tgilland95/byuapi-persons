exports.getGovernmentRecords = {
  sql: `
    select a.byu_id                                                                          as "byu_id",
           a.preferred_name                                                                  as "preferred_name",
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
                                    where  a.person_id = e2.person_id) )`,
  map: {
    byu_id: byu_id.value,
    name: byu_id.description,
    net_id: net_id.value,
    date_time_updated: date_time_updated.value,
    updated_by_id: updated_by_id.value,
    updated_by_name: updated_by_id.description,
    date_time_created: date_time_created.value,
    created_by_id: created_by_id.value,
    created_by_name: created_by_id.description,
    citizenship_country_code: citizenship_country_code.value,
    citizenship_country_name: citizenship_country_code.description,
    birth_country_code: birth_country_code.value,
    birth_country_name: birth_country_code.description,
    ssn: ssn.value,
    ssn_verification_date: ssn_verification_date.value,
    visa_type: visa_type.value,
    i20_expiration_date: i20_expiration_date.value,
    visa_type_source: visa_type_source.value
  },
  public_map: {
    byu_id: byu_id.value,
    name: byu_id.description,
    net_id: net_id.value,
    date_time_updated: date_time_updated.value,
    updated_by_id: updated_by_id.value,
    date_time_created: date_time_created.value,
    created_by_id: created_by_id.value,
    visa_type: visa_type.value,
    visa_type_source: visa_type.description,
    i20_expiration_date: i20_expiration_date.value,
    citizenship_country_code: citizenship_country_code.value,
    citizenship_country_name: citizenship_country_code.description,
    birth_country_code: birth_country_code.value,
    birth_country_name: birth_country_code.description
  }
};

exports.modifyGovernmentRecords = {
  update: `
     update iam.person 
     set    date_time_updated = to_timestamp(:1, 'YYYY-MM-DD HH24:MI:SS.FF'), 
            updated_by_id = :2, 
            citizenship_country_code = :3, 
            birth_country_code = :4, 
            ssn = :5, 
            ssn_verification_date = to_date(:6, 'YYYY-MM-DD'), 
            visa_type = :7, 
            visa_type_source = :8, 
            i20_expiration_date = to_date(:9, 'YYYY-MM-DD') 
     where  byu_id = :10`,
  logChange: `
     insert into iam.person_change 
                 (byu_id, 
                  date_time_created, 
                  created_by_id, 
                  date_time_updated, 
                  updated_by_id, 
                  citizenship_country_code, 
                  birth_country_code, 
                  ssn, 
                  ssn_verification_date, 
                  visa_type, 
                  visa_type_source, 
                  i20_expiration_date, 
                  from_date_of_birth, 
                  from_deceased, 
                  from_date_of_death, 
                  from_sex, 
                  from_marital_status, 
                  from_religion_code, 
                  from_ward_lds_unit_code, 
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
                  ward_lds_unit_code, 
                  home_town, 
                  home_state_code, 
                  home_country_code, 
                  high_school_code, 
                  restricted, 
                  lds_confirmation_date, 
                  person_change_id, 
                  change_type) 
     values      (:1, 
                  to_timestamp(:2, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :3, 
                  to_timestamp(:4, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :5, 
                  :6, 
                  :7, 
                  :8, 
                  to_date(:9, 'YYYY-MM-DD'), 
                  :10, 
                  :11, 
                  to_date(:12, 'YYYY-MM-DD'), 
                  to_date(:13, 'YYYY-MM-DD'), 
                  :14, 
                  to_date(:15, 'YYYY-MM-DD'), 
                  :16, 
                  :17, 
                  :18, 
                  :19, 
                  :20, 
                  :21, 
                  :22, 
                  :23, 
                  :24, 
                  :25, 
                  :26, 
                  :27, 
                  to_date(:28, 'YYYY-MM-DD'), 
                  :29, 
                  to_date(:30, 'YYYY-MM-DD'), 
                  :31, 
                  to_date(:32, 'YYYY-MM-DD'), 
                  to_date(:33, 'YYYY-MM-DD'), 
                  :34, 
                  to_date(:35, 'YYYY-MM-DD'), 
                  :36, 
                  :37, 
                  :38, 
                  :39, 
                  :40, 
                  :41, 
                  :42, 
                  :43, 
                  :44, 
                  to_date(:45, 'YYYY-MM-DD'), 
                  iam.person_change_id_seq.nextval, 
                  :46)`
};