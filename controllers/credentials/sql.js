exports.sql = {
  getCredentials: `
     select a.byu_id            as "byu_id", 
            a.preferred_name    as "name", 
            a.restricted        as "restricted", 
            k.credential_type   as "credential_type", 
            k.credential_id     as "credential_id", 
            k.user_name         as "user_name", 
            to_char(k.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_updated", 
            k.updated_by_id     as "updated_by_id", 
            ii.identity_name    as "updated_by_name", 
            to_char(k.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_created", 
            k.created_by_id     as "created_by_id", 
            iii.identity_name   as "created_by_name", 
            k.lost_or_stolen    as "lost_or_stolen", 
            k.status            as "status", 
            to_char(k.expiration_date, 'YYYY-MM-DD')   as "expiration_date", 
            k.issuing_location  as "issuing_location", 
            k.physical_form     as "physical_form", 
            k.associated_device as "associated_device", 
            k.scoped_affiliation as "scoped_affiliation" 
     from   iam.person a 
            left join iam.credential k 
                   on a.byu_id = k.byu_id 
            left join iam.identity ii 
                   on k.updated_by_id = ii.byu_id 
            left join iam.identity iii 
                   on k.created_by_id = iii.byu_id 
     where  a.byu_id = :1`,
  getCredential: ` 
     select a.byu_id            as "byu_id", 
            a.preferred_name    as "name", 
            a.restricted        as "restricted", 
            k.credential_type   as "credential_type", 
            k.credential_id     as "credential_id", 
            k.user_name         as "user_name", 
            to_char(k.date_time_updated as "date_time_updated", 
            k.updated_by_id     as "updated_by_id", 
            ii.identity_name    as "updated_by_name", 
            to_char(k.date_time_created as "date_time_created", 
            k.created_by_id     as "created_by_id", 
            iii.identity_name   as "created_by_name", 
            k.lost_or_stolen    as "lost_or_stolen", 
            k.status            as "status", 
            to_char(k.expiration_date, 'YYYY-MM-DD')   as "expiration_date", 
            k.issuing_location  as "issuing_location", 
            k.physical_form     as "physical_form", 
            k.associated_device as "associated_device", 
            k.scoped_affiliation as "scoped_affiliation" 
     from   iam.person a 
            left join iam.credential k 
                   on a.byu_id = k.byu_id 
                      and k.credential_type = :CREDENTIAL_TYPE 
                      and k.credential_id = :CREDENTIAL_ID 
            left join iam.identity ii 
                   on k.updated_by_id = ii.byu_id 
            left join iam.identity iii 
                   on k.created_by_id = iii.byu_id 
     where  a.byu_id = :BYU_ID`,
  checkCredential: `
     select k.byu_id            as "byu_id" 
     from   iam.credential k 
     where  k.credential_type = :CREDENTIAL_TYPE 
                   and k.credential_id = :CREDENTIAL_ID`,
  fromCredential: `
     select a.byu_id                     as "byu_id", 
            a.preferred_name             as "name", 
            a.person_id                  as "person_id", 
            a.restricted                 as "restricted", 
            k.credential_id              as "net_id", 
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
            end                          as "student_status", 
            hr.per_warehouse.classification 
            || '-' 
            || hr.per_warehouse.status 
            || '-' 
            || hr.per_warehouse.standing as "employee_type", 
            k1.credential_type           as "credential_type", 
            k1.credential_id             as "credential_id", 
            k1.user_name                 as "user_name", 
            to_char(k.date_time_updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_updated", 
            k.updated_by_id              as "updated_by_id", 
            ii.identity_name             as "updated_by_name", 
            to_char(k.date_time_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_created", 
            k.created_by_id              as "created_by_id",  
            iii.identity_name            as "created_by_name", 
            k1.lost_or_stolen            as "lost_or_stolen", 
            k1.status                    as "status", 
            to_char(k1.expiration_date, 'YYYY-MM-DD')           as "expiration_date", 
            k1.issuing_location          as "issuing_location", 
            k1.physical_form             as "physical_form", 
            k1.associated_device         as "associated_device", 
            k.scoped_affiliation         as "scoped_affiliation" 
     from   iam.person a 
            left join iam.credential k 
                   on a.byu_id = k.byu_id 
                      and k.credential_type = 'NET_ID' 
            left join iam.credential k1 
                   on a.byu_id = k1.byu_id 
                      and k1.credential_type = :CREDENTIAL_TYPE 
                      and k1.credential_id = :CREDENTIAL_ID 
            left join iam.identity ii 
                   on k1.updated_by_id = ii.byu_id 
            left join iam.identity iii 
                   on k1.created_by_id = iii.byu_id 
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
};

exports.modifyCredential = {
  create: `
     insert into iam.credential 
     values      (:CREDENTIAL_ID, 
                  :CREDENTIAL_TYPE, 
                  :USER_NAME, 
                  :BYU_ID, 
                  to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF3'), 
                  :UPDATED_BY_ID, 
                  to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF3'), 
                  :CREATED_BY_ID, 
                  :LOST_OR_STOLEN, 
                  :STATUS, 
                  to_date(:EXPIRATION_DATE, 'YYYY-MM-DD'), 
                  :ISSUING_LOCATION, 
                  :PHYSICAL_FORM, 
                  :ASSOCIATED_DEVICE, 
                  :SCOPED_AFFILIATION)`,
  logChange: `
     insert into iam.credential_change 
     values      (iam.credential_change_id_seq.nextval, 
                  :CHANGE_TYPE, 
                  :BYU_ID, 
                  :CREDENTIAL_TYPE, 
                  :CREDENTIAL_ID, 
                  to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF3'), 
                  :UPDATED_BY_ID, 
                  to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF3'), 
                  :CREATED_BY_ID, 
                  :FROM_USER_NAME, 
                  :FROM_LOST_OR_STOLEN, 
                  :FROM_STATUS, 
                  to_date(:FROM_EXPIRATION_DATE, 'YYYY-MM-DD'), 
                  :FROM_ISSUING_LOCATION, 
                  :FROM_PHYSICAL_FORM, 
                  :FROM_ASSOCIATED_DEVICE, 
                  :FROM_SCOPED_AFFILIATION, 
                  :USER_NAME, 
                  :LOST_OR_STOLEN, 
                  :STATUS, 
                  to_date(:EXPIRATION_DATE, 'YYYY-MM-DD'), 
                  :ISSUING_LOCATION, 
                  :PHYSICAL_FORM, 
                  :ASSOCIATED_DEVICE, 
                  :SCOPED_AFFILIATION)`,
  update: `
     update iam.credential 
     set    date_time_updated = to_timestamp(:1, 'YYYY-MM-DD HH24:MI:SS.FF3'), 
            updated_by_id = :2, 
            user_name = :3, 
            lost_or_stolen = :4, 
            status = :5, 
            expiration_date = to_date(:6, 'YYYY-MM-DD'), 
            issuing_location = :7, 
            physical_form = :8, 
            associated_device = :9, 
            scoped_affiliation = :10 
     where  byu_id = :11 
            and credential_type = :12 
            and credential_id = :13`,
  delete: `
     delete from iam.credential 
     where  credential_type = :CREDENTIAL_TYPE 
            and credential_id = :CREDENTIAL_ID 
            and byu_id = :BYU_ID`
};











