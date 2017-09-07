"use strict";

exports.getMyGuests = {
    sql: ""
    + "SELECT "
    + "p.byu_id					AS \"byu_id\", "
    + "c1.credential_id			AS \"net_id\", "
    + "p.preferred_name			AS \"preferred_name\", "
    + "p.restricted				AS \"restricted\", "
    + "a.access_delegation_id		AS \"access_delegation_id\", "
    + "a.guest_byu_id				AS \"guest_id\", "
    + "c.credential_id				AS \"guest_net_id\", "
    + "p1.sort_name				AS \"guest_name_lnf\", "
    + "p1.rest_of_name "
    + "|| ' ' "
    + "|| p1.surname "
    + "|| ' ' "
    + "|| p1.suffix				AS \"guest_name_fnf\", "
    + "p1.preferred_name			AS \"guest_preferred_name\", "
    + "p1.surname					AS \"guest_surname\", "
    + "p1.rest_of_name				AS \"guest_rest_of_name\", "
    + "p1.preferred_surname		AS \"guest_preferred_surname\", "
    + "p1.preferred_first_name		AS \"guest_preferred_first_name\", "
    + "p1.restricted				AS \"guest_restricted\", "
    + "a.date_time_created			AS \"date_time_created\", "
    + "a.date_time_accepted		AS \"date_time_accepted\", "
    + "a.created_by_id				AS \"created_by_id\", "
    + "i.identity_name				AS \"created_by_name\", "
    + "a.date_time_revoked			AS \"date_time_revoked\", "
    + "a.revoked_by_id				AS \"revoked_by_id\", "
    + "ii.identity_name			AS \"revoked_by_name\", "
    + "a.expiration_date			AS \"expiration_date\", "
    + "a.date_time_updated			AS \"date_time_updated\", "
    + "a.updated_by_id				AS \"updated_by_id\", "
    + "iii.identity_name			AS \"updated_by_name\", "
    + "a.access_type				AS \"access_type\", "
    + "a.categories				AS \"categories\" "
    + "FROM "
    + "iam.person p "
    + "left JOIN iam.access_delegation a "
    + "ON p.byu_id = a.byu_id "
    + "LEFT JOIN iam.person p1 "
    + "ON a.guest_byu_id = p1.byu_id "
    + "LEFT JOIN iam.credential c "
    + "ON p1.byu_id = c.byu_id "
    + "AND "
    + "c.credential_type = 'NET_ID' "
    + "LEFT JOIN iam.credential c1 "
    + "ON p.byu_id = c1.byu_id "
    + "AND "
    + "c1.credential_type = 'NET_ID' "
    + "LEFT JOIN iam.identity i "
    + "ON a.created_by_id = i.byu_id "
    + "LEFT JOIN iam.identity ii "
    + "ON a.revoked_by_id = ii.byu_id "
    + "LEFT JOIN iam.identity iii "
    + "ON a.updated_by_id = iii.byu_id "
    + "WHERE "
    + "p.byu_id = :1",
    map: {
        byu_id: "byu_id.value",
        name: "byu_id.description",
        access_delegation_id: "access_delegation_id.value",
        guest_id: "guest_id.value",
        guest_net_id: "guest_net_id.value",
        guest_name_lnf: "guest_name_lnf.value",
        guest_preferred_name: "guest_preferred_name.value",
        guest_surname: "guest_surname.value",
        guest_rest_of_name: "guest_rest_of_name.value",
        guest_preferred_surname: "guest_preferred_first_name.value",
        guest_preferred_first_name: "guest_preferred_first_name.value",
        access_type: "access_type.value",
        categories: "categories.value",
        date_time_updated: "date_time_updated.value",
        updated_by_id: "updated_by_id.value",
        updated_by_name: "updated_by_id.description",
        date_time_created: "date_time_created.value",
        created_by_id: "created_by_id.value",
        created_by_name: "created_by_id.description",
        date_time_accepted: "date_time_accepted.value",
        date_time_revoked: "date_time_revoked.value",
        revoked_by_id: "revoked_by_id.value",
        revoked_by_name: "revoked_by_id.description",
        expiration_date: "expiration_date.value"
    }
};

