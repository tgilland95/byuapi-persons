exports.sql = {
  getGroupMemberships: ` 
     select p.byu_id             as "byu_id", 
            p.preferred_name     as "name", 
            pg.group_id          as "group_id", 
            g.group_name         as "group_name", 
            g.group_type         as "group_type", 
            hpw.job_title        as "job_title", 
            hpw.job_desc_25      as "job_desc", 
            hpw.department       as "department", 
            hpw.classification 
            || '-' 
            || hpw.status 
            || '-' 
            || hpw.standing      as "employee_type", 
            hpw.classif_desc 
            || ', ' 
            || hpw.status_desc 
            || ', ' 
            || hpw.standing_desc as "employee_status_desc" 
     from   iam.person p 
            left join gro.person_group pg 
                   on ( p.byu_id = pg.byu_id 
                         or p.person_id = pg.person_id ) 
            left join gro.groups g 
                   on pg.group_id = g.group_id 
            left join hr.per_warehouse hpw 
                   on p.byu_id = hpw.byu_id 
     where  p.byu_id = :BYU_ID`,
  getGroupMembership: `
     select p.byu_id             as "byu_id", 
            p.preferred_name     as "name", 
            pg.group_id          as "group_id", 
            g.group_name         as "group_name", 
            g.group_type         as "group_type", 
            hpw.job_title        as "job_title", 
            hpw.job_desc_25      as "job_desc", 
            hpw.department       as "department", 
            hpw.classification 
            || '-' 
            || hpw.status 
            || '-' 
            || hpw.standing      as "employee_type", 
            hpw.classif_desc 
            || ', ' 
            || hpw.status_desc 
            || ', ' 
            || hpw.standing_desc as "employee_status_desc" 
     from   iam.person p 
            left join gro.person_group pg 
                   on ( p.byu_id = pg.byu_id 
                         or p.person_id = pg.person_id ) 
                      and pg.group_id = :GROUP_ID 
            left join gro.groups g 
                   on pg.group_id = g.group_id 
            left join hr.per_warehouse hpw 
                   on p.byu_id = hpw.byu_id 
     where  p.byu_id = :BYU_ID`,
  queryGroupMemberships: `
     select p.byu_id             as "byu_id", 
            p.preferred_name     as "name", 
            pg.group_id          as "group_id", 
            g.group_name         as "group_name", 
            g.group_type         as "group_type", 
            hpw.job_title        as "job_title", 
            hpw.job_desc_25      as "job_desc", 
            hpw.department       as "department", 
            hpw.classification 
            || '-' 
            || hpw.status 
            || '-' 
            || hpw.standing      as "employee_type", 
            hpw.classif_desc 
            || ', ' 
            || hpw.status_desc 
            || ', ' 
            || hpw.standing_desc as "employee_status_desc" 
     from   iam.person p 
            left join gro.person_group pg 
                   on ( p.byu_id = pg.byu_id 
                         or p.person_id = pg.person_id ) 
            left join gro.groups g 
                   on pg.group_id = g.group_id 
            left join hr.per_warehouse hpw 
                   on p.byu_id = hpw.byu_id 
     where  p.byu_id = :BYU_ID 
            and pg.group_id in (`,
  map: {
    group_id: group_id.value,
    group_name: group_id.description,
    group_type: group_type.value,
    byu_id: byu_id.value,
    name: byu_id.description,
    job_title: job_title.value,
    job_desc: job_title.description,
    department: department.value,
    employee_type: employee_type.value,
    employee_status_desc: employee_type.description
  }
};