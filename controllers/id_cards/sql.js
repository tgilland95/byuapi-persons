exports.sql = {
  getIdCard: `
    select a.byu_id                                                                            as "byu_id",
           to_char(idc.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_updated", 
           idc.updated_by_id                                                                   as "updated_by_id",
           ii.identity_name                                                                    as "updated_by_name",
           to_char(idc.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_created", 
           idc.created_by_id                                                                   as "created_by_id",
           iii.identity_name                                                                   as "created_by_name",
           idc.credential                                                                      as "card_credential_id",
           idc.site_id                                                                         as "site_id",
           idc.dtf_flag                                                                        as "dtf_flag",
           idc.unlisted                                                                        as "unlisted",
           k.lost_or_stolen                                                                    as "lost_or_stolen",
           pxk.credential_id                                                                   as "prox_credential_id",
           idc.printed_name                                                                    as "printed_name",
           idc.primary_role                                                                    as "primary_role_when_issued",
           idc.secondary_role                                                                  as "secondary_role_when_issued",
           idc.beard_flag                                                                      as "beard_flag",
           idc.use_preferred_name_on_id_card                                                   as "use_preferred_name_on_id_card",
           k.status                                                                            as "status",
           to_char(k.expiration_date, 'YYYY-MM-DD')                                            as "expiration_date", 
           k.issuing_location                                                                  as "issuing_location",
           k.physical_form                                                                     as "physical_form",
           k.associated_device                                                                 as "associated_device",
           a.restricted                                                                        as "restricted",
           idvw.primary_role                                                                   as "primary_role_current",
           idvw.secondary_role                                                                 as "secondary_role_current"
    from   iam.person a 
           left join iam.id_card idc 
                  on a.byu_id = idc.byu_id 
           left join iam.credential k 
                  on idc.credential = k.credential_id 
                     and idc.byu_id = k.byu_id 
                     and k.credential_type = 'ID_CARD' 
           left join iam.credential pxk 
                  on idc.byu_id = pxk.byu_id 
                     and pxk.credential_type = 'PROX_CARD' 
           left join iam.identity ii 
                  on idc.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on idc.created_by_id = iii.byu_id 
           left join pro.id_card_vw idvw 
                  on a.byu_id = idvw.byu_id 
    where  a.byu_id = :BYU_ID`,
  fromIdCard: `
    select a.byu_id                                                                            as "byu_id",
           a.person_id                                                                         as "person_id",
           nid.credential_id                                                                   as "net_id",
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
           to_char(idc.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_updated", 
           idc.updated_by_id                                                                   as "updated_by_id",
           ii.identity_name                                                                    as "updated_by_name",
           to_char(idc.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_created", 
           idc.created_by_id                                                                   as "created_by_id",
           iii.identity_name                                                                   as "created_by_name",
           idc.credential                                                                      as "card_credential_id",
           idc.site_id                                                                         as "site_id",
           idc.dtf_flag                                                                        as "dtf_flag",
           idc.unlisted                                                                        as "unlisted",
           k.lost_or_stolen                                                                    as "lost_or_stolen",
           pxk.credential_id                                                                   as "prox_credential_id",
           idc.printed_name                                                                    as "printed_name",
           idc.primary_role                                                                    as "primary_role_when_issued",
           idc.secondary_role                                                                  as "secondary_role_when_issued",
           idc.beard_flag                                                                      as "beard_flag",
           idc.use_preferred_name_on_id_card                                                   as "use_preferred_name_on_id_card",
           k.status                                                                            as "status",
           to_char(k.expiration_date, 'YYYY-MM-DD')                                            as "expiration_date", 
           k.issuing_location                                                                  as "issuing_location",
           k.physical_form                                                                     as "physical_form",
           k.associated_device                                                                 as "associated_device",
           a.restricted                                                                        as "restricted",
           idvw.primary_role                                                                   as "primary_role_current",
           idvw.secondary_role                                                                 as "secondary_role_current"
    from   iam.person a 
           left join iam.id_card idc 
                  on a.byu_id = idc.byu_id 
           left join iam.credential k 
                  on idc.credential = k.credential_id 
                     and idc.byu_id = k.byu_id 
                     and k.credential_type = 'ID_CARD' 
           left join iam.credential pxk 
                  on idc.byu_id = pxk.byu_id 
                     and pxk.credential_type = 'PROX_CARD' 
           left join iam.identity ii 
                  on idc.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on idc.created_by_id = iii.byu_id 
           left join pro.id_card_vw idvw 
                  on a.byu_id = idvw.byu_id 
           left join iam.credential nid 
                  on a.byu_id = nid.byu_id 
                     and nid.credential_type = 'NET_ID' 
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
    date_time_updated: date_time_updated.value,
    updated_by_id: updated_by_id.value,
    updated_by_name: updated_by_id.description,
    date_time_created: date_time_created.value,
    created_by_id: created_by_id.value,
    created_by_name: created_by_id.description,
    card_credential_id: card_credential_id.value,
    site_id: site_id.value,
    dtf_flag: dtf_flag.value,
    unlisted: unlisted.value,
    lost_or_stolen: lost_or_stolen.value,
    prox_credential_id: prox_credential_id.value,
    printed_name: printed_name.value,
    primary_role_when_issued: primary_role_when_issued.value,
    secondary_role_when_issued: secondary_role_when_issued.value,
    primary_role_current: primary_role_current.value,
    secondary_role_current: secondary_role_current.value,
    beard_flag: beard_flag.value,
    use_preferred_name_on_id_card: use_preferred_name_on_id_card.value,
    status: status.value,
    expiration_date: expiration_date.value,
    issuing_location: issuing_location.value,
    physical_form: physical_form.value,
    associated_device: associated_device.value,
    restricted: restricted.value
  }
};

exports.modifyIdCards = {
  createCard: `
     insert into iam.id_card 
     values      (:CREDENTIAL, 
                  :BYU_ID, 
                  :SITE_ID, 
                  :DTF_FLAG, 
                  :UNLISTED, 
                  :PRINTED_NAME, 
                  :PRIMARY_ROLE, 
                  :SECONDARY_ROLE, 
                  :BEARD_FLAG, 
                  to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :UPDATED_BY_ID, 
                  to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :CREATED_BY_ID, 
                  :USE_PREFERRED_NAME_ON_ID_CARD)`,
  logCardChange: `
     insert into iam.id_card_change 
     values      (iam.id_card_change_id_seq.nextval, 
                  :CHANGE_TYPE, 
                  :BYU_ID, 
                  to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :UPDATED_BY_ID, 
                  to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :CREATED_BY_ID, 
                  :FROM_CREDENTIAL, 
                  :FROM_SITE_ID, 
                  :FROM_DTF_FLAG, 
                  :FROM_UNLISTED, 
                  :FROM_PRINTED_NAME, 
                  :FROM_PRIMARY_ROLE, 
                  :FROM_SECONDARY_ROLE, 
                  :FROM_BEARD_FLAG, 
                  :FROM_USE_PREF_NAME_ON_ID_CARD, 
                  :CREDENTIAL, 
                  :SITE_ID, 
                  :DTF_FLAG, 
                  :UNLISTED, 
                  :PRINTED_NAME, 
                  :PRIMARY_ROLE, 
                  :SECONDARY_ROLE, 
                  :BEARD_FLAG, 
                  :USE_PREFERRED_NAME_ON_ID_CARD)`,
  updateCard: `
     update iam.id_card 
     set    credential = :CARD_CREDENTIAL_ID, 
            site_id = :SITE_ID, 
            dtf_flag = :DTF_FLAG, 
            unlisted = :UNLISTED, 
            printed_name = :PRINTED_NAME, 
            primary_role = :PRIMARY_ROLE, 
            secondary_role = :SECONDARY_ROLE, 
            beard_flag = :BEARD_FLAG, 
            date_time_updated = to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
            updated_by_id = :UPDATED_BY_ID, 
            use_preferred_name_on_id_card = :USE_PREF_NAME 
     where  byu_id = :BYU_ID`,
  deleteCard: `
     delete from iam.id_card 
     where  byu_id = :1`
};