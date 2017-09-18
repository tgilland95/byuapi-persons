exports.sql = {
  getEmailAddresses: `
    select a.byu_id                                                                            as "byu_id",
           a.preferred_name                                                                    as "name",
           a.restricted                                                                        as "restricted",
           ema.email_address_type                                                              as "email_address_type",
           to_char(ema.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_updated", 
           ema.updated_by_id                                                                   as "updated_by_id",
           ii.identity_name                                                                    as "updated_by_name",
           to_char(ema.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_created", 
           ema.created_by_id                                                                   as "created_by_id",
           iii.identity_name                                                                   as "created_by_name",
           ema.email_address                                                                   as "email_address",
           ema.email_unlisted                                                                  as "unlisted",
           ema.verified_f                                                                      as "verified_flag",
           idvw.primary_role                                                                   as "primary_role"
    from   iam.person a 
           left join iam.email_address ema 
                  on a.byu_id = ema.byu_id 
           left join iam.identity ii 
                  on ema.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on ema.created_by_id = iii.byu_id 
           left join pro.id_card_vw idvw 
                  on a.person_id = idvw.person_id 
    where  a.byu_id = :BYU_ID`,
  getEmailAddress: `
    select a.byu_id                                                                            as "byu_id",
           a.preferred_name                                                                    as "name",
           a.restricted                                                                        as "restricted",
           ema.email_address_type                                                              as "email_address_type",
           to_char(ema.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_updated", 
           ema.updated_by_id                                                                   as "updated_by_id",
           ii.identity_name                                                                    as "updated_by_name",
           to_char(ema.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_created", 
           ema.created_by_id                                                                   as "created_by_id",
           iii.identity_name                                                                   as "created_by_name",
           ema.email_address                                                                   as "email_address",
           ema.email_unlisted                                                                  as "unlisted",
           ema.verified_f                                                                      as "verified_flag",
           idvw.primary_role                                                                   as "primary_role"
    from   iam.person a 
           left join iam.email_address ema 
                  on a.byu_id = ema.byu_id 
                     and ema.email_address_type = :EMAIL 
           left join iam.identity ii 
                  on ema.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on ema.created_by_id = iii.byu_id 
           left join pro.id_card_vw idvw 
                  on a.person_id = idvw.person_id 
    where  a.byu_id = :BYU_ID`,
  fromEmailAddress: `
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
           ema.email_address_type                                                              as "email_address_type",
           to_char(ema.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_updated", 
           ema.updated_by_id                                                                   as "updated_by_id",
           ii.identity_name                                                                    as "updated_by_name",
           to_char(ema.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_created", 
           ema.created_by_id                                                                   as "created_by_id",
           iii.identity_name                                                                   as "created_by_name",
           ema.email_address                                                                   as "email_address",
           ema.email_unlisted                                                                  as "unlisted",
           ema.verified_f                                                                      as "verified_flag",
           idvw.primary_role                                                                   as "primary_role"
    from   iam.person a 
           left join iam.email_address ema 
                  on a.byu_id = ema.byu_id 
                     and ema.email_address_type = :EMAIL_ADDRESS_TYPE 
           left join iam.identity ii 
                  on ema.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on ema.created_by_id = iii.byu_id 
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
    where  a.byu_id = :BYU_ID`
  // map: {
  //   byu_id: byu_id.value,
  //   name: byu_id.description,
  //   email_address_type: email_address_type.value,
  //   date_time_updated: date_time_updated.value,
  //   updated_by_id: updated_by_id.value,
  //   updated_by_name: updated_by_id.description,
  //   date_time_created: date_time_created.value,
  //   created_by_id: created_by_id.value,
  //   created_by_name: created_by_id.description,
  //   email_address: email_address.value,
  //   unlisted: unlisted.value,
  //   verified_flag: verified_flag.value
  // },
  // public_map: {
  //   byu_id: byu_id.value,
  //   email_address_type: email_address_type.value,
  //   email_address: email_address.value,
  //   unlisted: unlisted.value,
  //   verified_flag: verified_flag.value
  // }
};

exports.modifyEmailAddress = {
  create: `
     insert into iam.email_address 
     values      (:BYU_ID, 
                  :EMAIL_ADDRESS_TYPE, 
                  to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :UPDATED_BY_ID, 
                  to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :CREATED_BY_ID, 
                  :EMAIL_ADDRESS, 
                  :EMAIL_UNLISTED, 
                  :VERIFIED_F)`,
  logChange: `
     insert into iam.email_address_change 
     values      (iam.email_address_change_id_seq.nextval, 
                  :CHANGE_TYPE, 
                  :BYU_ID, 
                  :EMAIL_ADDRESS_TYPE, 
                  to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :UPDATED_BY_ID, 
                  to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :CREATED_BY_ID, 
                  :FROM_EMAIL_ADDRESS, 
                  :FROM_UNLISTED, 
                  :FROM_VERIFIED_F, 
                  :EMAIL_ADDRESS, 
                  :UNLISTED, 
                  :VERIFIED_F)`,
  update: `
     update iam.email_address 
     set    date_time_updated = to_timestamp(:1, 'YYYY-MM-DD HH24:MI:SS.FF'), 
            updated_by_id = :2, 
            email_address = :3, 
            email_unlisted = :4, 
            verified_f = :5 
     where  byu_id = :6 
            and email_address_type = :7`,
  delete: `
     delete from iam.email_address 
     where  email_address_type = :EMAIL_ADDRESS_TYPE 
            and byu_id = :BYU_ID`
};