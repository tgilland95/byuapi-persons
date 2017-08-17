/*
 * Copyright 2017 Brigham Young University
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

exports.sql = {
  getAddresses: `
    select a.byu_id              as "byu_id", 
           a.preferred_name      as "name", 
           a.restricted          as "restricted", 
           loc.address_type      as "address_type", 
           loc.date_time_updated as "date_time_updated", 
           loc.updated_by_id     as "updated_by_id", 
           ii.identity_name      as "updated_by_name", 
           loc.date_time_created as "date_time_created", 
           loc.created_by_id     as "created_by_id", 
           iii.identity_name     as "created_by_name", 
           loc.address_line_1    as "address_line_1", 
           loc.address_line_2    as "address_line_2", 
           loc.address_line_3    as "address_line_3", 
           loc.address_line_4    as "address_line_4", 
           loc.country_code      as "country_code", 
           pcc.country           as "country_name", 
           loc.room              as "room", 
           loc.building          as "building_code", 
           cev.desc_15           as "building_name", 
           cev.description       as "long_building_name", 
           loc.city              as "city", 
           loc.state_code        as "state_code", 
           pcs.state             as "state_name", 
           loc.postal_code       as "postal_code", 
           loc.unlisted          as "unlisted", 
           loc.verified_f        as "verified_flag", 
           idvw.primary_role     as "primary_role" 
    from   iam.person a 
           left join iam.address loc 
                  on a.byu_id = loc.byu_id 
           left join iam.identity ii 
                  on loc.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on loc.created_by_id = iii.byu_id 
           left join pro.code_country pcc 
                  on loc.country_code = pcc.country_code 
                     and pcc.valid_for_address = 'Y' 
           left join pro.code_edit_value cev 
                  on loc.building = cev.domain_value 
                     and cev.domain_name = 'BUILDING' 
           left join pro.code_state pcs 
                  on loc.state_code = pcs.state_code 
                     and loc.country_code = pcs.country_code 
           left join pro.id_card_vw idvw 
                  on a.person_id = idvw.person_id 
    where  a.byu_id = :1`,
  getAddress: `
    select a.byu_id              as "byu_id", 
           a.preferred_name      as "name", 
           a.restricted          as "restricted", 
           loc.address_type      as "address_type", 
           loc.date_time_updated as "date_time_updated", 
           loc.updated_by_id     as "updated_by_id", 
           ii.identity_name      as "updated_by_name", 
           loc.date_time_created as "date_time_created", 
           loc.created_by_id     as "created_by_id", 
           iii.identity_name     as "created_by_name", 
           loc.address_line_1    as "address_line_1", 
           loc.address_line_2    as "address_line_2", 
           loc.address_line_3    as "address_line_3", 
           loc.address_line_4    as "address_line_4", 
           loc.country_code      as "country_code", 
           pcc.country           as "country_name", 
           loc.room              as "room", 
           loc.building          as "building_code", 
           cev.desc_15           as "building_name", 
           cev.description       as "long_building_name", 
           loc.city              as "city", 
           loc.state_code        as "state_code", 
           pcs.state             as "state_name", 
           loc.postal_code       as "postal_code", 
           loc.unlisted          as "unlisted", 
           loc.verified_f        as "verified_flag", 
           idvw.primary_role     as "primary_role" 
    from   iam.person a 
           left join iam.address loc 
                  on a.byu_id = loc.byu_id 
           and loc.address_type = :1 
           left join iam.identity ii 
                  on loc.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on loc.created_by_id = iii.byu_id 
           left join pro.code_country pcc 
                  on loc.country_code = pcc.country_code 
                     and pcc.valid_for_address = 'Y' 
           left join pro.code_edit_value cev 
                  on loc.building = cev.domain_value 
                     and cev.domain_name = 'BUILDING' 
           left join pro.code_state pcs 
                  on loc.state_code = pcs.state_code 
                     and loc.country_code = pcs.country_code 
           left join pro.id_card_vw idvw 
                  on a.person_id = idvw.person_id 
    where  a.byu_id = :2`,
  fromAddress: `
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
           loc.address_type             as "address_type", 
           loc.date_time_updated        as "date_time_updated", 
           loc.updated_by_id            as "updated_by_id", 
           ii.identity_name             as "updated_by_name", 
           loc.date_time_created        as "date_time_created", 
           loc.created_by_id            as "created_by_id", 
           iii.identity_name            as "created_by_name", 
           loc.address_line_1           as "address_line_1", 
           loc.address_line_2           as "address_line_2", 
           loc.address_line_3           as "address_line_3", 
           loc.address_line_4           as "address_line_4", 
           loc.country_code             as "country_code", 
           pcc.country                  as "country_name", 
           loc.room                     as "room", 
           loc.building                 as "building_code", 
           cev.desc_15                  as "building_name", 
           cev.description              as "long_building_name", 
           loc.city                     as "city", 
           loc.state_code               as "state_code", 
           pcs.state                    as "state_name", 
           loc.postal_code              as "postal_code", 
           loc.unlisted                 as "unlisted", 
           loc.verified_f               as "verified_flag", 
           idvw.primary_role            as "primary_role" 
    from   iam.person a 
           left join iam.address loc 
                  on a.byu_id = loc.byu_id 
                     and loc.address_type = :1 
           left join iam.identity ii 
                  on loc.updated_by_id = ii.byu_id 
           left join iam.identity iii 
                  on loc.created_by_id = iii.byu_id 
           left join pro.code_country pcc 
                  on loc.country_code = pcc.country_code 
                     and pcc.valid_for_address = 'Y' 
           left join pro.code_edit_value cev 
                  on loc.building = cev.domain_value 
                     and cev.domain_name = 'BUILDING' 
           left join pro.code_state pcs 
                  on loc.state_code = pcs.state_code 
                     and loc.country_code = pcs.country_code 
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
    where  a.byu_id = :2`
};

exports.modifyAddress = {
  create: `
    insert into iam.address 
    values      (:BYU_ID, 
                 :ADDRESS_TYPE, 
                 to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                 :UPDATED_BY_ID, 
                 to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                 :CREATED_BY_ID, 
                 :ADDRESS_LINE_1, 
                 :ADDRESS_LINE_2, 
                 :ADDRESS_LINE_3, 
                 :ADDRESS_LINE_4, 
                 :COUNTRY_CODE, 
                 :ROOM, 
                 :BUILDING, 
                 :CITY, 
                 :STATE_CODE, 
                 :POSTAL_CODE, 
                 :UNLISTED, 
                 :VERIFIED_F)`,
  logChange: `
    insert into iam.address_change 
    values      (iam.address_change_id_seq.nextval, 
                 :CHANGE_TYPE, 
                 :BYU_ID, 
                 :ADDRESS_TYPE, 
                 to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                 :UPDATED_BY_ID, 
                 to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                 :CREATED_BY_ID, 
                 :FROM_ADDRESS_LINE_1, 
                 :FROM_ADDRESS_LINE_2, 
                 :FROM_ADDRESS_LINE_3, 
                 :FROM_ADDRESS_LINE_4, 
                 :FROM_COUNTRY_CODE, 
                 :FROM_ROOM, 
                 :FROM_BUILDING, 
                 :FROM_CITY, 
                 :FROM_STATE_CODE, 
                 :FROM_POSTAL_CODE, 
                 :FROM_UNLISTED, 
                 :FROM_VERIFIED_F, 
                 :ADDRESS_LINE_1, 
                 :ADDRESS_LINE_2, 
                 :ADDRESS_LINE_3, 
                 :ADDRESS_LINE_4, 
                 :COUNTRY_CODE, 
                 :ROOM, 
                 :BUILDING, 
                 :CITY, 
                 :STATE_CODE, 
                 :POSTAL_CODE, 
                 :UNLISTED, 
                 :VERIFIED_F)`,
  update: `
    update iam.address 
    set    date_time_updated = to_timestamp(sysdate, 'YYYY-MM-DD HH24:MI:SS.FF'), 
           updated_by_id = :1, 
           address_line_1 = :2, 
           address_line_2 = :3, 
           address_line_3 = :4, 
           address_line_4 = :5, 
           country_code = :6, 
           room = :7, 
           building = :8, 
           city = :9, 
           state_code = :10, 
           postal_code = :11, 
           unlisted = :12, 
           verified_f = :13 
           where  byu_id = :14 
           and address_type = :15`,
  delete: `
    delete from iam.address 
    where  address_type = :ADDRESS_TYPE 
           and byu_id = :BYU_ID`
};

exports.intermediaryId = {
  get: `
    select events.intermediary.intermediary_id as "intermediary_id" 
    from   events.intermediary 
    where  events.intermediary.url = :URL`,
  put: `
    insert into events.intermediary 
    values  (events.intermediary_seq.nextval, 
             :URL, 
             :ACTOR, 
             :GROUP_ID, 
             sysdate, 
             :CREATED_BY_ID)`
};

exports.eventPersonAddress = {
  raiseEvent: `
    insert into iam.event 
                (event_id, 
                 date_time_created, 
                 event_body) 
    values      (iam.event_id_seq.nextval, 
                 systimestamp, 
                 :1)`
};

exports.enqueue = {
  sql: `
    CALL iam.iam_enqueue_now(:1)`
};