exports.getPersons = {
  sql: {
    select: `select iam.person.byu_id as "byu_id", nvl(iam.person.restricted, 'N') as "restricted"`,

    from: ` from iam.person`,

    where: ` where 1=1`
  }
  // map: {
  //   byu_id: byu_id.value
  // }
};

exports.addPerson = {
  check: `
     select case 
              when exists (select 'x' 
                           from   gro.person_group 
                           where  byu_id = :CREATED_BY_ID 
                                  and group_id = 'IAM_EVENT_CONSUMER') then 1 
              else 0 
            end as "is_valid_auth", 
            case 
              when exists (select 'x' 
                           from   iam.identity 
                           where  byu_id = :BYU_ID 
                                  or person_id = :PERSON_ID) then 1 
              else 0 
            end as "is_identity", 
            case 
              when exists (select 'x' 
                           from   iam.person 
                           where  byu_id = :BYU_ID 
                                  or person_id = :PERSON_ID) then 1 
              else 0 
            end as "is_person", 
            case 
              when exists (select 'x' 
                           from   iam.person 
                           where  surname = :SURNAME 
                                  and first_name = :FIRST_NAME 
                                  and date_of_birth = to_date(:DATE_OF_BIRTH, 'YYYY-MM-DD')) then 1 
              else 0 
            end as "match_found", 
            case 
              when exists (select 'x' 
                           from   iam.person 
                           where  ssn = :SSN) then 1 
              else 0 
            end as "ssn_found" 
     from   dual`,
  createPerson: `
     insert into iam.person 
     values      (:BYU_ID, 
                  to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :UPDATED_BY_ID, 
                  to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :CREATED_BY_ID, 
                  :SURNAME, 
                  :REST_OF_NAME, 
                  :SUFFIX, 
                  :PREFERRED_FIRST_NAME, 
                  :PREFERRED_SURNAME, 
                  :PREFERRED_NAME, 
                  :SORT_NAME, 
                  :FIRST_NAME, 
                  :MIDDLE_NAME, 
                  to_date(:DATE_OF_BIRTH, 'YYYY-MM-DD'), 
                  :DECEASED, 
                  to_date(:DATE_OF_DEATH, 'YYYY-MM-DD'), 
                  :SEX, 
                  :MARITAL_STATUS, 
                  :RELIGION_CODE, 
                  :WARD_LDS_UNIT_CODE, 
                  :CITIZENSHIP_COUNTRY_CODE, 
                  :BIRTH_COUNTRY_CODE, 
                  :HOME_TOWN, 
                  :HOME_STATE_CODE, 
                  :HOME_COUNTRY_CODE, 
                  :HIGH_SCHOOL_CODE, 
                  :RESTRICTED, 
                  :SSN, 
                  to_date(:SSN_VERIFICATION_DATE, 'YYYY-MM-DD'), 
                  :VISA_TYPE, 
                  to_date(:I20_EXPIRATION_DATE, 'YYYY-MM-DD'), 
                  :VISA_TYPE_SOURCE, 
                  :PERSON_ID, 
                  to_date(:LDS_CONFIRMATION_DATE, 'YYYY-MM-DD'))`,
  logPersonChange: `
     insert into iam.person_change 
     values      (iam.person_change_id_seq.nextval, 
                  :CHANGE_TYPE, 
                  :BYU_ID, 
                  to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :UPDATED_BY_ID, 
                  to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :CREATED_BY_ID, 
                  to_date(:FROM_DATE_OF_BIRTH, 'YYYY-MM-DD'), 
                  :FROM_DECEASED, 
                  to_date(:FROM_DATE_OF_DEATH, 'YYYY-MM-DD'), 
                  :FROM_SEX, 
                  :FROM_MARITAL_STATUS, 
                  :FROM_RELIGION_CODE, 
                  :FROM_WARD_LDS_UNIT_CODE, 
                  :FROM_CITIZENSHIP_COUNTRY_CODE, 
                  :FROM_BIRTH_COUNTRY_CODE, 
                  :FROM_HOME_TOWN, 
                  :FROM_HOME_STATE_CODE, 
                  :FROM_HOME_COUNTRY_CODE, 
                  :FROM_HIGH_SCHOOL_CODE, 
                  :FROM_RESTRICTED, 
                  :FROM_SSN, 
                  to_date(:FROM_SSN_VERIFICATION_DATE, 'YYYY-MM-DD'), 
                  :FROM_VISA_TYPE, 
                  to_date(:FROM_I20_EXPIRATION_DATE, 'YYYY-MM-DD'), 
                  :FROM_VISA_TYPE_SOURCE, 
                  to_date(:FROM_LDS_CONFIRMATION_DATE, 'YYYY-MM-DD'), 
                  to_date(:DATE_OF_BIRTH, 'YYYY-MM-DD'), 
                  :DECEASED, 
                  to_date(:DATE_OF_DEATH, 'YYYY-MM-DD'), 
                  :SEX, 
                  :MARITAL_STATUS, 
                  :RELIGION_CODE, 
                  :WARD_LDS_UNIT_CODE, 
                  :CITIZENSHIP_COUNTRY_CODE, 
                  :BIRTH_COUNTRY_CODE, 
                  :HOME_TOWN, 
                  :HOME_STATE_CODE, 
                  :HOME_COUNTRY_CODE, 
                  :HIGH_SCHOOL_CODE, 
                  :RESTRICTED, 
                  :SSN, 
                  to_date(:SSN_VERIFICATION_DATE, 'YYYY-MM-DD'), 
                  :VISA_TYPE, 
                  to_date(:I20_EXPIRATION_DATE, 'YYYY-MM-DD'), 
                  :VISA_TYPE_SOURCE, 
                  to_date(:LDS_CONFIRMATION_DATE, 'YYYY-MM-DD'))`,
  logNameChange: `
     insert into iam.name_change 
     values      (iam.name_change_id_seq.nextval, 
                  :CHANGE_TYPE, 
                  :BYU_ID, 
                  to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :UPDATED_BY_ID, 
                  to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :CREATED_BY_ID, 
                  :FROM_SURNAME, 
                  :FROM_REST_OF_NAME, 
                  :FROM_SUFFIX, 
                  :FROM_PREFERRED_FIRST_NAME, 
                  :FROM_PREFERRED_SURNAME, 
                  :FROM_PREFERRED_NAME, 
                  :FROM_SORT_NAME, 
                  :FROM_FIRST_NAME, 
                  :FROM_MIDDLE_NAME, 
                  :SURNAME, 
                  :REST_OF_NAME, 
                  :SUFFIX, 
                  :PREFERRED_FIRST_NAME, 
                  :PREFERRED_SURNAME, 
                  :PREFERRED_NAME, 
                  :SORT_NAME, 
                  :FIRST_NAME, 
                  :MIDDLE_NAME)`,
  createIdentity: `
     insert into iam.identity 
     values      (:BYU_ID, 
                  to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :UPDATED_BY_ID, 
                  to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :CREATED_BY_ID, 
                  :IDENTITY_TYPE, 
                  :IDENTITY_NAME, 
                  :TEST_RECORD_RESPONSIBLE_ID, 
                  :VALIDATION_PHRASE, 
                  to_timestamp(:DATE_TIME_FERPA_LAST_DISPLAYED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :PERSON_ID)`,
  logIdentityChange: `
     insert into iam.identity_change 
     values      (iam.identity_change_id_seq.nextval, 
                  :CHANGE_TYPE, 
                  :BYU_ID, 
                  to_timestamp(:DATE_TIME_UPDATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :UPDATED_BY_ID, 
                  to_timestamp(:DATE_TIME_CREATED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :CREATED_BY_ID, 
                  :IDENTITY_TYPE, 
                  :FROM_IDENTITY_NAME, 
                  :FROM_TEST_RESPONSIBLE_ID, 
                  :FROM_VALIDATION_PHRASE, 
                  to_timestamp(:FROM_DTG_FERPA_LAST_DISPLAYED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :IDENTITY_NAME, 
                  :TEST_RECORD_RESPONSIBLE_ID, 
                  :VALIDATION_PHRASE, 
                  to_timestamp(:DATE_TIME_FERPA_LAST_DISPLAYED, 'YYYY-MM-DD HH24:MI:SS.FF'), 
                  :PERSON_ID)`,
  personCopy: `
     insert into iam.identity 
                 (byu_id, 
                  date_time_updated, 
                  updated_by_id, 
                  date_time_created, 
                  created_by_id, 
                  identity_type, 
                  identity_name, 
                  person_id) 
     select byu_id, 
            date_time_updated, 
            updated_by_id, 
            date_time_created, 
            created_by_id, 
            nvl(identity_type, 'Person'), 
            iam.person.preferred_name, 
            person_id 
     from   iam.person 
     where  iam.person.byu_id = :BYU_ID`
};