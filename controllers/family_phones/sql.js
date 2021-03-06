exports.sql = {
  getFamilyPhones: ` 
    select a.byu_id                                                                           as "byu_id",
           a.preferred_name                                                                   as "name",
           a.restricted                                                                       as "restricted",
           fp.phone_type                                                                      as "phone_type",
           fp.country_code                                                                    as "country_code",
           fp.lookup_number                                                                   as "lookup_number",
           fp.phone_number                                                                    as "phone_number",
           to_char(fp.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_updated", 
           fp.updated_by_id                                                                   as "updated_by_id",
           ii.identity_name                                                                   as "updated_by_name",
           to_char(fp.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_created", 
           fp.created_by_id                                                                   as "created_by_id",
           iii.identity_name                                                                  as "created_by_name",
           fp.cell                                                                            as "cell_flag",
           fp.contact_person                                                                  as "contact_person",
           fp.relationship                                                                    as "relationship",
           fp.texts_okay                                                                      as "texts_okay",
           nvl(fp.preferred_language_code, 'EN')                                              as "preferred_language_code",
           nvl(cev.desc_15, 'English')                                                        as "preferred_language_name",
           fp.verified_f                                                                      as "verified_flag",
           cc.country                                                                         as "country_name",
           cc.country_phone_prefix                                                            as "country_number"
    from   iam.person a 
           left join iam.family_phone fp 
                  on a.byu_id = fp.byu_id 
           left join iam.identity ii 
                  on fp.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on fp.created_by_id = iii.byu_id 
           left join pro.code_edit_value cev 
                  on fp.preferred_language_code = cev.domain_value 
                     and cev.domain_name = 'LANGUAGE' 
           left join pro.code_country cc 
                  on fp.country_code = cc.country_code 
    where  a.byu_id = :BYU_ID`,
  getFamilyPhone: `
    select a.byu_id                                                                           as "byu_id",
           a.preferred_name                                                                   as "name",
           a.restricted                                                                       as "restricted",
           fp.phone_type                                                                      as "phone_type",
           fp.lookup_number                                                                   as "lookup_number",
           fp.phone_number                                                                    as "phone_number",
           fp.country_code                                                                    as "country_code",
           to_char(fp.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_updated", 
           fp.updated_by_id                                                                   as "updated_by_id",
           ii.identity_name                                                                   as "updated_by_name",
           to_char(fp.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_created", 
           fp.created_by_id                                                                   as "created_by_id",
           iii.identity_name                                                                  as "created_by_name",
           fp.cell                                                                            as "cell_flag",
           fp.contact_person                                                                  as "contact_person",
           fp.relationship                                                                    as "relationship",
           fp.texts_okay                                                                      as "texts_okay",
           nvl(fp.preferred_language_code, 'EN')                                              as "preferred_language_code",
           nvl(cev.desc_15, 'English')                                                        as "preferred_language_name",
           fp.verified_f                                                                      as "verified_flag",
           cc.country                                                                         as "country_name",
           cc.country_phone_prefix                                                            as "country_number"
    from   iam.person a 
           left join iam.family_phone fp 
                  on a.byu_id = fp.byu_id 
                     and fp.phone_type = :PHONE_TYPE 
                     and fp.lookup_number = :LOOKUP_NUMBER 
           left join iam.identity ii 
                  on fp.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on fp.created_by_id = iii.byu_id 
           left join pro.code_edit_value cev 
                  on fp.preferred_language_code = cev.domain_value 
                     and cev.domain_name = 'LANGUAGE' 
           left join pro.code_country cc 
                  on fp.country_code = cc.country_code 
    where  a.byu_id = :BYU_ID`,
  fromFamilyPhone: `
    select a.byu_id                                                                           as "byu_id",
           a.preferred_name                                                                   as "name",
           a.restricted                                                                       as "restricted",
           ii.identity_name                                                                   as "updated_by_name",
           iii.identity_name                                                                  as "created_by_name",
           a.person_id                                                                        as "person_id",
           k.credential_id                                                                    as "net_id",
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
           end                                                                                as "student_status",
           hr.per_warehouse.classification 
           || '-' 
           || hr.per_warehouse.status 
           || '-' 
           || hr.per_warehouse.standing                                                       as "employee_type",
           fp.phone_type                                                                      as "phone_type",
           fp.lookup_number                                                                   as "lookup_number",
           fp.phone_number                                                                    as "phone_number",
           fp.country_code                                                                    as "country_code",
           to_char(fp.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_updated", 
           fp.updated_by_id                                                                   as "updated_by_id",
           to_char(fp.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_created", 
           fp.created_by_id                                                                   as "created_by_id",
           fp.cell                                                                            as "cell_flag",
           fp.contact_person                                                                  as "contact_person",
           fp.relationship                                                                    as "relationship",
           fp.texts_okay                                                                      as "texts_okay",
           fp.preferred_language_code                                                         as "preferred_language",
           fp.verified_f                                                                      as "verified_flag",
           cc.country                                                                         as "country_name",
           cc.country_phone_prefix                                                            as "country_number"
    from   iam.person a 
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
           left join iam.family_phone fp 
                  on a.byu_id = fp.byu_id 
                     and fp.phone_type = :PHONE_TYPE 
                     and fp.lookup_number = :LOOKUP_NUMBER 
           left join iam.identity ii 
                  on fp.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on fp.created_by_id = iii.byu_id 
           left join pro.code_country cc 
                  on fp.country_code = cc.country_code 
    where  a.byu_id = :BYU_ID`,
  map: {
    byu_id: byu_id.value,
    name: byu_id.description,
    phone_type: phone_type.value,
    phone_number: phone_number.value,
    lookup_number: lookup_number.value,
    date_time_updated: date_time_updated,
    updated_by_id: updated_by_id.value,
    updated_by_name: updated_by_id.description,
    date_time_created: date_time_created.value,
    created_by_id: created_by_id.value,
    created_by_name: created_by_id.description,
    cell_flag: cell_flag.value,
    contact_person: contact_person.value,
    relationship: relationship.value,
    texts_okay: texts_okay.value,
    country_code: country_code.value,
    country_name: country_code.description,
    country_number: country_number.value,
    preferred_language_code: preferred_language_code.value,
    preferred_language_name: preferred_language_code.description
  }
};

