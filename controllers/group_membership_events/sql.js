exports.sql = {
  getGroupMembershipEvents: `
    select a.byu_id                                                                                as "byu_id",
           a.preferred_name                                                                        as "name",
           pge.person_group_event_id                                                               as "event_id",
           pge.group_id                                                                            as "group_id",
           g.group_name                                                                            as "group_name",
           g.group_type                                                                            as "group_type",
           to_char(pge.date_time_granted at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')     as "date_time_granted", 
           pge.granted_by_id                                                                       as "granted_by_id",
           ii.identity_name                                                                        as "granted_by_name",
           to_char(pge.effective_date, 'YYYY-MM-DD')                                               as "effective_date", 
           to_char(pge.expiration_date, 'YYYY-MM-DD')                                              as "expiration_date", 
           to_char(pge.date_time_inactivated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_inactivated", 
           pge.inactivated_by_id                                                                   as "inactivated_by_id",
           iii.identity_name                                                                       as "inactivated_by_name",
           hpw.job_title                                                                           as "job_title",
           hpw.job_desc_25                                                                         as "job_desc",
           hpw.department                                                                          as "department",
           hpw.classification 
           || hpw.status 
           || hpw.standing                                                                         as "employee_type",
           hpw.classif_desc 
           || ', ' 
           || hpw.status_desc 
           || ', ' 
           || hpw.standing_desc                                                                    as "employee_status_desc"
    from   iam.person a 
           left join gro.person_group_event pge 
                  on a.byu_id = pge.byu_id 
           left join gro.groups g 
                  on pge.group_id = g.group_id 
           left join iam.identity ii 
                  on pge.granted_by_id = ii.person_id 
           left join iam.identity iii 
                  on pge.inactivated_by_id = iii.person_id 
           left join hr.per_warehouse hpw 
                  on a.byu_id = hpw.byu_id 
    where  a.byu_id = :BYU_ID`,
  getGroupMembershipEvent: `
    select a.byu_id                                                                                as "byu_id",
           a.preferred_name                                                                        as "name",
           pge.person_group_event_id                                                               as "event_id",
           pge.group_id                                                                            as "group_id",
           g.group_name                                                                            as "group_name",
           g.group_type                                                                            as "group_type",
           to_char(pge.date_time_granted at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')     as "date_time_granted", 
           pge.granted_by_id                                                                       as "granted_by_id",
           ii.identity_name                                                                        as "granted_by_name",
           to_char(pge.effective_date, 'YYYY-MM-DD')                                               as "effective_date", 
           to_char(pge.expiration_date, 'YYYY-MM-DD')                                              as "expiration_date", 
           to_char(pge.date_time_inactivated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as "date_time_inactivated", 
           pge.inactivated_by_id                                                                   as "inactivated_by_id",
           iii.identity_name                                                                       as "inactivated_by_name",
           hpw.job_title                                                                           as "job_title",
           hpw.job_desc_25                                                                         as "job_desc",
           hpw.department                                                                          as "department",
           hpw.classification 
           || hpw.status 
           || hpw.standing                                                                         as "employee_type",
           hpw.classif_desc 
           || ', ' 
           || hpw.status_desc 
           || ', ' 
           || hpw.standing_desc                                                                    as "employee_status_desc"
    from   iam.person a 
           left join gro.person_group_event pge 
                  on a.byu_id = pge.byu_id 
                     and pge.person_group_event_id = :EVENT_ID 
           left join gro.groups g 
                  on pge.group_id = g.group_id 
           left join iam.identity ii 
                  on pge.granted_by_id = ii.person_id 
           left join iam.identity iii 
                  on pge.inactivated_by_id = iii.person_id 
           left join hr.per_warehouse hpw 
                  on a.byu_id = hpw.byu_id 
    where  a.byu_id = :BYU_ID`,
  map: {
    event_id: event_id.value,
    group_id: group_id.value,
    group_name: group_id.description,
    group_type: group_type.value,
    date_time_granted: date_time_granted,
    granted_by_id: granted_by_id.value,
    granted_by_name: granted_by_id.description,
    effective_date: effective_date.value,
    expiration_date: expiration_date.value,
    group_description: group_description.value,
    date_time_inactivated: date_time_inactivated.value,
    inactivated_by_id: inactivated_by_id.value,
    inactivated_by_name: inactivated_by_id.description,
    byu_id: byu_id.value,
    name: byu_id.description,
    job_title: job_title.value,
    job_desc: job_title.description,
    department: department.value,
    employee_type: employee_type.value,
    employee_status_desc: employee_type.description
  }
};