exports.sql = {
  getLanguages: `
    select a.byu_id                                                                          as "byu_id",
           a.preferred_name                                                                  as "name",
           a.restricted                                                                      as "restricted",
           l.language_code                                                                   as "language_code",
           to_char(l.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_updated", 
           l.updated_by_id                                                                   as "updated_by_id",
           ii.identity_name                                                                  as "updated_by_name",
           to_char(l.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_created", 
           l.created_by_id                                                                   as "created_by_id",
           iii.identity_name                                                                 as "created_by_name",
           l.speak_proficiency                                                               as "speak_proficiency",
           l.read_proficiency                                                                as "read_proficiency",
           l.write_proficiency                                                               as "write_proficiency",
           l.native                                                                          as "native",
           l.translator                                                                      as "translator",
           cev.desc_15                                                                       as "language_name",
           cev.description                                                                   as "long_language_name"
    from   iam.person a 
           left join iam.language l 
                  on a.byu_id = l.byu_id 
           left join pro.code_edit_value cev 
                  on l.language_code = cev.domain_value 
                     and cev.domain_name = 'LANGUAGE' 
           left join iam.identity ii 
                  on l.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on l.created_by_id = iii.byu_id 
    where  a.byu_id = :BYU_ID`,
  getLanguage: `
    select a.byu_id                                                                          as "byu_id",
           a.preferred_name                                                                  as "name",
           a.restricted                                                                      as "restricted",
           l.language_code                                                                   as "language_code",
           to_char(l.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_updated", 
           l.updated_by_id                                                                   as "updated_by_id",
           ii.identity_name                                                                  as "updated_by_name",
           to_char(l.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_created", 
           l.created_by_id                                                                   as "created_by_id",
           iii.identity_name                                                                 as "created_by_name",
           l.speak_proficiency                                                               as "speak_proficiency",
           l.read_proficiency                                                                as "read_proficiency",
           l.write_proficiency                                                               as "write_proficiency",
           l.native                                                                          as "native",
           l.translator                                                                      as "translator",
           cev.desc_15                                                                       as "language_name",
           cev.description                                                                   as "long_language_name"
    from   iam.person a 
           left join iam.language l 
                  on a.byu_id = l.byu_id 
                     and l.language_code = :LANGUAGE_CODE 
           left join pro.code_edit_value cev 
                  on l.language_code = cev.domain_value 
                     and cev.domain_name = 'LANGUAGE' 
           left join iam.identity ii 
                  on l.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on l.created_by_id = iii.byu_id 
    where  a.byu_id = :BYU_ID`,
  fromLanguage: `
    select a.byu_id                                                                          as "byu_id",
           a.preferred_name                                                                  as "name",
           a.person_id                                                                       as "person_id",
           a.restricted                                                                      as "restricted",
           k.credential_id                                                                   as "net_id",
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
           l.language_code                                                                   as "language_code",
           to_char(l.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_updated", 
           l.updated_by_id                                                                   as "updated_by_id",
           ii.identity_name                                                                  as "updated_by_name",
           to_char(l.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_created", 
           l.created_by_id                                                                   as "created_by_id",
           iii.identity_name                                                                 as "created_by_name",
           l.speak_proficiency                                                               as "speak_proficiency",
           l.read_proficiency                                                                as "read_proficiency",
           l.write_proficiency                                                               as "write_proficiency",
           l.native                                                                          as "native",
           l.translator                                                                      as "translator",
           cev.desc_15                                                                       as "language_name",
           cev.description                                                                   as "long_language_name"
    from   iam.person a 
           left join iam.language l 
                  on a.byu_id = l.byu_id 
                     and l.language_code = :LANGUAGE_CODE 
           left join pro.code_edit_value cev 
                  on l.language_code = cev.domain_value 
                     and cev.domain_name = 'LANGUAGE' 
           left join iam.identity ii 
                  on l.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on l.created_by_id = iii.byu_id 
           left join iam.credential k 
                  on a.byu_id = k.byu_id 
                     and k.credential_type = 'NET_ID' 
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
    where  a.byu_id = :BYU_ID`,
  map: {
    byu_id: byu_id.value,
    name: byu_id.description,
    language_code: language_code.value,
    language_name: language_code.description,
    long_language_name: language_code.long_description,
    speak_proficiency: speak_proficiency.value,
    read_proficiency: read_proficiency.value,
    write_proficiency: write_proficiency.value,
    native: native.value,
    translator: translator.value,
    date_time_updated: date_time_updated.value,
    updated_by_id: updated_by_id.value,
    updated_by_name: updated_by_id.description,
    date_time_created: date_time_created.value,
    created_by_id: created_by_id.value,
    created_by_name: created_by_id.description
  }
};

exports.modifyLanguage = {
  create: `
     insert into iam.language 
     values      (:1, 
                  :2, 
                  to_timestamp(:3, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :4, 
                  to_timestamp(:5, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :6, 
                  :7, 
                  :8, 
                  :9, 
                  :10, 
                  :11)`,
  logChange: `
     insert into iam.language_change 
     values      (iam.language_change_id_seq.nextval, 
                  :1, 
                  :2, 
                  to_timestamp(:3, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :4, 
                  to_timestamp(:5, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :6, 
                  :7, 
                  :8, 
                  :9, 
                  :10, 
                  :11, 
                  :12, 
                  :13, 
                  :14, 
                  :15, 
                  :16, 
                  :17)`,
  update: `
     update iam.language 
     set    date_time_updated = to_timestamp(:1, 'YYYY-MM-DD HH24:MI:SS.FF'), 
            updated_by_id = :2, 
            speak_proficiency = :3, 
            read_proficiency = :4, 
            write_proficiency = :5, 
            native = :6, 
            translator = :7 
     where  byu_id = :8 
            and language_code = :9`,
  delete: `
     delete from iam.language l 
     where  l.byu_id = :1 
            and l.language_code = :2`
};