exports.sql = {
  getPersonalRecords: ` 
    select a.byu_id                                                                          as "byu_id",
           a.preferred_name                                                                  as "preferred_name",
           k.credential_id                                                                   as "net_id",
           to_char(a.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_updated", 
           a.updated_by_id                                                                   as "updated_by_id",
           ii.identity_name                                                                  as "updated_by_name",
           to_char(a.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_created", 
           a.created_by_id                                                                   as "created_by_id",
           iii.identity_name                                                                 as "created_by_name",
           to_char(a.date_of_birth, 'YYYY-MM-DD')                                            as "date_of_birth", 
           to_char(a.date_of_death, 'YYYY-MM-DD')                                            as "date_of_death", 
           a.deceased                                                                        as "deceased",
           a.sex                                                                             as "sex",
           a.marital_status                                                                  as "marital_status",
           cev.description                                                                   as "marital_status_description",
           a.religion_code                                                                   as "religion_code",
           r.religion                                                                        as "religion_name",
           a.ward_lds_unit_code                                                              as "lds_unit_number",
           to_char(a.lds_confirmation_date, 'YYYY-MM-DD')                                    as "lds_confirmation_date", 
           case 
             when l.unit_name like '% AREA%' then l.unit_name 
             when l.unit_name like '% BRANCH%' then l.unit_name 
             when l.unit_name like '% DISTRICT%' then l.unit_name 
             when l.unit_name like '% MISSION%' then l.unit_name 
             when l.unit_name like '% REGION%' then l.unit_name 
             when l.unit_name like '% STAKE%' then l.unit_name 
             when l.unit_name like '% WARD%' then l.unit_name 
             else l.unit_name 
                  || ' ' 
                  || cev1.desc_15 
           end                                                                               as "lds_unit_name",
           l.parent_unit_num                                                                 as "parent_lds_unit_number",
           case 
             when unit.unit_name like '% AREA%' then unit.unit_name 
             when unit.unit_name like '% BRANCH%' then unit.unit_name 
             when unit.unit_name like '% DISTRICT%' then unit.unit_name 
             when unit.unit_name like '% MISSION%' then unit.unit_name 
             when unit.unit_name like '% REGION%' then unit.unit_name 
             when unit.unit_name like '% STAKE%' then unit.unit_name 
             when unit.unit_name like '% WARD%' then unit.unit_name 
             else unit.unit_name 
                  || ' ' 
                  || cev2.desc_15 
           end                                                                               as "parent_lds_unit_name",
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
           a.person_id                                                                       as "person_id",
           a.citizenship_country_code                                                        as "citizenship_country_code",
           a.birth_country_code                                                              as "birth_country_code",
           a.ssn                                                                             as "ssn",
           to_char(a.ssn_verification_date, 'YYYY-MM-DD')                                    as "ssn_verification_date", 
           a.visa_type                                                                       as "visa_type",
           to_char(a.i20_expiration_date, 'YYYY-MM-DD')                                      as "i20_expiration_date", 
           a.visa_type_source                                                                as "visa_type_source",
           a.restricted                                                                      as "restricted",
           a.surname                                                                         as "surname",
           a.first_name                                                                      as "first_name",
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
           ic.primary_role                                                                   as "primary_role"
    from   iam.person a 
           left join iam.identity ii 
                  on a.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on a.created_by_id = iii.byu_id 
           left join iam.credential k 
                  on a.byu_id = k.byu_id 
                     and k.credential_type = 'NET_ID' 
           left join pro.code_religion r 
                  on a.religion_code = r.religion_code 
           left join pro.code_lds_unit l 
                  on a.ward_lds_unit_code = l.unit_number 
           left join pro.code_edit_value cev 
                  on a.marital_status = cev.domain_value 
                     and cev.domain_name = 'MARITAL_STATUS' 
           left join pro.code_lds_unit unit 
                  on l.parent_unit_num = unit.unit_number 
           left join pro.code_edit_value cev1 
                  on l.unit_type = cev1.domain_value 
                     and cev1.domain_name = 'LDS_UNIT_TYPE' 
           left join pro.code_edit_value cev2 
                  on unit.unit_type = cev2.domain_value 
                     and cev2.domain_name = 'LDS_UNIT_TYPE' 
           left join pro.id_card_vw ic 
                  on a.byu_id = ic.byu_id 
           left join std_reg_eligibility_lnk e 
                  on a.person_id = e.person_id 
                     and ( e.year_term is null 
                            or e.year_term = (select max(e2.year_term) 
                                              from   std_reg_eligibility_lnk e2 
                                              where  a.person_id = e2.person_id) ) 
           left join hr.per_warehouse 
                  on a.byu_id = hr.per_warehouse.byu_id 
    where  a.byu_id = :BYU_ID`
};

exports.modifyPersonalRecord = {
  update: `
     update iam.person 
     set    date_time_updated = to_timestamp(:1, 'YYYY-MM-DD HH24:MI:SS.FF'), 
            updated_by_id = :2, 
            date_of_birth = to_date(:3, 'YYYY-MM-DD'), 
            date_of_death = to_date(:4, 'YYYY-MM-DD'), 
            deceased = :5, 
            marital_status = :6, 
            religion_code = :7, 
            ward_lds_unit_code = :8, 
            lds_confirmation_date = to_date(:9, 'YYYY-MM-DD') 
     where  byu_id = :10`,
  logChange: `
     insert into iam.person_change 
                 (byu_id, 
                  date_time_created, 
                  created_by_id, 
                  date_time_updated, 
                  updated_by_id, 
                  date_of_birth, 
                  date_of_death, 
                  deceased, 
                  sex, 
                  marital_status, 
                  religion_code, 
                  ward_lds_unit_code, 
                  lds_confirmation_date, 
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
                  home_town, 
                  home_state_code, 
                  home_country_code, 
                  high_school_code, 
                  restricted, 
                  person_change_id, 
                  change_type) 
     values      (:1, 
                  to_timestamp(:2, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :3, 
                  to_timestamp(:4, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :5, 
                  to_date(:6, 'YYYY-MM-DD'), 
                  to_date(:7, 'YYYY-MM-DD'), 
                  :8, 
                  :9, 
                  :10, 
                  :11, 
                  :12, 
                  to_date(:13, 'YYYY-MM-DD'), 
                  :14, 
                  :15, 
                  :16, 
                  to_date(:17, 'YYYY-MM-DD'), 
                  :18, 
                  :19, 
                  to_date(:20, 'YYYY-MM-DD'), 
                  to_date(:21, 'YYYY-MM-DD'), 
                  :22, 
                  to_date(:23, 'YYYY-MM-DD'), 
                  :24, 
                  :25, 
                  :26, 
                  :27, 
                  :28, 
                  :29, 
                  :30, 
                  :31, 
                  :32, 
                  :33, 
                  :34, 
                  :35, 
                  to_date(:36, 'YYYY-MM-DD'), 
                  :37, 
                  to_date(:38, 'YYYY-MM-DD'), 
                  :39, 
                  to_date(:40, 'YYYY-MM-DD'), 
                  :41, 
                  :42, 
                  :43, 
                  :44, 
                  :45, 
                  iam.person_change_id_seq.nextval, 
                  :46)`
};