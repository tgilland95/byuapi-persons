"use strict";

exports.sql = {
    getEthnicities: `
      select a.byu_id              as \"byu_id\", 
             a.preferred_name      as \"name\", 
             a.restricted          as \"restricted\", 
             eth.ethnicity_code    as \"ethnicity_code\", 
             cev.desc_15           as \"ethnicity_name\", 
             cev.description       as \"long_ethnicity_name\", 
             eth.date_time_updated as \"date_time_updated\", 
             eth.updated_by_id     as \"updated_by_id\", 
             ii.identity_name      as \"updated_by_name\", 
             eth.date_time_created as \"date_time_created\", 
             eth.created_by_id     as \"created_by_id\", 
             iii.identity_name     as \"created_by_name\", 
             eth.primary_f         as \"primary_flag\", 
             cev.active_status     as \"active\" 
      from   iam.person a 
             left join iam.ethnicity eth 
                    on a.byu_id = eth.byu_id 
             left join iam.identity ii 
                    on eth.updated_by_id = ii.byu_id 
             left join iam.identity iii 
                    on eth.created_by_id = iii.byu_id 
             left join pro.code_edit_value cev 
                    on eth.ethnicity_code = cev.domain_value 
                       and cev.domain_name = 'ETHNICITY_CODE' 
      where  a.byu_id = :1`,
    getEthnicity: ""
    + "select a.byu_id              as \"byu_id\", "
    + "       a.preferred_name      as \"name\", "
    + "       a.restricted          as \"restricted\", "
    + "       eth.ethnicity_code    as \"ethnicity_code\", "
    + "       cev.desc_15           as \"ethnicity_name\", "
    + "       cev.description       as \"long_ethnicity_name\", "
    + "       eth.date_time_updated as \"date_time_updated\", "
    + "       eth.updated_by_id     as \"updated_by_id\", "
    + "       ii.identity_name      as \"updated_by_name\", "
    + "       eth.date_time_created as \"date_time_created\", "
    + "       eth.created_by_id     as \"created_by_id\", "
    + "       iii.identity_name     as \"created_by_name\", "
    + "       eth.primary_f         as \"primary_flag\", "
    + "       cev.active_status     as \"active\" "
    + "from   iam.person a "
    + "       left join iam.ethnicity eth "
    + "              on a.byu_id = eth.byu_id "
    + "                 and eth.ethnicity_code = :1 "
    + "       left join iam.identity ii "
    + "              on eth.updated_by_id = ii.byu_id "
    + "       left join iam.identity iii "
    + "              on eth.created_by_id = iii.byu_id "
    + "       left join pro.code_edit_value cev "
    + "              on eth.ethnicity_code = cev.domain_value "
    + "                 and cev.domain_name = 'ETHNICITY_CODE' "
    + "where  a.byu_id = :2",
    fromEthnicity: ""
    + "select a.byu_id                     as \"byu_id\", "
    + "       a.preferred_name             as \"name\", "
    + "       a.person_id                  as \"person_id\", "
    + "       a.restricted                 as \"restricted\", "
    + "       k.credential_id              as \"net_id\", "
    + "       case "
    + "         when e.class_standing = '8' then 'Doctorate Program' "
    + "         when e.class_standing = '7' then 'Masters Program' "
    + "         when e.class_standing = '6' then 'Post Baccalaureate Non Degree' "
    + "         when e.class_standing = '4' then 'Senior' "
    + "         when e.class_standing = '3' then 'Junior' "
    + "         when e.class_standing = '2' then 'Sophomore' "
    + "         when e.class_standing = '1' then 'Freshman' "
    + "         else "
    + "           case "
    + "             when e.reg_status = 'B' "
    + "                  and e.reg_eligibility = 'BG' then 'BGS' "
    + "             when e.reg_status = 'A' "
    + "                  and e.reg_eligibility = 'AO' then 'Audit' "
    + "             when e.reg_status = '2' "
    + "                  and e.reg_eligibility = 'CH' then 'Concurrent Enrollment' "
    + "             when e.reg_status = 'V' "
    + "                  and e.reg_eligibility = 'SO' then 'Visiting Student' "
    + "             when e.reg_status = 'E' "
    + "                  and e.reg_eligibility = 'LC' then 'ELC' "
    + "             when e.reg_status = '3' "
    + "                  and e.reg_eligibility = 'CE' then 'Evening School' "
    + "             when e.reg_status = '3' "
    + "                  and e.reg_eligibility = 'SL' then 'Salt Lake Center Student' "
    + "             else 'Non-student' "
    + "           end "
    + "       end                          as \"student_status\", "
    + "       hr.per_warehouse.classification "
    + "       || '-' "
    + "       || hr.per_warehouse.status "
    + "       || '-' "
    + "       || hr.per_warehouse.standing as \"employee_type\", "
    + "       eth.ethnicity_code           as \"ethnicity_code\", "
    + "       cev.desc_15                  as \"ethnicity_name\", "
    + "       cev.description              as \"long_ethnicity_name\", "
    + "       eth.date_time_updated        as \"date_time_updated\", "
    + "       eth.updated_by_id            as \"updated_by_id\", "
    + "       ii.identity_name             as \"updated_by_name\", "
    + "       eth.date_time_created        as \"date_time_created\", "
    + "       eth.created_by_id            as \"created_by_id\", "
    + "       iii.identity_name            as \"created_by_name\", "
    + "       eth.primary_f                as \"primary_flag\", "
    + "       cev.active_status            as \"active\" "
    + "from   iam.person a "
    + "       left join iam.ethnicity eth "
    + "              on a.byu_id = eth.byu_id "
    + "                 and eth.ethnicity_code = :1 "
    + "       left join iam.identity ii "
    + "              on eth.updated_by_id = ii.byu_id "
    + "       left join iam.identity iii "
    + "              on eth.created_by_id = iii.byu_id "
    + "       left join pro.code_edit_value cev "
    + "              on eth.ethnicity_code = cev.domain_value "
    + "                 and cev.domain_name = 'ETHNICITY_CODE' "
    + "       left join iam.credential k "
    + "              on a.byu_id = k.byu_id "
    + "                 and k.credential_type = 'NET_ID' "
    + "       left join hr.per_warehouse "
    + "              on a.byu_id = hr.per_warehouse.byu_id "
    + "       left join std_reg_eligibility_lnk e "
    + "              on a.person_id = e.person_id "
    + "                 and ( e.year_term is null "
    + "                        or e.year_term = (select max(e2.year_term) "
    + "                                          from   std_reg_eligibility_lnk e2 "
    + "                                          where  a.person_id = e2.person_id) ) "
    + "       left join control_dates d "
    + "              on e.year_term = d.year_term "
    + "                 and d.date_type = 'CURRENT_YYT' "
    + "                 and trunc(d.start_date) <= trunc(sysdate) "
    + "                 and trunc(d.end_date) >= trunc(sysdate) "
    + "where  a.byu_id = :2",
    map: {
        byu_id: "byu_id.value",
        name: "byu_id.description",
        ethnicity_code: "ethnicity_code.value",
        ethnicity_name: "ethnicity_code.description",
        long_ethnicity_name: "ethnicity_code.long_description",
        date_time_updated: "date_time_updated.value",
        updated_by_id: "updated_by_id.value",
        updated_by_name: "updated_by_id.description",
        date_time_created: "date_time_created.value",
        created_by_id: "created_by_id.value",
        created_by_name: "created_by_id.description",
        primary_flag: "primary_flag.value",
        active: "active.value"
    }
};

