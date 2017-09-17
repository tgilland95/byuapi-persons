exports.sql = {
  getPhones: `
    select a.byu_id                                                                            as "byu_id",
           a.preferred_name                                                                    as "name",
           phn.lookup_number                                                                   as "lookup_number",
           phn.phone_number                                                                    as "phone_number",
           phn.country_code                                                                    as "country_code",
           cc.country                                                                          as "country_name",
           cc.country_phone_prefix                                                             as "country_number",
           a.restricted                                                                        as "restricted",
           to_char(phn.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_updated", 
           phn.updated_by_id                                                                   as "updated_by_id",
           ii.identity_name                                                                    as "updated_by_name",
           to_char(phn.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_created", 
           phn.created_by_id                                                                   as "created_by_id",
           iii.identity_name                                                                   as "created_by_name",
           phn.cell                                                                            as "cell_flag",
           phn.time_code                                                                       as "time_code",
           phn.texts_okay                                                                      as "texts_okay",
           phn.unlisted                                                                        as "unlisted",
           phn.primary_f                                                                       as "primary_flag",
           phn.tty                                                                             as "tty",
           phn.verified_f                                                                      as "verified_flag",
           phn.work_f                                                                          as "work_flag",
           idvw.primary_role                                                                   as "primary_role"
    from   iam.person a 
           left join iam.phone phn 
                  on a.byu_id = phn.byu_id 
           left join pro.code_country cc 
                  on phn.country_code = cc.country_code 
           left join iam.identity ii 
                  on phn.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on phn.created_by_id = iii.byu_id 
           left join pro.id_card_vw idvw 
                  on a.person_id = idvw.person_id 
    where  a.byu_id = :BYU_ID`,
  getPhone: `
    select a.byu_id                                                                            as "byu_id",
           a.preferred_name                                                                    as "name",
           phn.lookup_number                                                                   as "lookup_number",
           phn.phone_number                                                                    as "phone_number",
           phn.country_code                                                                    as "country_code",
           cc.country                                                                          as "country_name",
           cc.country_phone_prefix                                                             as "country_number",
           a.restricted                                                                        as "restricted",
           to_char(phn.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_updated", 
           phn.updated_by_id                                                                   as "updated_by_id",
           ii.identity_name                                                                    as "updated_by_name",
           to_char(phn.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_created", 
           phn.created_by_id                                                                   as "created_by_id",
           iii.identity_name                                                                   as "created_by_name",
           phn.cell                                                                            as "cell_flag",
           phn.time_code                                                                       as "time_code",
           phn.texts_okay                                                                      as "texts_okay",
           phn.unlisted                                                                        as "unlisted",
           phn.primary_f                                                                       as "primary_flag",
           phn.tty                                                                             as "tty",
           phn.verified_f                                                                      as "verified_flag",
           phn.work_f                                                                          as "work_flag",
           idvw.primary_role                                                                   as "primary_role"
    from   iam.person a 
           left join iam.phone phn 
                  on a.byu_id = phn.byu_id 
                     and phn.lookup_number = :LOOKUP_NUMBER 
           left join pro.code_country cc 
                  on phn.country_code = cc.country_code 
           left join iam.identity ii 
                  on phn.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on phn.created_by_id = iii.byu_id 
           left join pro.id_card_vw idvw 
                  on a.person_id = idvw.person_id 
    where  a.byu_id = :BYU_ID`,
  fromPhone: `
    select a.byu_id                                                                            as "byu_id",
           a.preferred_name                                                                    as "name",
           a.person_id                                                                         as "person_id",
           a.restricted                                                                        as "restricted",
           k.credential_id                                                                     as "net_id",
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
           end                                                                                 as "student_status",
           hr.per_warehouse.classification 
           || '-' 
           || hr.per_warehouse.status 
           || '-' 
           || hr.per_warehouse.standing                                                        as "employee_type",
           phn.lookup_number                                                                   as "lookup_number",
           phn.phone_number                                                                    as "phone_number",
           phn.country_code                                                                    as "country_code",
           cc.country                                                                          as "country_name",
           cc.country_phone_prefix                                                             as "country_number",
           a.restricted                                                                        as "restricted",
           to_char(phn.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_updated", 
           phn.updated_by_id                                                                   as "updated_by_id",
           ii.identity_name                                                                    as "updated_by_name",
           to_char(phn.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_created", 
           phn.created_by_id                                                                   as "created_by_id",
           iii.identity_name                                                                   as "created_by_name",
           phn.cell                                                                            as "cell_flag",
           phn.time_code                                                                       as "time_code",
           phn.texts_okay                                                                      as "texts_okay",
           phn.unlisted                                                                        as "unlisted",
           phn.primary_f                                                                       as "primary_flag",
           phn.tty                                                                             as "tty",
           phn.verified_f                                                                      as "verified_flag",
           phn.work_f                                                                          as "work_flag",
           idvw.primary_role                                                                   as "primary_role"
    from   iam.person a 
           left join iam.phone phn 
                  on a.byu_id = phn.byu_id 
                     and phn.lookup_number = :LOOKUP_NUMBER 
           left join pro.code_country cc 
                  on phn.country_code = cc.country_code 
           left join iam.identity ii 
                  on phn.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on phn.created_by_id = iii.byu_id 
           left join pro.id_card_vw idvw 
                  on a.person_id = idvw.person_id 
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
    lookup_number: lookup_number.value,
    phone_number: phone_number.value,
    date_time_updated: date_time_updated.value,
    updated_by_id: updated_by_id.value,
    updated_by_name: updated_by_id.description,
    date_time_created: date_time_created.value,
    created_by_id: created_by_id.value,
    created_by_name: created_by_id.description,
    cell_flag: cell_flag.value,
    time_code: time_code.value,
    texts_okay: texts_okay.value,
    primary_flag: primary_flag.value,
    tty: tty.value,
    country_code: country_code.value,
    country_name: country_code.description,
    country_number: country_number.value,
    unlisted: unlisted.value,
    work_flag: work_flag.value
  },
  public_map: {
    byu_id: byu_id.value,
    country_number: country_number.value,
    phone_number: phone_number.value,
    unlisted: unlisted.value,
    work_flag: work_flag.value
  }
};

exports.modifyPhone = {
  create: `
     insert into iam.phone 
     values      (:BYU_ID, 
                  :PHONE_NUMBER, 
                  :COUNTRY_CODE, 
                  to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :UPDATED_BY_ID, 
                  to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :CREATED_BY_ID, 
                  :CELL, 
                  :TIME_CODE, 
                  :TEXTS_OKAY, 
                  :UNLISTED, 
                  :PRIMARY_F, 
                  :TTY, 
                  :VERIFIED_F, 
                  :WORK_F, 
                  :LOOKUP_NUMBER)`,
  logChange: `
     insert into iam.phone_change 
     values      (iam.phone_change_id_seq.nextval, 
                  :CHANGE_TYPE, 
                  :BYU_ID, 
                  :LOOKUP_NUMBER, 
                  to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :UPDATED_BY_ID, 
                  to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :CREATED_BY_ID, 
                  :FROM_PHONE_NUMBER, 
                  :FROM_COUNTRY_CODE, 
                  :FROM_CELL, 
                  :FROM_TIME_CODE, 
                  :FROM_TEXTS_OKAY, 
                  :FROM_UNLISTED, 
                  :FROM_PRIMARY_F, 
                  :FROM_TTY, 
                  :FROM_VERIFIED_F, 
                  :FROM_WORK_F, 
                  :PHONE_NUMBER, 
                  :COUNTRY_CODE, 
                  :CELL, 
                  :TIME_CODE, 
                  :TEXTS_OKAY, 
                  :UNLISTED, 
                  :PRIMARY_F, 
                  :TTY, 
                  :VERIFIED_F, 
                  :WORK_F)`,
  update: `
     update iam.phone 
     set    date_time_updated = to_timestamp(:1, 'YYYY-MM-DD HH24:MI:SS.FF'), 
            updated_by_id = :2, 
            cell = :3, 
            time_code = :4, 
            texts_okay = :5, 
            country_code = :6, 
            primary_f = :7, 
            tty = :8, 
            unlisted = :9, 
            verified_f = :10, 
            work_f = :11, 
            phone_number = :12 
     where  byu_id = :13 
            and lookup_number = :14`,
  delete: `
     delete from iam.phone 
     where  lookup_number = :LOOKUP_NUMBER 
            and byu_id = :BYU_ID`
};