exports.getMyGuest = {
    sql: ""
    + "SELECT "
    + "p.byu_id					AS \"byu_id\", "
    + "c1.credential_id			AS \"net_id\", "
    + "p.preferred_name			AS \"preferred_name\", "
    + "p.restricted				AS \"restricted\", "
    + "a.access_delegation_id		AS \"access_delegation_id\", "
    + "a.guest_byu_id				AS \"guest_id\", "
    + "c.credential_id				AS \"guest_net_id\", "
    + "p1.sort_name				AS \"guest_name_lnf\", "
    + "p1.rest_of_name "
    + "|| ' ' "
    + "|| p1.surname "
    + "|| ' ' "
    + "|| p1.suffix				AS \"guest_name_fnf\", "
    + "p1.preferred_name			AS \"guest_preferred_name\", "
    + "p1.surname					AS \"guest_surname\", "
    + "p1.rest_of_name				AS \"guest_rest_of_name\", "
    + "p1.preferred_surname		AS \"guest_preferred_surname\", "
    + "p1.preferred_first_name		AS \"guest_preferred_first_name\", "
    + "p1.restricted				AS \"guest_restricted\", "
    + "a.date_time_created			AS \"date_time_created\", "
    + "a.date_time_accepted		AS \"date_time_accepted\", "
    + "a.created_by_id				AS \"created_by_id\", "
    + "i.identity_name				AS \"created_by_name\", "
    + "a.date_time_revoked			AS \"date_time_revoked\", "
    + "a.revoked_by_id				AS \"revoked_by_id\", "
    + "ii.identity_name			AS \"revoked_by_name\", "
    + "a.expiration_date			AS \"expiration_date\", "
    + "a.date_time_updated			AS \"date_time_updated\", "
    + "a.updated_by_id				AS \"updated_by_id\", "
    + "iii.identity_name			AS \"updated_by_name\", "
    + "a.access_type				AS \"access_type\", "
    + "a.categories				AS \"categories\" "
    + "FROM "
    + "iam.person p "
    + "left JOIN iam.access_delegation a "
    + "ON p.byu_id = a.byu_id "
    + "LEFT JOIN iam.person p1 "
    + "ON a.guest_byu_id = p1.byu_id "
    + "LEFT JOIN iam.credential c "
    + "ON p1.byu_id = c.byu_id "
    + "AND "
    + "c.credential_type = 'NET_ID' "
    + "LEFT JOIN iam.credential c1 "
    + "ON p.byu_id = c1.byu_id "
    + "AND "
    + "c1.credential_type = 'NET_ID' "
    + "LEFT JOIN iam.identity i "
    + "ON a.created_by_id = i.byu_id "
    + "LEFT JOIN iam.identity ii "
    + "ON a.revoked_by_id = ii.byu_id "
    + "LEFT JOIN iam.identity iii "
    + "ON a.updated_by_id = iii.byu_id "
    + "WHERE "
    + "p.byu_id = :1 "
    + "       and a.access_delegation_id = :2",
    map: {
        byu_id: "byu_id.value",
        name: "byu_id.description",
        access_delegation_id: "access_delegation_id.value",
        guest_id: "guest_id.value",
        guest_net_id: "guest_net_id.value",
        guest_name_lnf: "guest_name_lnf.value",
        guest_preferred_name: "guest_preferred_name.value",
        guest_surname: "guest_surname.value",
        guest_rest_of_name: "guest_rest_of_name.value",
        guest_preferred_surname: "guest_preferred_first_name.value",
        guest_preferred_first_name: "guest_preferred_first_name.value",
        access_type: "access_type.value",
        categories: "categories.value",
        date_time_updated: "date_time_updated.value",
        updated_by_id: "updated_by_id.value",
        updated_by_name: "updated_by_id.description",
        date_time_created: "date_time_created.value",
        created_by_id: "created_by_id.value",
        created_by_name: "created_by_id.description",
        date_time_accepted: "date_time_accepted.value",
        date_time_revoked: "date_time_revoked.value",
        revoked_by_id: "revoked_by_id.value",
        revoked_by_name: "revoked_by_id.description",
        expiration_date: "expiration_date.value"
    }
};

exports.getDelegatedOperationsPerformed = {
    sql: ""
    + "select operation_performed_id as \"operation_performed_id\", "
    + "       operation              as \"operation\", "
    + "       web_resource_id        as \"web_resource_id\", "
    + "       session_id             as \"session_id\", "
    + "       date_time_started      as \"date_time_started\" "
    + "from   iam.delegated_operation_performed "
    + "where  access_delegation_id = :1",

    map: {
        operation_performed_id: "operation_performed_id.value",
        operation: "operation.value",
        web_resource_id: "web_resource_id.value",
        session_id: "session_id.value",
        date_time_started: "date_time_started.value"
    }
};