exports.modifyEthnicity = {
    create: ""
    + "insert into iam.ethnicity "
    + "values      (:BYU_ID, "
    + "             :ETHNICITY_CODE, "
    + "             to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'), "
    + "             :UPDATED_BY_ID, "
    + "             to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF'), "
    + "             :CREATED_BY_ID, "
    + "             :PRIMARY_F)",
    logChange: ""
    + "insert into iam.ethnicity_change "
    + "values      (iam.ethnicity_change_id_seq.nextval, "
    + "             :CHANGE_TYPE, "
    + "             :BYU_ID, "
    + "             :ETHNICITY_CODE, "
    + "             to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'), "
    + "             :UPDATED_BY_ID, "
    + "             to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF'), "
    + "             :CREATED_BY_ID, "
    + "             :FROM_PRIMARY_F, "
    + "             :PRIMARY_F)",
    update: ""
    + "update iam.ethnicity "
    + "set    date_time_updated = to_timestamp(:1, 'YYYY-MM-DD HH24:MI:SS.FF'), "
    + "       updated_by_id = :2, "
    + "       primary_f = :3 "
    + "where  byu_id = :4 "
    + "       and ethnicity_code = :5",
    delete: ""
    + "delete from iam.ethnicity "
    + "where  ethnicity_code = :ETHNICITY_CODE "
    + "       and byu_id = :BYU_ID"
};

exports.intermediaryId = {
    get: ""
    + "select events.intermediary.intermediary_id as \"intermediary_id\" "
    + "from   events.intermediary "
    + "where  events.intermediary.url = :URL",
    put: ""
    + "insert into events.intermediary "
    + "values  (events.intermediary_seq.nextval, "
    + "         :URL, "
    + "         :ACTOR, "
    + "         :GROUP_ID, "
    + "         sysdate, "
    + "         :CREATED_BY_ID)"
};

exports.eventPersonEthnicity = {
    raiseEvent: ""
    + "insert into iam.event "
    + "            (event_id, "
    + "             date_time_created, "
    + "             event_body) "
    + "values      (iam.event_id_seq.nextval, "
    + "             systimestamp, "
    + "             :1)"
};

exports.enqueue = {
  sql: ""
  + "CALL iam.iam_enqueue_now(:1)"
};