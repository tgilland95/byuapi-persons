exports.getStudentSummaries = `
  select case 
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
        end              as "student_status", 
        case 
          when exists (select 'x' 
                       from   std_classes 
                       where  std_classes.person_id = c.person_id 
                              and std_classes.year_term >= (select control_dates.year_term 
                                                            from   control_dates 
                                                            where  control_dates.date_type = 'CURRENT_YYT' 
                                                                   and trunc(control_dates.start_date) <= trunc(sysdate) 
                                                                   and trunc(control_dates.end_date) >= trunc(sysdate) 
                                                                   and rownum = 1)) then 'Y' 
          else 'N' 
        end              as "current_student", 
        case 
          when exists (select 'x' 
                       from   std_term_status 
                       where  std_term_status.person_id = c.person_id 
                              and std_term_status.year_term >= (select control_dates.year_term 
                                                                from   control_dates 
                                                                where  control_dates.date_type = 'CURRENT_YYT' 
                                                                       and trunc(control_dates.start_date) <= trunc (sysdate) 
                                                                       and trunc(control_dates.end_date) >= trunc(sysdate) 
                                                                       and rownum = 1)) then 'Y' 
          else 'N' 
        end              as "eligible_to_register", 
        c.byu_id         as "byu_id", 
        c.preferred_name as "name", 
        c.restricted     as "restricted" 
  from   iam.person c 
        left join ods.std_reg_eligibility e 
               on c.person_id = e.person_id 
                  and ( e.year_term is null 
                         or e.year_term = (select max(e2.year_term) 
                                           from   std_reg_eligibility_lnk e2 
                                           where  c.person_id = e2.person_id) ) 
        left join control_dates d 
               on e.year_term = d.year_term 
                  and d.date_type = 'CURRENT_YYT' 
                  and trunc(d.start_date) <= trunc(sysdate) 
                  and trunc(d.end_date) >= trunc(sysdate) 
  where  c.byu_id = :BYU_ID`;

//   map: {
//     byu_id: byu_id.value,
//     name: byu_id.description,
//     student_status: student_status.value,
//     current_student: current_student.value,
//     eligible_to_register: eligible_to_register.value
//   }
// };