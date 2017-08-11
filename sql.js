"use strict";

exports.access_delegation = {
    selectAccessDelegation: "SELECT " +
    "delegation.access_delegation.access_delegation_id AS \"access_delegation_id\", " +
    "delegation.access_delegation.person_id AS \"person_id\", " +
    "delegation.access_delegation.delegated_person_id AS \"delegated_person_id\", " +
    "delegation.access_delegation.date_time_created AS \"date_time_created\", " +
    "delegation.access_delegation.date_time_accepted AS \"date_time_accepted\", " +
    "delegation.access_delegation.created_by_id AS \"created_by_id\", " +
    "delegation.access_delegation.date_time_revoked AS \"date_time_revoked\", " +
    "delegation.access_delegation.revoked_by_id AS \"revoked_by_id\", " +
    "delegation.access_delegation.expiration_date AS \"expiration_date\", " +
    "delegation.access_delegation.access_type AS \"access_type\", " +
    "delegation.access_delegation.date_time_updated AS \"date_time_updated\", " +
    "delegation.access_delegation.updated_by_id AS \"updated_by_id\", " +
    "delegation.access_delegation.categories AS \"categories\" " +
    "FROM " +
    "delegation.access_delegation " +
    "WHERE " +
    "delegation.access_delegation.person_id = :person_id " +
    "AND " +
    "delegation.access_delegation.access_delegation_id = :access_delegation_id",
    selectAccessDelegations: "SELECT " +
    "delegation.access_delegation.access_delegation_id AS \"access_delegation_id\", " +
    "delegation.access_delegation.person_id AS \"person_id\", " +
    "delegation.access_delegation.delegated_person_id AS \"delegated_person_id\", " +
    "delegation.access_delegation.date_time_created AS \"date_time_created\", " +
    "delegation.access_delegation.date_time_accepted AS \"date_time_accepted\", " +
    "delegation.access_delegation.created_by_id AS \"created_by_id\", " +
    "delegation.access_delegation.date_time_revoked AS \"date_time_revoked\", " +
    "delegation.access_delegation.revoked_by_id AS \"revoked_by_id\", " +
    "delegation.access_delegation.expiration_date AS \"expiration_date\", " +
    "delegation.access_delegation.access_type AS \"access_type\", " +
    "delegation.access_delegation.date_time_updated AS \"date_time_updated\", " +
    "delegation.access_delegation.updated_by_id AS \"updated_by_id\", " +
    "delegation.access_delegation.categories AS \"categories\" " +
    "FROM " +
    "delegation.access_delegation " +
    "WHERE " +
    "delegation.access_delegation.person_id = :person_id",
    updateAccessDelegation: "update delegation.access_delegation " +
    "set " +
    "person_id =:person_id, " +
    "delegated_person_id =:delegated_person_id, " +
    "date_time_created = to_timestamp(:date_time_created, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "date_time_accepted = to_timestamp(:date_time_accepted, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "created_by_id =:created_by_id, " +
    "date_time_revoked = to_timestamp(:date_time_revoked, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "revoked_by_id =:revoked_by_id, " +
    "expiration_date = to_timestamp(:expiration_date, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "access_type =:access_type, " +
    "date_time_updated = to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "updated_by_id =:updated_by_id, " +
    "categories =:categories " +
    "where " +
    "access_delegation_id =:access_delegation_id",
    insertAccessDelegation: "insert into DELEGATION.access_delegation " +
    "values (:access_delegation_id, " +
    ":person_id, " +
    ":delegated_person_id, " +
    "to_timestamp(:date_time_created, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "to_timestamp(:date_time_accepted, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    ":created_by_id, " +
    "to_timestamp(:date_time_revoked, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    ":revoked_by_id, " +
    "to_timestamp(:expiration_date, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    ":access_type, " +
    "to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    ":updated_by_id, " +
    ":categories)"
};

exports.address = {
    selectAddress: "SELECT " +
    "pro.address.person_id AS \"person_id\", " +
    "pro.address.address_type AS \"address_type\", " +
    "pro.address.date_time_updated AS \"date_time_updated\", " +
    "pro.address.updated_by_id AS \"updated_by_id\", " +
    "pro.address.address_line_1 AS \"address_line_1\", " +
    "pro.address.address_line_2 AS \"address_line_2\", " +
    "pro.address.address_line_3 AS \"address_line_3\", " +
    "pro.address.address_line_4 AS \"address_line_4\", " +
    "pro.address.country_code AS \"country_code\", " +
    "pro.address.city AS \"city\", " +
    "pro.address.state_code AS \"state_code\", " +
    "pro.address.postal_code AS \"postal_code\", " +
    "pro.address.contact_status AS \"contact_status\", " +
    "pro.address.unlisted AS \"unlisted\", " +
    "pro.address.campus_address_f AS \"campus_address_f\", " +
    "pro.address.source_institution AS \"source_institution\", " +
    "pro.address.source_application AS \"source_application\", " +
    "pro.address.source_function AS \"source_function\", " +
    "pro.address_log.date_time_updated AS \"date_time_created\", " +
    "pro.address_log.updated_by_id AS \"created_by_id\" " +
    "FROM " +
    "pro.address " +
    "LEFT JOIN pro.address_log ON " +
    "pro.address.person_id = pro.address_log.person_id " +
    "AND " +
    "pro.address.address_type = pro.address_log.address_type " +
    "AND " +
    "pro.address_log.updated_by_id != 'DELETE' " +
    "WHERE " +
    "pro.address.person_id =:person_id " +
    "AND " +
    "pro.address.address_type =:address_type " +
    "AND " +
    "ROWNUM = 1 " +
    "ORDER BY \"date_time_created\"",
    selectAddresses: "SELECT " +
    "pro.address.person_id as \"person_id\", " +
    "pro.address.address_type as \"address_type\", " +
    "pro.address.date_time_updated AS \"date_time_updated\", " +
    "pro.address.updated_by_id AS \"updated_by_id\", " +
    "pro.address.address_line_1 AS \"address_line_1\", " +
    "pro.address.address_line_2 AS \"address_line_2\", " +
    "pro.address.address_line_3 AS \"address_line_3\", " +
    "pro.address.address_line_4 AS \"address_line_4\", " +
    "pro.address.country_code AS \"country_code\", " +
    "pro.address.city AS \"city\", " +
    "pro.address.state_code AS \"state_code\", " +
    "pro.address.postal_code AS \"postal_code\", " +
    "pro.address.contact_status AS \"contact_status\", " +
    "pro.address.unlisted AS \"unlisted\", " +
    "pro.address.campus_address_f AS \"campus_address_f\", " +
    "pro.address.source_institution AS \"source_institution\", " +
    "pro.address.source_application AS \"source_application\", " +
    "pro.address.source_function AS \"source_function\", " +
    "qu.date_time_created as \"date_time_created\", " +
    "qu.created_by_id as \"created_by_id\" " +
    "from " +
    "pro.address, " +
    "    (select q.person_id, al.updated_by_id as created_by_id, q.address_type, q.date_time_created from " +
    "pro.address_log al, " +
    "    (select person_id as person_id, address_type as address_type, min(date_time_updated) as date_time_created " +
    "from pro.address_log " +
    "where person_id = :person_id " +
    "group by person_id, address_type) q " +
    "where al.person_id = q.person_id " +
    "and al.address_type = q.address_type " +
    "and al.date_time_updated = q.date_time_created) qu " +
    "where pro.address.person_id = qu.person_id (+) " +
    "and pro.address.address_type = qu.address_type (+) " +
    "and pro.address.person_id = :person_id",
    insertAddress: "insert into pro.address values ( " +
    "    :person_id, " +
    "    :address_type, " +
    "    to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "    :updated_by_id, " +
    "    :address_line_1, " +
    "    :address_line_2, " +
    "    :address_line_3, " +
    "    :address_line_4, " +
    "    :country_code, " +
    "    :city, " +
    "    :state_code, " +
    "    :postal_code, " +
    "    :contact_status, " +
    "    :unlisted, " +
    "    :campus_address_f, " +
    "    :source_institution, " +
    "    :source_application, " +
    "    :source_function)",
    updateAddress: "update pro.address set " +
    "date_time_updated = to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "updated_by_id = :updated_by_id, " +
    "address_line_1 = :address_line_1, " +
    "address_line_2 = :address_line_2, " +
    "address_line_3 = :address_line_3, " +
    "address_line_4 = :address_line_4, " +
    "country_code = :country_code, " +
    "city = :city, " +
    "state_code = :state_code, " +
    "postal_code = :postal_code, " +
    "contact_status = :contact_status, " +
    "unlisted = :unlisted, " +
    "campus_address_f = :campus_address_f, " +
    "source_institution = :source_institution, " +
    "source_application = :source_application, " +
    "source_function = :source_function " +
    "where person_id = :person_id " +
    "and address_type = :address_type",
    deleteAddress: "delete from pro.address where person_id = :person_id and address_type = :address_type"
};

exports.delegate = {
    selectDelegate: "SELECT " +
    "delegation.delegate.person_id AS \"person_id\", " +
    "delegation.delegate.validation_phrase AS \"validation_phrase\", " +
    "delegation.delegate.date_time_ferpa_last_displayed AS \"date_time_ferpa_last_displayed\", " +
    "delegation.delegate.date_time_updated AS \"date_time_updated\" " +
    "FROM " +
    "delegation.delegate " +
    "WHERE " +
    "delegation.delegate.person_id =:person_id",
    insertDelegate: "insert into delegation.delegate values ( " +
    ":person_id, " +
    ":validation_phrase, " +
    ":date_time_ferpa_last_displayed, " +
    "to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'))",
    updateDelegate: "update delegation.delegate set " +
    "validation_phrase = :validation_phrase, " +
    "date_time_ferpa_last_displayed = :date_time_ferpa_last_displayed, " +
    "date_time_updated = to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF') " +
    "where person_id = :person_id"
};

exports.delegated_access = {
    selectDelegatedAccess: "SELECT " +
    "delegation.delegated_access.delegated_access_id AS \"delegated_access_id\", " +
    "delegation.delegated_access.access_delegation_id AS \"access_delegation_id\", " +
    "delegation.delegated_access.category AS \"category\" " +
    "FROM " +
    "delegation.delegated_access " +
    "WHERE " +
    "delegation.delegated_access.delegated_access_id =:delegated_access_id",
    insertDelegatedAccess: "insert into DELEGATION.delegated_access values ( " +
    ":delegated_access_id, " +
    ":access_delegation_id, " +
    ":category)",
    updateDelegatedAccess: "update DELEGATION.DELEGATED_ACCESS set " +
    "access_delegation_id = :access_delegation_id, " +
    "category = :category " +
    "where delegated_access_id = :delegated_access_id"
};

exports.delegated_operation_performed = {
    selectDelegatedOperationPerformed: "select " +
    "operation_performed_id as \"operation_performed_id\", " +
    "operation as \"operation\", " +
    "web_resource_id as \"web_resource_id\", " +
    "person_id as \"person_id\", " +
    "delegated_person_id as \"delegated_person_id\", " +
    "session_id as \"session_id\", " +
    "date_time_started as \"date_time_started\", " +
    "date_time_finished as \"date_time_finished\", " +
    "completion_status as \"completion_status\" " +
    "from delegation.delegated_operation_performed " +
    "where OPERATION_PERFORMED_ID = :operation_performed_id",
    insertDelegatedOperationPerformed: "insert into DELEGATION.delegated_operation_performed values ( " +
    ":operation_performed_id, " +
    ":operation, " +
    ":web_resource_id, " +
    ":person_id, " +
    ":delegated_person_id, " +
    ":session_id, " +
    "to_timestamp(:date_time_started, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "to_timestamp(:date_time_finished, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    ":completion_status)",
    updatedDelegatedOperationPerformed: "update DELEGATION.DELEGATED_OPERATION_PERFORMED set " +
    "operation = :operation, " +
    "web_resource_id = :web_resource_id, " +
    "person_id = :person_id, " +
    "delegated_person_id = :delegated_person_id, " +
    "session_id = :session_id, " +
    "date_time_started = to_timestamp(:date_time_started, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "date_time_finished = to_timestamp(:date_time_finished, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "completion_status = :completion_status " +
    "where operation_performed_id = :operation_performed_id"
};

exports.email = {
    selectEmail: "SELECT " +
    "pro.email_address.person_id AS \"person_id\", " +
    "pro.email_address.date_time_updated AS \"date_time_updated\", " +
    "pro.email_address.updated_by_id AS \"updated_by_id\", " +
    "pro.email_address.email_address AS \"email_address\", " +
    "pro.email_address.contact_status AS \"contact_status\", " +
    "pro.email_address.unlisted AS \"unlisted\", " +
    "pro.email_address.source_institution AS \"source_institution\", " +
    "pro.email_address.source_application AS \"source_application\", " +
    "pro.email_address.source_function AS \"source_function\", " +
    "pro.email_address.use_for_emergency_alert AS \"use_for_emergency_alert\", " +
    "pro.email_address.work_email_address AS \"work_email_address\", " +
    "pro.email_address_log.date_time_updated AS \"date_time_created\", " +
    "pro.email_address_log.updated_by_id AS \"created_by_id\" " +
    "FROM " +
    "pro.email_address " +
    "LEFT JOIN pro.email_address_log ON " +
    "pro.email_address.person_id = pro.email_address_log.person_id " +
    "AND " +
    "pro.email_address_log.updated_by_id != 'DELETE' " +
    "WHERE " +
    "pro.email_address.person_id =:person_id " +
    "AND " +
    "ROWNUM = 1 " +
    "ORDER BY \"date_time_created\"",
    insertEmail: "insert into pro.email_address values ( " +
    ":person_id, " +
    "to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    ":updated_by_id, " +
    ":email_address, " +
    ":contact_status, " +
    ":unlisted, " +
    ":source_institution, " +
    ":source_application, " +
    ":source_function, " +
    ":use_for_emergency_alert, " +
    ":work_email_address)",
    updateEmail: "update pro.email_address set " +
    "date_time_updated = to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "updated_by_id = :updated_by_id, " +
    "email_address = :email_address, " +
    "contact_status = :contact_status, " +
    "unlisted = :unlisted, " +
    "source_institution = :source_institution, " +
    "source_application = :source_application, " +
    "source_function = :source_function, " +
    "use_for_emergency_alert = :use_for_emergency_alert, " +
    "work_email_address = :work_email_address " +
    "where person_id = :person_id",
    deleteEmail: "delete from pro.email_address where person_id = :person_id"
};

exports.ethnicity = {
    selectEthnicity: "SELECT " +
    "pro.ethnicity.person_id AS \"person_id\", " +
    "pro.ethnicity.ethnicity_code AS \"ethnicity_code\", " +
    "pro.ethnicity.primary_f AS \"primary_f\", " +
    "pro.ethnicity.date_time_updated AS \"date_time_updated\", " +
    "pro.ethnicity.updated_by_id AS \"updated_by_id\", " +
    "pro.ethnicity.source_institution AS \"source_institution\", " +
    "pro.ethnicity.source_application AS \"source_application\", " +
    "pro.ethnicity.source_function AS \"source_function\", " +
    "pro.ethnicity_log.date_time_updated AS \"date_time_created\", " +
    "pro.ethnicity_log.updated_by_id AS \"created_by_id\" " +
    "FROM " +
    "pro.ethnicity " +
    "LEFT JOIN pro.ethnicity_log ON " +
    "pro.ethnicity.person_id = pro.ethnicity_log.person_id " +
    "AND " +
    "pro.ethnicity.ethnicity_code = pro.ethnicity_log.ethnicity_code " +
    "AND " +
    "pro.ethnicity_log.updated_by_id != 'DELETE' " +
    "WHERE " +
    "pro.ethnicity.person_id =:person_id " +
    "AND " +
    "pro.ethnicity.ethnicity_code =:ethnicity_code " +
    "AND " +
    "ROWNUM = 1 " +
    "ORDER BY \"date_time_created\"",
    selectEthnicities: "SELECT " +
    "pro.ethnicity.person_id AS \"person_id\", " +
    "pro.ethnicity.ethnicity_code AS \"ethnicity_code\", " +
    "pro.ethnicity.primary_f AS \"primary_f\", " +
    "pro.ethnicity.date_time_updated AS \"date_time_updated\", " +
    "pro.ethnicity.updated_by_id AS \"updated_by_id\", " +
    "pro.ethnicity.source_institution AS \"source_institution\", " +
    "pro.ethnicity.source_application AS \"source_application\", " +
    "pro.ethnicity.source_function AS \"source_function\", " +
    "qu.date_time_created AS \"date_time_created\", " +
    "qu.created_by_id AS \"created_by_id\" " +
    "FROM " +
    "pro.ethnicity, " +
    "    ( " +
    "        SELECT " +
    "q.person_id, " +
    "    el.updated_by_id AS created_by_id, " +
    "    q.ethnicity_code, " +
    "    q.date_time_created " +
    "FROM " +
    "pro.ethnicity_log el, " +
    "    ( " +
    "        SELECT " +
    "pro.ethnicity_log.person_id AS person_id, " +
    "    pro.ethnicity_log.ethnicity_code AS ethnicity_code, " +
    "    MIN(pro.ethnicity_log.date_time_updated) AS date_time_created " +
    "FROM " +
    "pro.ethnicity_log " +
    "WHERE " +
    "pro.ethnicity_log.person_id =:person_id " +
    "GROUP BY " +
    "pro.ethnicity_log.person_id, " +
    "    pro.ethnicity_log.ethnicity_code " +
    ") q " +
    "WHERE " +
    "el.person_id = q.person_id " +
    "AND " +
    "el.ethnicity_code = q.ethnicity_code " +
    "AND " +
    "el.date_time_updated = q.date_time_created " +
    ") qu " +
    "WHERE " +
    "pro.ethnicity.person_id = qu.person_id (+) " +
    "AND " +
    "pro.ethnicity.ethnicity_code = qu.ethnicity_code (+) " +
    "AND " +
    "pro.ethnicity.person_id = :person_id",
    insertEthnicity: "insert into pro.ethnicity values ( " +
    ":person_id, " +
    ":ethnicity_code, " +
    ":primary_f, " +
    "to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    ":updated_by_id, " +
    ":source_institution, " +
    ":source_application, " +
    ":source_function)",
    updateEthnicity: "update pro.ethnicity set  " +
    "primary_f = :primary_f, " +
    "date_time_updated = to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "updated_by_id = :updated_by_id, " +
    "source_institution = :source_institution, " +
    "source_application = :source_application, " +
    "source_function = :source_function " +
    "where person_id = :person_id " +
    "and ethnicity_code = :ethnicity_code",
    deleteEthnicity: "delete from pro.ethnicity where person_id = :person_id and ethnicity_code = :ethnicity_code"
};

exports.id_card = {
    selectIdCard: "SELECT " +
    "pro.id_card.person_id AS \"person_id\", " +
    "pro.id_card.card_id AS \"card_id\", " +
    "pro.id_card.issue_number AS \"issue_number\", " +
    "pro.id_card.card_id_type AS \"card_id_type\", " +
    "pro.id_card.date_time_updated AS \"date_time_updated\", " +
    "pro.id_card.expiration_date AS \"expiration_date\", " +
    "pro.id_card.site_id AS \"site_id\", " +
    "pro.id_card.updated_by_id AS \"updated_by_id\", " +
    "pro.id_card.hold_flag AS \"hold_flag\", " +
    "pro.id_card.dtf_flag AS \"dtf_flag\", " +
    "pro.id_card.path_of_picture AS \"path_of_picture\", " +
    "pro.id_card.unlisted AS \"unlisted\", " +
    "pro.id_card.source_institution AS \"source_institution\", " +
    "pro.id_card.source_application AS \"source_application\", " +
    "pro.id_card.source_function AS \"source_function\", " +
    "pro.id_card.printed_name AS \"printed_name\", " +
    "pro.id_card.prox_id AS \"prox_id\", " +
    "pro.id_card.primary_role AS \"primary_role\", " +
    "pro.id_card.secondary_role AS \"secondary_role\", " +
    "pro.id_card.date_time_issued AS \"date_time_issued\", " +
    "pro.id_card.card_definition AS \"card_definition\", " +
    "pro.id_card.beard_flag AS \"beard_flag\", " +
    "pro.id_card_log.date_time_updated AS \"date_time_created\", " +
    "pro.id_card_log.updated_by_id AS \"created_by_id\" " +
    "FROM " +
    "pro.id_card " +
    "LEFT JOIN pro.id_card_log ON " +
    "pro.id_card.person_id = pro.id_card_log.person_id " +
    "AND " +
    "pro.id_card.updated_by_id != 'DELETE' " +
    "WHERE " +
    "pro.id_card.person_id =:person_id " +
    "AND " +
    "ROWNUM = 1 " +
    "ORDER BY \"date_time_created\"",
    insertIdCard: "insert into pro.id_card values ( " +
    ":person_id, " +
    ":card_id, " +
    ":issue_number, " +
    ":card_id_type, " +
    "to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "to_timestamp(:expiration_date, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    ":site_id, " +
    ":updated_by_id, " +
    ":hold_flag, " +
    ":dtf_flag, " +
    ":path_of_picture, " +
    ":unlisted, " +
    ":source_institution, " +
    ":source_application, " +
    ":source_function, " +
    ":printed_name, " +
    ":prox_id, " +
    ":primary_role, " +
    ":secondary_role, " +
    "to_timestamp(:date_time_issued, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    ":card_definition, " +
    ":beard_flag " +
    ")",
    updateIdCard: "update pro.id_card set " +
    "card_id = :card_id, " +
    "issue_number = :issue_number, " +
    "card_id_type = :card_id_type, " +
    "date_time_updated = to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "expiration_date = to_timestamp(:expiration_date, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "site_id = :site_id, " +
    "updated_by_id = :updated_by_id, " +
    "hold_flag = :hold_flag, " +
    "dtf_flag = :dtf_flag, " +
    "path_of_picture = :path_of_picture, " +
    "unlisted = :unlisted, " +
    "source_institution = :source_institution, " +
    "source_application = :source_application, " +
    "source_function = :source_function, " +
    "printed_name = :printed_name, " +
    "prox_id = :prox_id, " +
    "primary_role = :primary_role, " +
    "secondary_role = :secondary_role, " +
    "date_time_issued = to_timestamp(:date_time_issued, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "card_definition = :card_definition, " +
    "beard_flag = :beard_flag " +
    "where person_id = :person_id",
    deleteIdCard: "delete from pro.id_card where person_id = :person_id"
};

exports.language = {
    selectLanguage: "SELECT " +
    "pro.language.person_id AS \"person_id\", " +
    "pro.language.language_code AS \"language_code\", " +
    "pro.language.speak_proficiency AS \"speak_proficiency\", " +
    "pro.language.read_proficiency AS \"read_proficiency\", " +
    "pro.language.write_proficiency AS \"write_proficiency\", " +
    "pro.language.native AS \"native\", " +
    "pro.language.translator AS \"translator\", " +
    "pro.language.date_time_updated AS \"date_time_updated\", " +
    "pro.language.updated_by_id AS \"updated_by_id\", " +
    "pro.language.source_institution AS \"source_institution\", " +
    "pro.language.source_application AS \"source_application\", " +
    "pro.language.source_function AS \"source_function\", " +
    "pro.language_log.date_time_updated AS \"date_time_created\", " +
    "pro.language_log.updated_by_id AS \"created_by_id\" " +
    "FROM " +
    "pro.language " +
    "LEFT JOIN pro.language_log ON " +
    "pro.language.person_id = pro.language_log.person_id " +
    "AND " +
    "pro.language.language_code = pro.language_log.language_code " +
    "AND " +
    "pro.language.updated_by_id != 'DELETE' " +
    "WHERE " +
    "pro.language.person_id =:person_id " +
    "AND " +
    "pro.language.language_code =:language_code " +
    "AND " +
    "ROWNUM = 1 " +
    "ORDER BY \"date_time_created\"",
    selectLanguages: "SELECT " +
    "pro.language.person_id AS \"person_id\", " +
    "pro.language.language_code AS \"language_code\", " +
    "pro.language.speak_proficiency AS \"speak_proficiency\", " +
    "pro.language.read_proficiency AS \"read_proficiency\", " +
    "pro.language.write_proficiency AS \"write_proficiency\", " +
    "pro.language.native AS \"native\", " +
    "pro.language.translator AS \"translator\", " +
    "pro.language.date_time_updated AS \"date_time_updated\", " +
    "pro.language.updated_by_id AS \"updated_by_id\", " +
    "pro.language.source_institution AS \"source_institution\", " +
    "pro.language.source_application AS \"source_application\", " +
    "pro.language.source_function AS \"source_function\", " +
    "qu.date_time_created AS \"date_time_created\", " +
    "qu.created_by_id AS \"created_by_id\" " +
    "FROM " +
    "pro.language, " +
    "    ( " +
    "        SELECT " +
    "q.person_id, " +
    "    ll.updated_by_id AS created_by_id, " +
    "    q.language_code, " +
    "    q.date_time_created " +
    "FROM " +
    "pro.language_log ll, " +
    "    ( " +
    "        SELECT " +
    "pro.language_log.person_id AS person_id, " +
    "    pro.language_log.language_code AS language_code, " +
    "    MIN(pro.language_log.date_time_updated) AS date_time_created " +
    "FROM " +
    "pro.language_log " +
    "WHERE " +
    "pro.language_log.person_id =:person_id " +
    "GROUP BY " +
    "pro.language_log.person_id, " +
    "    pro.language_log.language_code " +
    ") q " +
    "WHERE " +
    "ll.person_id = q.person_id " +
    "AND " +
    "ll.language_code = q.language_code " +
    "AND " +
    "ll.date_time_updated = q.date_time_created " +
    ") qu " +
    "WHERE " +
    "pro.language.person_id = qu.person_id (+) " +
    "AND " +
    "pro.language.language_code = qu.language_code (+) " +
    "AND " +
    "pro.language.person_id = :person_id",
    insertLanguage: "insert into pro.language values ( " +
    ":person_id, " +
    ":language_code, " +
    ":speak_proficiency, " +
    ":read_proficiency, " +
    ":write_proficiency, " +
    ":native, " +
    ":translator, " +
    "to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    ":updated_by_id, " +
    ":source_institution, " +
    ":source_application, " +
    ":source_function)",
    updateLanguage: "update pro.language set " +
    "speak_proficiency = :speak_proficiency, " +
    "read_proficiency = :read_proficiency, " +
    "write_proficiency = :write_proficiency, " +
    "native = :native, " +
    "translator = :translator, " +
    "date_time_updated = to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "updated_by_id = :updated_by_id, " +
    "source_institution = :source_institution, " +
    "source_application = :source_application, " +
    "source_function = :source_function " +
    "where person_id = :person_id " +
    "and language_code = :language_code",
    deleteLanguage: "delete from pro.language where person_id = :person_id and language_code = :language_code"
};

exports.organization = {
    selectOrganization: "SELECT " +
    "pro.organization.person_id AS \"person_id\", " +
    "pro.organization.responsible_department AS \"responsible_department\", " +
    "pro.organization.organization_type AS \"organization_type\", " +
    "pro.organization.contact_person_id AS \"contact_person_id\", " +
    "pro.organization.date_time_updated AS \"date_time_updated\", " +
    "pro.organization.updated_by_id AS \"updated_by_id\", " +
    "pro.organization.operating_unit AS \"operating_unit\", " +
    "pro.organization.responsible_person_id AS \"responsible_person_id\", " +
    "pro.person_log.date_time_updated AS \"date_time_created\", " +
    "pro.person_log.updated_by_id AS \"created_by_id\" " +
    "FROM " +
    "pro.organization " +
    "LEFT JOIN pro.person_log ON pro.organization.person_id = pro.person_log.person_id AND pro.person_log.updated_by_id != 'DELETE' " +
    "WHERE " +
    "pro.organization.person_id = :person_id " +
    "AND ROWNUM = 1 " +
    "ORDER BY pro.person_log.date_time_updated",
    insertOrganization: "insert into pro.organization values ( " +
    ":person_id, " +
    ":responsible_department, " +
    ":organization_type, " +
    ":contact_person_id, " +
    "to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    ":updated_by_id, " +
    ":operating_unit, " +
    ":responsible_person_id)",
    updateOrganization: "update pro.organization set " +
    "responsible_department = :responsible_department, " +
    "organization_type = :organization_type, " +
    "contact_person_id = :contact_person_id, " +
    "date_time_updated = to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "updated_by_id = :updated_by_id, " +
    "operating_unit = :operating_unit, " +
    "responsible_person_id = :responsible_person_id " +
    "where person_id = :person_id",
    deleteOrganization: "delete from pro.organization where person_id  = :person_id"
};

exports.person = {
    selectPerson: "SELECT " +
    "pro.person.person_id AS \"person_id\", " +
    "pro.person.date_time_updated AS \"date_time_updated\", " +
    "pro.person.updated_by_id AS \"updated_by_id\", " +
    "pro.person.prefix AS \"prefix\", " +
    "pro.person.surname AS \"surname\", " +
    "pro.person.rest_of_name AS \"rest_of_name\", " +
    "pro.person.SUFFIX AS \"suffix\", " +
    "pro.person.surname_position AS \"surname_position\", " +
    "pro.person.preferred_first_name AS \"preferred_first_name\", " +
    "pro.person.sort_name AS \"sort_name\", " +
    "pro.person.date_of_birth AS \"date_of_birth\", " +
    "pro.person.deceased AS \"deceased\", " +
    "pro.person.date_of_death AS \"date_of_death\", " +
    "pro.person.gender AS \"gender\", " +
    "pro.person.marital_status AS \"marital_status\", " +
    "pro.person.religion_code AS \"religion_code\", " +
    "pro.person.ward_lds_unit_code AS \"ward_lds_unit_code\", " +
    "pro.person.citizenship_country_code AS \"citizenship_country_code\", " +
    "pro.person.birth_country_code AS \"birth_country_code\", " +
    "pro.person.home_town AS \"home_town\", " +
    "pro.person.home_state_code AS \"home_state_code\", " +
    "pro.person.home_country_code AS \"home_country_code\", " +
    "pro.person.high_school_code AS \"high_school_code\", " +
    "pro.person.RESTRICTED AS \"restricted\", " +
    "pro.person.byu_id AS \"byu_id\", " +
    "pro.person.net_id AS \"net_id\", " +
    "pro.person.ssn AS \"ssn\", " +
    "pro.person.ssn_verification_date AS \"ssn_verification_date\", " +
    "pro.person.primary_password_expiration AS \"primary_password_expiration\", " +
    "pro.person.restricted_expiration_date AS \"restricted_expiration_date\", " +
    "pro.person.secondary_password AS \"secondary_password\", " +
    "pro.person.secret_question AS \"secret_question\", " +
    "pro.person.secret_answer AS \"secret_answer\", " +
    "pro.person.source_institution AS \"source_institution\", " +
    "pro.person.source_application AS \"source_application\", " +
    "pro.person.source_function AS \"source_function\", " +
    "pro.person.visa_type AS \"visa_type\", " +
    "pro.person.i20_expiration_date AS \"i20_expiration_date\", " +
    "pro.person.visa_type_source AS \"visa_type_source\", " +
    "pro.person.organization_f AS \"organization_f\", " +
    "pro.person.use_preferred_name_on_id_card AS \"use_preferred_name_on_id_card\", " +
    "pro.person.security_question_1 AS \"security_question_1\", " +
    "pro.person.security_question_2 AS \"security_question_2\", " +
    "pro.person.security_answer_1 AS \"security_answer_1\", " +
    "pro.person.security_answer_2 AS \"security_answer_2\", " +
    "pro.person.ssn_optout_date AS \"ssn_optout_date\", " +
    "pro.person.first_name AS \"first_name\", " +
    "pro.person.middle_name AS \"middle_name\", " +
    "pro.person_log.date_time_updated AS \"date_time_created\", " +
    "pro.person_log.updated_by_id AS \"created_by_id\" " +
    "FROM " +
    "pro.person " +
    "LEFT JOIN pro.person_log ON pro.person.person_id = pro.person_log.person_id AND pro.person_log.updated_by_id != 'DELETE' " +
    "WHERE " +
    "pro.person.person_id =:person_id " +
    "AND ROWNUM = 1 " +
    "ORDER BY pro.person_log.date_time_updated",
    insertPerson: "insert into pro.person values ( " +
    ":person_id, " +
    "to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    ":updated_by_id, " +
    ":prefix, " +
    ":surname, " +
    ":rest_of_name, " +
    ":suffix, " +
    ":surname_position, " +
    ":preferred_first_name, " +
    ":sort_name, " +
    "to_timestamp(:date_of_birth, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    ":deceased, " +
    "to_timestamp(:date_of_death, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    ":gender, " +
    ":marital_status, " +
    ":religion_code, " +
    ":ward_lds_unit_code, " +
    ":citizenship_country_code, " +
    ":birth_country_code, " +
    ":home_town, " +
    ":home_state_code, " +
    ":home_country_code, " +
    ":high_school_code, " +
    ":restricted, " +
    ":byu_id, " +
    ":net_id, " +
    ":ssn, " +
    "to_timestamp(:ssn_verification_date, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "to_timestamp(:primary_password_expiration, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "to_timestamp(:restricted_expiration_date, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    ":secondary_password, " +
    ":secret_question, " +
    ":secret_answer, " +
    ":source_institution, " +
    ":source_application, " +
    ":source_function, " +
    ":visa_type, " +
    "to_timestamp(:i20_expiration_date, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    ":visa_type_source, " +
    ":organization_f, " +
    ":use_preferred_name_on_id_card, " +
    ":security_question_1, " +
    ":security_question_2, " +
    ":security_answer_1, " +
    ":security_answer_2, " +
    "to_timestamp(:ssn_optout_date, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    ":first_name, " +
    ":middle_name)",
    updatePerson: "update pro.person set " +
    "date_time_updated = to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "updated_by_id = :updated_by_id, " +
    "prefix = :prefix, " +
    "surname = :surname, " +
    "rest_of_name = :rest_of_name, " +
    "suffix = :suffix, " +
    "surname_position = :surname_position, " +
    "preferred_first_name = :preferred_first_name, " +
    "sort_name = :sort_name, " +
    "date_of_birth = to_timestamp(:date_of_birth, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "deceased = :deceased, " +
    "date_of_death = to_timestamp(:date_of_death, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "gender = :gender, " +
    "marital_status = :marital_status, " +
    "religion_code = :religion_code, " +
    "ward_lds_unit_code = :ward_lds_unit_code, " +
    "citizenship_country_code = :citizenship_country_code, " +
    "birth_country_code = :birth_country_code, " +
    "home_town = :home_town, " +
    "home_state_code = :home_state_code, " +
    "home_country_code = :home_country_code, " +
    "high_school_code = :high_school_code, " +
    "restricted = :restricted, " +
    "byu_id = :byu_id, " +
    "net_id = :net_id, " +
    "ssn = :ssn, " +
    "ssn_verification_date = to_timestamp(:ssn_verification_date, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "primary_password_expiration = to_timestamp(:primary_password_expiration, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "restricted_expiration_date = to_timestamp(:restricted_expiration_date, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "secondary_password = :secondary_password, " +
    "secret_question = :secret_question, " +
    "secret_answer = :secret_answer, " +
    "source_institution = :source_institution, " +
    "source_application = :source_application, " +
    "source_function = :source_function, " +
    "visa_type = :visa_type, " +
    "i20_expiration_date = to_timestamp(:i20_expiration_date, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "visa_type_source = :visa_type_source, " +
    "organization_f = :organization_f, " +
    "use_preferred_name_on_id_card = :use_preferred_name_on_id_card, " +
    "security_question_1 = :security_question_1, " +
    "security_question_2 = :security_question_2, " +
    "security_answer_1 = :security_answer_1, " +
    "security_answer_2 = :security_answer_2, " +
    "ssn_optout_date = to_timestamp(:ssn_optout_date, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "first_name = :first_name, " +
    "middle_name = :middle_name " +
    "where person_id = :person_id",
    deletePerson: "delete from pro.person where person_id = :person_id"
};

exports.phone = {
    selectPhone: "SELECT " +
    "s1.person_id AS \"person_id\", " +
    "s1.phone_type AS \"phone_type\", " +
    "s1.phone_number AS \"phone_number\", " +
    "s1.type_of_device AS \"type_of_device\", " +
    "s1.country_code AS \"country_code\", " +
    "s1.mobile AS \"mobile\", " +
    "s1.contact_status AS \"contact_status\", " +
    "s1.unlisted AS \"unlisted\", " +
    "s1.date_time_updated AS \"date_time_updated\", " +
    "s1.updated_by_id AS \"updated_by_id\", " +
    "s1.contact_person AS \"contact_person\", " +
    "s1.primary_f AS \"primary_f\", " +
    "s1.tty AS \"tty\", " +
    "s1.source_institution AS \"source_institution\", " +
    "s1.source_application AS \"source_application\", " +
    "s1.source_function AS \"source_function\", " +
    "s1.\"date_time_created\" AS \"date_time_created\", " +
    "s1.\"created_by_id\" AS \"created_by_id\" " +
    "FROM " +
    "( " +
    "    SELECT " +
    "pro.phone.person_id, " +
    "    pro.phone.phone_type, " +
    "    pro.phone.phone_number, " +
    "    pro.phone.type_of_device, " +
    "    pro.phone.country_code, " +
    "    pro.phone.mobile, " +
    "    pro.phone.contact_status, " +
    "    pro.phone.unlisted, " +
    "    pro.phone.date_time_updated, " +
    "    pro.phone.updated_by_id, " +
    "    pro.phone.contact_person, " +
    "    pro.phone.primary_f, " +
    "    pro.phone.tty, " +
    "    pro.phone.source_institution, " +
    "    pro.phone.source_application, " +
    "    pro.phone.source_function, " +
    "    pro.phone_log.date_time_updated AS \"date_time_created\", " +
    "pro.phone_log.updated_by_id AS \"created_by_id\" " +
    "FROM " +
    "pro.phone " +
    "LEFT JOIN pro.phone_log ON " +
    "pro.phone.person_id = pro.phone_log.person_id " +
    "AND " +
    "pro.phone.phone_number = pro.phone_log.phone_number " +
    "AND " +
    "pro.phone.type_of_device = pro.phone_log.type_of_device " +
    "AND " +
    "pro.phone.phone_type = pro.phone_log.phone_type " +
    "AND " +
    "pro.phone_log.updated_by_id != 'DELETE' " +
    "WHERE " +
    "pro.phone.person_id =:person_id " +
    "AND " +
    "pro.phone.phone_type =:phone_type " +
    "AND " +
    "pro.phone.phone_number =:phone_number " +
    ") s1 " +
    "INNER JOIN ( " +
    "    SELECT " +
    "person_id AS \"person_id\", " +
    "phone_type AS \"phone_type\", " +
    "phone_number AS \"phone_number\", " +
    "type_of_device AS \"type_of_device\", " +
    "MIN(\"date_time_created\") AS \"date_time_created\" " +
    "FROM " +
    "( " +
    "    SELECT " +
    "pro.phone.person_id, " +
    "    pro.phone.phone_type, " +
    "    pro.phone.phone_number, " +
    "    pro.phone.type_of_device, " +
    "    pro.phone_log.date_time_updated AS \"date_time_created\", " +
    "pro.phone_log.updated_by_id AS \"created_by_id\" " +
    "FROM " +
    "pro.phone " +
    "LEFT JOIN pro.phone_log ON " +
    "pro.phone.person_id = pro.phone_log.person_id " +
    "AND " +
    "pro.phone.phone_number = pro.phone_log.phone_number " +
    "AND " +
    "pro.phone.type_of_device = pro.phone_log.type_of_device " +
    "AND " +
    "pro.phone.phone_type = pro.phone_log.phone_type " +
    "AND " +
    "pro.phone_log.updated_by_id != 'DELETE' " +
    "WHERE " +
    "pro.phone.person_id =:person_id " +
    "AND " +
    "pro.phone.phone_type =:phone_type " +
    "AND " +
    "pro.phone.phone_number =:phone_number " +
    "AND " +
    "pro.phone.type_of_device =:type_of_device " +
    ") " +
    "GROUP BY " +
    "person_id, " +
    "    phone_type, " +
    "    phone_number, " +
    "    type_of_device " +
    ") s2 ON " +
    "s1.person_id = s2.\"person_id\" " +
    "AND " +
    "s1.phone_type = s2.\"phone_type\" " +
    "AND " +
    "s1.phone_number = s2.\"phone_number\" " +
    "AND " +
    "s1.type_of_device = s2.\"type_of_device\" " +
    "AND " +
    "s1.\"date_time_created\" = s2.\"date_time_created\"",
    selectPhones: "SELECT " +
    "pro.phone.person_id AS \"person_id\", " +
    "pro.phone.phone_type AS \"phone_type\", " +
    "pro.phone.phone_number AS \"phone_number\", " +
    "pro.phone.type_of_device AS \"type_of_device\", " +
    "pro.phone.country_code AS \"country_code\", " +
    "pro.phone.mobile AS \"mobile\", " +
    "pro.phone.contact_status AS \"contact_status\", " +
    "pro.phone.unlisted AS \"unlisted\", " +
    "pro.phone.date_time_updated AS \"date_time_updated\", " +
    "pro.phone.updated_by_id AS \"updated_by_id\", " +
    "pro.phone.contact_person AS \"contact_person\", " +
    "pro.phone.primary_f AS \"primary_f\", " +
    "pro.phone.tty AS \"tty\", " +
    "pro.phone.source_institution AS \"source_institution\", " +
    "pro.phone.source_application AS \"source_application\", " +
    "pro.phone.source_function AS \"source_function\", " +
    "qu.date_time_created AS \"date_time_created\", " +
    "qu.created_by_id AS \"created_by_id\" " +
    "FROM " +
    "pro.phone, " +
    "    ( " +
    "        SELECT " +
    "q.person_id, " +
    "    pl.updated_by_id AS created_by_id, " +
    "    q.phone_type, " +
    "    q.phone_number, " +
    "    q.type_of_device, " +
    "    q.date_time_created " +
    "FROM " +
    "pro.phone_log pl, " +
    "    ( " +
    "        SELECT " +
    "pro.phone_log.person_id AS person_id, " +
    "    pro.phone_log.phone_type AS phone_type, " +
    "    pro.phone_log.phone_number AS phone_number, " +
    "    pro.phone_log.type_of_device AS type_of_device, " +
    "    MIN(pro.phone_log.date_time_updated) AS date_time_created " +
    "FROM " +
    "pro.phone_log " +
    "WHERE " +
    "pro.phone_log.person_id =:person_id " +
    "GROUP BY " +
    "pro.phone_log.person_id, " +
    "    pro.phone_log.phone_type, " +
    "    pro.phone_log.phone_number, " +
    "    pro.phone_log.type_of_device " +
    ") q " +
    "WHERE " +
    "pl.person_id = q.person_id " +
    "AND " +
    "pl.phone_type = q.phone_type " +
    "AND " +
    "pl.phone_number = q.phone_number " +
    "AND " +
    "pl.type_of_device = q.type_of_device " +
    "AND " +
    "pl.date_time_updated = q.date_time_created " +
    ") qu " +
    "WHERE " +
    "pro.phone.person_id = qu.person_id (+) " +
    "AND " +
    "pro.phone.phone_type = qu.phone_type (+) " +
    "AND " +
    "pro.phone.phone_number = qu.phone_number (+) " +
    "AND " +
    "pro.phone.type_of_device = qu.type_of_device (+) " +
    "AND " +
    "pro.phone.person_id = :person_id",
    insertPhone: "insert into pro.phone values ( " +
    ":person_id, " +
    ":phone_type, " +
    ":phone_number, " +
    ":type_of_device, " +
    ":country_code, " +
    ":mobile, " +
    ":contact_status, " +
    ":unlisted, " +
    "to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    ":updated_by_id, " +
    ":contact_person, " +
    ":primary_f, " +
    ":tty, " +
    ":source_institution, " +
    ":source_application, " +
    ":source_function)",
    updatePhone: "update pro.phone set " +
    "country_code = :country_code, " +
    "mobile = :mobile, " +
    "contact_status = :contact_status, " +
    "unlisted = :unlisted, " +
    "date_time_updated = to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "updated_by_id = :updated_by_id, " +
    "contact_person = :contact_person, " +
    "primary_f = :primary_f, " +
    "tty = :tty, " +
    "source_institution = :source_institution, " +
    "source_application = :source_application, " +
    "source_function = :source_function " +
    "where person_id = :person_id " +
    "and phone_type = :phone_type " +
    "and phone_number = :phone_number " +
    "and type_of_device = :type_of_device",
    deletePhone: "delete from pro.phone where person_id = :person_id " +
    "and phone_type = :phone_type " +
    "and phone_number = :phone_number " +
    "and type_of_device = :type_of_device"
};

exports.relationship = {
    selectRelationship: "SELECT " +
    "pro.relationship.person_id AS \"person_id\", " +
    "pro.relationship.date_time_updated AS \"date_time_updated\", " +
    "pro.relationship.updated_by_id AS \"updated_by_id\", " +
    "pro.relationship.rel_person_id AS \"rel_person_id\", " +
    "pro.relationship.rel_type AS \"rel_type\", " +
    "pro.relationship.verified_by_id AS \"verified_by_id\", " +
    "pro.relationship.date_time_verified AS \"date_time_verified\", " +
    "pro.relationship.source_institution AS \"source_institution\", " +
    "pro.relationship.source_application AS \"source_application\", " +
    "pro.relationship.source_function AS \"source_function\", " +
    "pro.relationship_log.date_time_updated AS \"date_time_created\", " +
    "pro.relationship_log.updated_by_id AS \"created_by_id\" " +
    "FROM " +
    "pro.relationship " +
    "LEFT JOIN pro.relationship_log ON " +
    "pro.relationship.person_id = pro.relationship_log.person_id " +
    "AND " +
    "pro.relationship.rel_person_id = pro.relationship_log.rel_person_id " +
    "AND " +
    "pro.relationship_log.updated_by_id != 'DELETE' " +
    "WHERE " +
    "pro.relationship.person_id =:person_id " +
    "AND " +
    "pro.relationship.rel_person_id =:rel_person_id " +
    "AND " +
    "ROWNUM = 1 " +
    "ORDER BY \"date_time_created\"",
    selectRelationships: "SELECT " +
    "pro.relationship.person_id AS \"person_id\", " +
    "pro.relationship.date_time_updated AS \"date_time_updated\", " +
    "pro.relationship.updated_by_id AS \"updated_by_id\", " +
    "pro.relationship.rel_person_id AS \"rel_person_id\", " +
    "pro.relationship.rel_type AS \"rel_type\", " +
    "pro.relationship.verified_by_id AS \"verified_by_id\", " +
    "pro.relationship.date_time_verified AS \"date_time_verified\", " +
    "pro.relationship.source_institution AS \"source_institution\", " +
    "pro.relationship.source_application AS \"source_application\", " +
    "pro.relationship.source_function AS \"source_function\", " +
    "qu.date_time_created AS \"date_time_created\", " +
    "qu.created_by_id AS \"created_by_id\" " +
    "FROM " +
    "pro.relationship, " +
    "    ( " +
    "        SELECT " +
    "q.person_id, " +
    "    rl.updated_by_id AS created_by_id, " +
    "    q.rel_person_id, " +
    "    q.date_time_created " +
    "FROM " +
    "pro.relationship_log rl, " +
    "    ( " +
    "        SELECT " +
    "pro.relationship_log.person_id AS person_id, " +
    "    pro.relationship_log.rel_person_id AS rel_person_id, " +
    "    MIN(pro.relationship_log.date_time_updated) AS date_time_created " +
    "FROM " +
    "pro.relationship_log " +
    "WHERE " +
    "pro.relationship_log.person_id =:person_id " +
    "GROUP BY " +
    "pro.relationship_log.person_id, " +
    "    pro.relationship_log.rel_person_id " +
    ") q " +
    "WHERE " +
    "rl.person_id = q.person_id " +
    "AND " +
    "rl.rel_person_id = q.rel_person_id " +
    "AND " +
    "rl.date_time_updated = q.date_time_created " +
    ") qu " +
    "WHERE " +
    "pro.relationship.person_id = qu.person_id (+) " +
    "AND " +
    "pro.relationship.rel_person_id = qu.rel_person_id (+) " +
    "AND " +
    "pro.relationship.person_id =:person_id",
    insertRelationship: "insert into pro.relationship values ( " +
    ":person_id, " +
    "to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    ":updated_by_id, " +
    ":rel_person_id, " +
    ":rel_type, " +
    ":verified_by_id, " +
    "to_timestamp(:date_time_verified, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    ":source_institution, " +
    ":source_application, " +
    ":source_function)",
    updateRelationship: "update pro.relationship set " +
    "date_time_updated = to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "updated_by_id = :updated_by_id, " +
    "rel_type = :rel_type, " +
    "verified_by_id = :verified_by_id, " +
    "date_time_verified = to_timestamp(:date_time_verified, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "source_institution = :source_institution, " +
    "source_application = :source_application, " +
    "source_function = :source_function " +
    "where person_id = :person_id " +
    "and rel_person_id = :rel_person_id",
    deleteRelationship: "delete from pro.relationship where person_id = :person_id and rel_person_id = :rel_person_id"
};

exports.service_operation = {
    selectServiceOperation: "select " +
    "operation as \"operation\", " +
    "category as \"category\", " +
    "display_order as \"display_order\", " +
    "description as \"description\", " +
    "url as \"url\", " +
    "web_resource_id as \"web_resource_id\", " +
    "active as \"active\", " +
    "date_time_created as \"date_time_created\", " +
    "date_time_updated as \"date_time_updated\", " +
    "updated_by_id as \"updated_by_id\" " +
    "from DELEGATION.service_operation " +
    "where operation = :operation " +
    "and display_order = :display_order",
    insertServiceOperation: "insert into DELEGATION.service_operation values ( " +
    ":operation, " +
    ":category, " +
    ":display_order, " +
    ":description, " +
    ":url, " +
    ":web_resource_id, " +
    ":active, " +
    "to_timestamp(:date_time_created, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    ":updated_by_id)",
    updateServiceOperation: "update DELEGATION.SERVICE_OPERATION set " +
    "category = :category, " +
    "description = :description, " +
    "url = :url, " +
    "web_resource_id = :web_resource_id, " +
    "active = :active, " +
    "date_time_created = to_timestamp(:date_time_created, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "date_time_updated = to_timestamp(:date_time_updated, 'YYYY-MM-DD HH24:MI:SS.FF'), " +
    "updated_by_id = :updated_by_id " +
    "where operation = :operation " +
    "and display_order = :display_order"
};