exports.modifyMyGuest = {
    checkIfExists: ""
    + "select count(*) as \"count\" "
    + "from   delegation.access_delegation "
    + "where  person_id = (select person_id "
    + "                    from   iam.person "
    + "                    where  byu_id = :1) "
    + "       and access_delegation_id = :2",
    checkIfExact: ""
    + "select count(*) as \"count\" "
    + "from   delegation.access_delegation a "
    + "where  byu_id = :1 "
    + "       and access_delegation_id = :2 "
    + "       and ( a.guest_byu_id = :3 "
    + "              or ( a.guest_byu_id is null "
    + "                   and :4 is null ) ) "
    + "       and ( a.access_type = :5 "
    + "              or ( a.access_type is null "
    + "                   and :6 is null ) ) "
    + "       and ( a.categories = :7 "
    + "              or ( a.categories is null "
    + "                   and :8 is null ) ) "
    + "       and ( a.date_time_accepted = :9 "
    + "              or ( a.date_time_accepted is null "
    + "                   and :10 is null ) ) "
    + "       and ( a.date_time_revoked = :11 "
    + "              or ( a.date_time_revoked is null "
    + "                   and :12 is null ) ) "
    + "       and ( a.revoked_by_id = :13 "
    + "              or ( a.revoked_by_id is null "
    + "                   and :14 is null ) ) "
    + "       and ( a.expiration_date = :15 "
    + "              or ( a.expiration_date is null "
    + "                   and :16 is null ) )",
    create: ""
    + "insert into delegation.access_delegation "
    + "            (person_id, "
    + "             access_delegation_id, "
    + "             delegated_person_id, "
    + "             access_type, "
    + "             categories, "
    + "             date_time_accepted, "
    + "             date_time_revoked, "
    + "             revoked_by_id, "
    + "             expiration_date, "
    + "             date_time_updated, "
    + "             updated_by_id, "
    + "             date_time_created, "
    + "             created_by_id) "
    + "values      ((select person_id "
    + "              from   iam.person "
    + "              where  byu_id = :1), "
    + "             access_delegation_id_seq.nextval, "
    + "             (select person_id "
    + "              from   iam.person "
    + "              where  byu_id = :2), "
    + "             :3, "
    + "             :4, "
    + "             null, "
    + "             null, "
    + "             null, "
    + "             to_timestamp(:5, 'YYYY-MM-DD HH24:MI:SS.FF'), "
    + "             systimestamp, "
    + "             (select person_id "
    + "              from   iam.person "
    + "              where  byu_id = :6), "
    + "             systimestamp, "
    + "             (select person_id "
    + "              from   iam.person "
    + "              where  byu_id = :7))",
    update: ""
    + "update delegation.access_delegation "
    + "set    delegated_person_id = (select person_id "
    + "                              from   iam.person "
    + "                              where  byu_id = :1), "
    + "       access_type = :2, "
    + "       categories = :3, "
    + "       expiration_date = to_timestamp(:4, 'YYYY-MM-DD HH24:MI:SS.FF'), "
    + "       date_time_updated = systimestamp, "
    + "       updated_by_id = (select person_id "
    + "                        from   iam.person "
    + "                        where  byu_id = :5) "
    + "where  person_id = (select person_id "
    + "                    from   iam.person "
    + "                    where  byu_id = :6) "
    + "       and access_delegation_id = :7",
    revoke: ""
    + "update delegation.access_delegation "
    + "set    delegated_person_id = (select person_id "
    + "                              from   iam.person "
    + "                              where  byu_id = :1), "
    + "       access_type = :2, "
    + "       categories = :3, "
    + "       date_time_revoked = systimestamp, "
    + "       revoked_by_id = (select person_id "
    + "                        from   iam.person "
    + "                        where  byu_id = :4), "
    + "       expiration_date = to_timestamp(:5, 'YYYY-MM-DD HH24:MI:SS.FF'), "
    + "       date_time_updated = systimestamp, "
    + "       updated_by_id = (select person_id "
    + "                        from   iam.person "
    + "                        where  byu_id = :6) "
    + "where  person_id = :7 "
    + "       and access_delegation_id = :8"
};

exports.enqueue = {
  sql: ""
  + "CALL iam.iam_enqueue_now(:1)"
};