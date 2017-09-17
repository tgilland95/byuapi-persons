exports.sql = {
  getRelationships: `
    select a.byu_id                                                                            as "byu_id",
           a.preferred_name                                                                    as "name",
           a.restricted                                                                        as "restricted",
           ir.relationship_type                                                                as "relationship_type",
           ir.related_id                                                                       as "related_id",
           rk.credential_id                                                                    as "related_net_id",
           case 
             when rp.suffix != ' ' then rp.sort_name 
                                        || ', ' 
                                        || rp.suffix 
             else rp.sort_name 
           end                                                                                 as "related_name_lnf",
           case 
             when rp.suffix != ' ' then rp.rest_of_name 
                                        || ' ' 
                                        || rp.surname 
                                        || ' ' 
                                        || rp.suffix 
             else rp.rest_of_name 
                  || ' ' 
                  || rp.surname 
           end                                                                                 as "related_name_fnf",
           rp.preferred_name                                                                   as "related_preferred_name",
           rp.surname                                                                          as "related_surname",
           rp.rest_of_name                                                                     as "related_rest_of_name",
           rp.preferred_surname                                                                as "related_preferred_surname",
           rp.preferred_first_name                                                             as "related_preferred_first_name",
           rp.restricted                                                                       as "related_restricted",
           to_char(ir.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')  as "date_time_updated", 
           ir.updated_by_id                                                                    as "updated_by_id",
           ii.identity_name                                                                    as "updated_by_name",
           to_char(ir.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')  as "date_time_created", 
           ir.created_by_id                                                                    as "created_by_id",
           iii.identity_name                                                                   as "created_by_name",
           to_char(ir.date_time_verified at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_verified", 
           ir.verified_by_id                                                                   as "verified_by_id",
           iv.identity_name                                                                    as "verified_by_name"
    from   iam.person a 
           left join iam.identity_relationship ir 
                  on a.byu_id = ir.byu_id 
           left join iam.person rp 
                  on ir.related_id = rp.byu_id 
           left join iam.credential rk 
                  on ir.related_id = rk.byu_id 
                     and rk.credential_type = 'NET_ID' 
           left join iam.identity ii 
                  on ir.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on ir.created_by_id = iii.byu_id 
           left join iam.identity iv 
                  on ir.verified_by_id = iv.byu_id 
    where  a.byu_id = :BYU_ID`,
  getRelationship: `
    select a.byu_id                                                                            as "byu_id",
           a.preferred_name                                                                    as "name",
           a.restricted                                                                        as "restricted",
           ir.relationship_type                                                                as "relationship_type",
           ir.related_id                                                                       as "related_id",
           rk.credential_id                                                                    as "related_net_id",
           case 
             when rp.suffix != ' ' then rp.sort_name 
                                        || ', ' 
                                        || rp.suffix 
             else rp.sort_name 
           end                                                                                 as "related_name_lnf",
           case 
             when rp.suffix != ' ' then rp.rest_of_name 
                                        || ' ' 
                                        || rp.surname 
                                        || ' ' 
                                        || rp.suffix 
             else rp.rest_of_name 
                  || ' ' 
                  || rp.surname 
           end                                                                                 as "related_name_fnf",
           rp.preferred_name                                                                   as "related_preferred_name",
           rp.surname                                                                          as "related_surname",
           rp.rest_of_name                                                                     as "related_rest_of_name",
           rp.preferred_surname                                                                as "related_preferred_surname",
           rp.preferred_first_name                                                             as "related_preferred_first_name",
           rp.restricted                                                                       as "related_restricted",
           to_char(ir.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')  as "date_time_updated", 
           ir.updated_by_id                                                                    as "updated_by_id",
           ii.identity_name                                                                    as "updated_by_name",
           to_char(ir.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')  as "date_time_created", 
           ir.created_by_id                                                                    as "created_by_id",
           iii.identity_name                                                                   as "created_by_name",
           to_char(ir.date_time_verified at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_verified", 
           ir.verified_by_id                                                                   as "verified_by_id",
           iv.identity_name                                                                    as "verified_by_name"
    from   iam.person a 
           left join iam.identity_relationship ir 
                  on a.byu_id = ir.byu_id 
                     and ir.related_id = :RELATED_ID 
           left join iam.person rp 
                  on ir.related_id = rp.byu_id 
           left join iam.credential rk 
                  on ir.related_id = rk.byu_id 
                     and rk.credential_type = 'NET_ID' 
           left join iam.identity ii 
                  on ir.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on ir.created_by_id = iii.byu_id 
           left join iam.identity iv 
                  on ir.verified_by_id = iv.byu_id 
    where  a.byu_id = :BYU_ID`,
  fromRelationship: `
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
           ir.relationship_type                                                                as "relationship_type",
           ir.related_id                                                                       as "related_id",
           rk.credential_id                                                                    as "related_net_id",
           case 
             when rp.suffix != ' ' then rp.sort_name 
                                        || ', ' 
                                        || rp.suffix 
             else rp.sort_name 
           end                                                                                 as "related_name_lnf",
           case 
             when rp.suffix != ' ' then rp.rest_of_name 
                                        || ' ' 
                                        || rp.surname 
                                        || ' ' 
                                        || rp.suffix 
             else rp.rest_of_name 
                  || ' ' 
                  || rp.surname 
           end                                                                                 as "related_name_fnf",
           rp.preferred_name                                                                   as "related_preferred_name",
           rp.surname                                                                          as "related_surname",
           rp.rest_of_name                                                                     as "related_rest_of_name",
           rp.preferred_surname                                                                as "related_preferred_surname",
           rp.preferred_first_name                                                             as "related_preferred_first_name",
           to_char(ir.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')  as "date_time_updated", 
           ir.updated_by_id                                                                    as "updated_by_id",
           ii.identity_name                                                                    as "updated_by_name",
           to_char(ir.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')  as "date_time_created", 
           ir.created_by_id                                                                    as "created_by_id",
           iii.identity_name                                                                   as "created_by_name",
           to_char(ir.date_time_verified at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_verified", 
           ir.verified_by_id                                                                   as "verified_by_id",
           iv.identity_name                                                                    as "verified_by_name"
    from   iam.person a 
           left join iam.identity_relationship ir 
                  on a.byu_id = ir.byu_id 
                     and ir.related_id = :RELATED_ID 
           left join iam.person rp 
                  on ir.related_id = rp.byu_id 
           left join iam.credential rk 
                  on ir.related_id = rk.byu_id 
                     and rk.credential_type = 'NET_ID' 
           left join iam.identity ii 
                  on ir.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on ir.created_by_id = iii.byu_id 
           left join iam.identity iv 
                  on ir.verified_by_id = iv.byu_id 
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
    related_id: related_id.value,
    related_net_id: related_net_id.value,
    related_name_lnf: related_name_lnf.value,
    related_name_fnf: related_name_fnf.value,
    related_preferred_name: related_preferred_name.value,
    related_surname: related_surname.value,
    related_rest_of_name: related_rest_of_name.value,
    related_preferred_surname: related_preferred_surname.value,
    related_preferred_first_name: related_preferred_first_name.value,
    relationship_type: relationship_type.value,
    date_time_updated: date_time_updated.value,
    updated_by_id: updated_by_id.value,
    updated_by_name: updated_by_id.description,
    date_time_created: date_time_created.value,
    created_by_id: created_by_id.value,
    created_by_name: created_by_id.description,
    date_time_verified: date_time_verified.value,
    verified_by_id: verified_by_id.value,
    verified_by_name: verified_by_id.description
  }
};

exports.modifyRelationship = {
  create: `
     insert into iam.identity_relationship 
     values      (:1, 
                  :2, 
                  :3, 
                  to_timestamp(:4, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :5, 
                  to_timestamp(:6, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :7, 
                  to_timestamp(:8, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :9)`,
  logChange: `
     insert into iam.identity_relationship_change 
     values      (iam.id_relationship_change_id_seq.nextval, 
                  :CHANGE_TYPE, 
                  :BYU_ID, 
                  :RELATED_ID, 
                  :FROM_RELATIONSHIP_TYPE, 
                  to_timestamp(:FROM_DATE_TIME_VERIFIED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :FROM_VERIFIED_BY_ID, 
                  :RELATIONSHIP_TYPE, 
                  to_timestamp(:DATE_TIME_VERIFIED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :VERIFIED_BY_ID, 
                  to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :UPDATED_BY_ID, 
                  to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :CREATED_BY_ID)`,
  update: `
     update iam.identity_relationship 
     set    date_time_updated = to_timestamp(:1, 'YYYY-MM-DD HH24:MI:SS.FF'), 
            updated_by_id = :2, 
            relationship_type = :3, 
            date_time_verified = to_timestamp(:4, 'YYYY-MM-DD HH24:MI:SS.FF'), 
            verified_by_id = :5 
     where  byu_id = :6 
            and related_id = :7`,
  delete: `
     delete from iam.identity_relationship 
     where  related_id = :RELATED_ID 
            and byu_id = :BYU_ID`
};