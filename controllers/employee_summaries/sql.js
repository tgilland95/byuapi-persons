"use strict";

exports.sql = {
    getEmployeeSummaries: ""
    + "select a.byu_id             as \"byu_id\", "
    + "       a.preferred_name     as \"name\", "
    + "       a.restricted         as \"restricted\", "
    + "       hpw.classification "
    + "       || '-' "
    + "       || hpw.status "
    + "       || '-' "
    + "       || hpw.standing      as \"employee_type\", "
    + "       hpw.classif_desc "
    + "       || ', ' "
    + "       || hpw.status_desc "
    + "       || ', ' "
    + "       || hpw.standing_desc as \"employee_type_desc\", "
    + "       hpw.department       as \"department\", "
    + "       hpw.job_title        as \"job_title\", "
    + "       hpw.job_desc_25      as \"job_desc\", "
    + "       hpw.hire_date        as \"hire_date\", "
    + "       hpw.reports_to_id    as \"reports_to_id\", "
    + "       hpw.reports_to_name  as \"reports_to_name\", "
    + "       idcv.primary_role    as \"primary_role\" "
    + "from   iam.person a "
    + "       left join hr.per_warehouse hpw "
    + "              on a.byu_id = hpw.byu_id "
    + "       left join pro.id_card_vw idcv "
    + "              on a.person_id = idcv.person_id "
    + "where  a.byu_id = :1",
    map: {
        byu_id: "byu_id.value",
        name: "byu_id.description",
        employee_type: "employee_type.value",
        employee_type_desc: "employee_type.description",
        department: "department.value",
        job_title: "job_title.value",
        job_desc: "job_title.description",
        hire_date: "hire_date.value",
        reports_to_id: "reports_to_id.value",
        reports_to_name: "reports_to_id.description"
    },
    map_public: {
        department: "department.value",
        job_title: "job_title.value",
        job_desc: "job_title.description"
    }
};




