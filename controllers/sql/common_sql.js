/*
 * Copyright 2017 Brigham Young University
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
"use strict";

exports.intermediaryId = {
  get:
`select events.intermediary.intermediary_id as "intermediary_id"
 from   events.intermediary
 where  events.intermediary.url = :URL`,
  put:
`insert into events.intermediary
 values  (events.intermediary_seq.nextval,
 :URL,
 :ACTOR,
 :GROUP_ID,
 sysdate,
 :CREATED_BY_ID)`
};

exports.eventPersonAddress = {
  raiseEvent:
`insert into iam.event
 (event_id,
 date_time_created,
 event_body)
 values      (iam.event_id_seq.nextval,
 systimestamp,
 :1)`
};

exports.enqueue = {
  sql:
`CALL iam.iam_enqueue_now(:1)`
};