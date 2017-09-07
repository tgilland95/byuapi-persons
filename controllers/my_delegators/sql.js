"use strict";

exports.sql = {
    getMyDelegators: ""
    + "select p.byu_id                as \"guest_byu_id\", "
    + "       p.preferred_name        as \"name\", "
    + "       p.restricted            as \"restricted\", "
    + "       a.access_delegation_id  as \"access_delegation_id\", "
    + "       a.byu_id                as \"delegator_id\", "
    + "       c.credential_id         as \"delegator_net_id\", "
    + "       p1.sort_name            as \"delegator_name_lnf\", "
    + "       p1.rest_of_name "
    + "       || ' ' "
    + "       || p1.surname "
    + "       || ' ' "
    + "       || p1.suffix            as \"delegator_name_fnf\", "
    + "       p1.preferred_name       as \"delegator_preferred_name\", "
    + "       p1.surname              as \"delegator_surname\", "
    + "       p1.rest_of_name         as \"delegator_rest_of_name\", "
    + "       p1.preferred_surname    as \"delegator_preferred_surname\", "
    + "       p1.preferred_first_name as \"delegator_preferred_first_name\", "
    + "       p1.restricted           as \"delegator_restricted\", "
    + "       a.access_type           as \"access_type\", "
    + "       a.categories            as \"categories\", "
    + "       a.date_time_updated     as \"date_time_updated\", "
    + "       a.updated_by_id         as \"updated_by_id\", "
    + "       i.identity_name         as \"updated_by_name\", "
    + "       a.date_time_created     as \"date_time_created\", "
    + "       a.created_by_id         as \"created_by_id\", "
    + "       ii.identity_name        as \"created_by_name\", "
    + "       a.date_time_accepted    as \"date_time_accepted\", "
    + "       a.date_time_revoked     as \"date_time_revoked\", "
    + "       a.revoked_by_id         as \"revoked_by_id\", "
    + "       iii.identity_name       as \"revoked_by_name\", "
    + "       a.expiration_date       as \"expiration_date\" "
    + "from   iam.person p "
    + "       left join iam.access_delegation a "
    + "              on p.byu_id = a.guest_byu_id "
    + "       left join iam.credential c "
    + "              on a.byu_id = c.byu_id "
    + "                 and c.credential_type = 'NET_ID' "
    + "       left join iam.person p1 "
    + "              on a.byu_id = p1.byu_id "
    + "       left join iam.identity i "
    + "              on a.updated_by_id = i.byu_id "
    + "       left join iam.identity ii "
    + "              on a.created_by_id = ii.byu_id "
    + "       left join iam.identity iii "
    + "              on a.revoked_by_id = iii.byu_id "
    + "where  p.byu_id = :BYU_ID",
    getMyDelegator: ""
    + "select p.byu_id                as \"guest_byu_id\", "
    + "       p.preferred_name        as \"name\", "
    + "       p.restricted            as \"restricted\", "
    + "       a.access_delegation_id  as \"access_delegation_id\", "
    + "       a.byu_id                as \"delegator_id\", "
    + "       c.credential_id         as \"delegator_net_id\", "
    + "       p1.sort_name            as \"delegator_name_lnf\", "
    + "       p1.rest_of_name "
    + "       || ' ' "
    + "       || p1.surname "
    + "       || ' ' "
    + "       || p1.suffix            as \"delegator_name_fnf\", "
    + "       p1.preferred_name       as \"delegator_preferred_name\", "
    + "       p1.surname              as \"delegator_surname\", "
    + "       p1.rest_of_name         as \"delegator_rest_of_name\", "
    + "       p1.preferred_surname    as \"delegator_preferred_surname\", "
    + "       p1.preferred_first_name as \"delegator_preferred_first_name\", "
    + "       p1.restricted           as \"delegator_restricted\", "
    + "       a.access_type           as \"access_type\", "
    + "       a.categories            as \"categories\", "
    + "       a.date_time_updated     as \"date_time_updated\", "
    + "       a.updated_by_id         as \"updated_by_id\", "
    + "       i.identity_name         as \"updated_by_name\", "
    + "       a.date_time_created     as \"date_time_created\", "
    + "       a.created_by_id         as \"created_by_id\", "
    + "       ii.identity_name        as \"created_by_name\", "
    + "       a.date_time_accepted    as \"date_time_accepted\", "
    + "       a.date_time_revoked     as \"date_time_revoked\", "
    + "       a.revoked_by_id         as \"revoked_by_id\", "
    + "       iii.identity_name       as \"revoked_by_name\", "
    + "       a.expiration_date       as \"expiration_date\" "
    + "from   iam.person p "
    + "       left join iam.access_delegation a "
    + "              on p.byu_id = a.guest_byu_id "
    + "                 and a.access_delegation_id = :ACCESS_DELEGATION_ID"
    + "       left join iam.credential c "
    + "              on a.byu_id = c.byu_id "
    + "                 and c.credential_type = 'NET_ID' "
    + "       left join iam.person p1 "
    + "              on a.byu_id = p1.byu_id "
    + "       left join iam.identity i "
    + "              on a.updated_by_id = i.byu_id "
    + "       left join iam.identity ii "
    + "              on a.created_by_id = ii.byu_id "
    + "       left join iam.identity iii "
    + "              on a.revoked_by_id = iii.byu_id "
    + "where  p.byu_id = :BYU_ID",
    map: {
        byu_id: "byu_id.value",
        name: "byu_id.description",
        access_delegation_id: "access_delegation_id.value",
        delegator_id: "delegator_id.value",
        delegator_net_id: "delegator_net_id.value",
        delegator_name_lnf: "delegator_name_lnf.value",
        delegator_name_fnf: "delegator_name_fnf.value",
        delegator_preferred_name: "delegator_preferred_name.value",
        delegator_surname: "delegator_surname.value",
        delegator_rest_of_name: "delegator_rest_of_name.value",
        delegator_preferred_surname: "delegator_preferred_surname.value",
        delegator_preferred_first_name: "delegator_preferred_first_name.value",
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
    + "where  access_delegation_id = :ACCESS_DELEGATION_ID",

    map: {
        operation_performed_id: "operation_performed_id.value",
        operation: "operation.value",
        web_resource_id: "web_resource_id.value",
        session_id: "session_id.value",
        date_time_started: "date_time_started.value"
    }
};

exports.modifyDelegation = {
    update_accept: ""
    + "update delegation.access_delegation "
    + "set    byu_id = :1, "
    + "       access_type = :2, "
    + "       categories = :3, "
    + "       date_time_accepted = systimestamp, "
    + "       date_time_updated = systimestamp, "
    + "       updated_by_id = :4 "
    + "where  guest_byu_id = :5 "
    + "       and access_delegation_id = :6",

    update_revoke: ""
    + "update delegation.access_delegation "
    + "set    byu_id = :1, "
    + "       access_type = :2, "
    + "       categories = :3, "
    + "       date_time_revoked = systimestamp, "
    + "       revoked_by_id = :4, "
    + "       date_time_updated = systimestamp, "
    + "       updated_by_id = :5 "
    + "where  guest_byu_id = :6 "
    + "       and access_delegation_id = :7"
};

exports.enqueue = {
  sql: ""
  + "CALL iam.iam_enqueue_now(:1)"
};