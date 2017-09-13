exports.getEmployeeSummaries = ` 
  select a.byu_id                                                  as "byu_id", 
         a.preferred_name                                          as "name", 
         a.restricted                                              as "restricted", 
         hpw.classification 
         || '-' 
         || hpw.status 
         || '-' 
         || hpw.standing                                           as "employee_type", 
         hpw.classif_desc 
         || ', ' 
         || hpw.status_desc 
         || ', ' 
         || hpw.standing_desc                                      as "employee_type_desc", 
         hpw.department                                            as "department", 
         hpw.job_title                                             as "job_title", 
         hpw.job_desc_25                                           as "job_desc", 
         to_char(to_date(hpw.hire_date, 'YYYYMMDD'), 'YYYY-MM-DD') as "hire_date", 
         hpw.reports_to_id                                         as "reports_to_id", 
         hpw.reports_to_name                                       as "reports_to_name", 
         idcv.primary_role                                         as "primary_role" 
  from   iam.person a 
         left join hr.per_warehouse hpw 
                on a.byu_id = hpw.byu_id 
         left join pro.id_card_vw idcv 
                on a.person_id = idcv.person_id 
  where  a.byu_id = :BYU_ID`;