exports.modifyFamilyPhone = {
  create: `
     insert into iam.family_phone 
     values      (:BYU_ID, 
                  :PHONE_TYPE, 
                  :PHONE_NUMBER, 
                  :COUNTRY_CODE, 
                  to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :UPDATED_BY_ID, 
                  to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :CREATED_BY_ID, 
                  :CELL, 
                  :CONTACT_PERSON, 
                  :RELATIONSHIP, 
                  :TEXTS_OKAY, 
                  :PREFERRED_LANGUAGE_CODE, 
                  :VERIFIED_F, 
                  :LOOKUP_NUMBER)`,
  logChange: `
     insert into iam.family_phone_change 
     values      (iam.family_phone_change_id_seq.nextval, 
                  :CHANGE_TYPE, 
                  :BYU_ID, 
                  :PHONE_TYPE, 
                  :LOOKUP_NUMBER, 
                  to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :UPDATED_BY_ID, 
                  to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :CREATED_BY_ID, 
                  :FROM_PHONE_NUMBER, 
                  :FROM_COUNTRY_CODE, 
                  :FROM_CELL, 
                  :FROM_CONTACT_PERSON, 
                  :FROM_RELATIONSHIP, 
                  :FROM_PREFERRED_LANGUAGE_CODE, 
                  :FROM_VERIFIED_F, 
                  :FROM_TEXTS_OKAY, 
                  :PHONE_NUMBER, 
                  :COUNTRY_CODE, 
                  :CELL, 
                  :CONTACT_PERSON, 
                  :RELATIONSHIP, 
                  :PREFERRED_LANGUAGE_CODE, 
                  :TEXTS_OKAY, 
                  :VERIFIED_F)`,
  update: `
     update iam.family_phone 
     set    date_time_updated = to_timestamp(:1, 'YYYY-MM-DD HH24:MI:SS.FF'), 
            updated_by_id = :2, 
            cell = :3, 
            contact_person = :4, 
            relationship = :5, 
            texts_okay = :6, 
            country_code = :7, 
            preferred_language_code = :8, 
            verified_f = :9, 
            phone_number = :10 
     where  byu_id = :11 
            and phone_type = :12 
            and lookup_number = :13`,
  delete: `
     delete from iam.family_phone 
     where  phone_type = :PHONE_TYPE 
            and lookup_number = :LOOKUP_NUMBER 
            and byu_id = :BYU_ID`
};