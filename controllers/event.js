/**
 * Created by johnrb2 on 3/28/17.
 */
const utils = require('./utils');


//NOTE: Event Hub needs the following wrapper for the event
/*************************************************************
 * You should have this in your main code to push multiple
 *  events into:
 *
 * let event_frame = {
 *      "events": {
 *          "event": []
 *       }
 * }
 ************************************************************/

//This is a function used to build events for event hub
exports.Builder = function (header_params, body_params, filter_params, historical_headers) {
  let length = 0;
  let event = {};

  //Uses an array to build the header
  /***************************************************************
   * Example of array to be passed in:
   *
   * let header_params = [
   *      "domain",               //property
   *      "edu.byu",              //property value
   *      "entity",               //next property value combination
   *      "BYU-IAM",
   *      "event_type",
   *      "Address Added",
   *      "source_dt",            //date-time the event is created by the API
   *      "YYYY-MM-DD HH:mm:ss.SSS",
   *
   *      //Below vaules are optional and supplied by Event Hub
   *
   *      "event_dt",             //date-time the event is raise on Event Hub
   *      "YYYY-MM-DD HH:mm:ss.SSS",
   *      "event_id",             //ID of the Event
   *      "cea9a774-dfe8-4dfd-8a2a-bb2edc984407",
   *      "dispatch_id",
   *      "ceb8a732-efe9-3acb-b8a2-8b2e3498b407"
   *  ]
   *
   *****************************************************************/
  if ((header_params.length > 7) && ((header_params.length % 2) === 0)) {
    let event_header = {};

    //Use -1 because the loop accesses array index +1
    //NOTE: Declaring the length before hand reduces computing time
    length = header_params.length - 1;
    for (let i = 0; i < length; i += 2) {
      event_header[header_params[i]] = header_params[i + 1] //event_header["domain"] = "edu.byu"
    }
    //add event_header to event
    event.event_header = event_header
  }
  else {
    throw utils.Error(500, "Header array length must have at least 8 items and be even")
  }

  //(OPTIONAL) Array length must be a multiple of two if you do
  //              decide to use filters.
  //Used to further sort which events a user may care about.
  /***************************************************************
   * Example of array to be passed in:
   *
   * let filter_params = [
   *      "identity_type",               //filter_name
   *      "PERSON",                      //filter_value
   *      "employee_type",               //next name value combination
   *      "ADM-FT-ACT",
   *      "student_status",
   *      "Senior"
   *  ]
   *
   *****************************************************************/
  if (filter_params && ((filter_params.length % 2) === 0)) {
    let event_filters = {
      "filter": []
    };


    //Use -1 because the loop accesses array index +1
    //NOTE: Declaring the length before hand reduces computing time
    length = filter_params.length - 1;
    for (let i = 0; i < length; i += 2) {
      let filter = {};
      filter.filter_name = filter_params[i]; // "identity_type"
      filter.filter_value = filter_params[i + 1]; // "PERSON"

      event_filters.filter.push(filter)
    }
    //adds event_filters to event as filters
    event.filters = event_filters
  }

  //Array length must be a multiple of two
  /***************************************************************
   * Example of array to be passed in:
   *
   * let header_params = [
   *     "person_id",     //property
   *     "123456789",     //property value
   *     "byu_id",        //next property value combination
   *     "987654321",
   *     "net_id",
   *     "ddaisy",
   *     "created_by_id",
   *     "123456789",
   *     "date_time_created",
   *     "YYYY-MM-DD HH:mm:ss.SSS",
   *     "updated_by_id",
   *     "123456789",
   *     "date_time_updated",
   *     "YYYY-MM-DD HH:mm:ss.SSS",
   *     "secure_url",
   *     "https://secure.byu.edu/123124"
   *  ]
   *
   *****************************************************************/
  if (body_params && ((body_params.length % 2) === 0)) {
    let event_body = {};

    //Use -1 because the loop accesses array index +1
    //NOTE: Declaring the length before hand reduces computing time
    length = body_params.length - 1;
    for (let i = 0; i < length; i += 2) {
      event_body[body_params[i]] = body_params[i + 1] //event_body["person_id"] = "123456789"
    }
    event.event_body = event_body
  }
  else {
    throw utils.Error(500, "Event body is invalid: Must exist and have two or more values")
  }

  //(OPTIONAL) Assigns an array of previous event header objects to event history.
  //This is used when making changes to resources or sub-resources
  //  because of a previously raised event.
  /*************************************************************
   * Example of array to be passed in:
   *
   * let historical_headers = [
   *      {
     *          "event_header": {
     *              "domain": "edu.byu",
     *              "entity": "PRO",
     *              "event_type": "Address Added",
     *              "source_dt": "",
     *              "event_dt": "2014-05-11T13:46:01.43Z",
     *              "event_id": "cea9a774-dfe8-4dfd-8a2a-bb2edc984407",
     *              "dispatch_id": "ceb8a732-efe9-3acb-b8a2-8b2e3498b407"
     *          }
     *      },
   *      {
     *          "event_header": {
     *              "domain": "edu.byu",
     *              "entity": "AIM",
     *              "event_type": "Address Added",
     *              "source_dt": "",
     *              "event_dt": "2014-05-11T13:46:01.43Z",
     *              "event_id": "cea9a774-dfe8-4dfd-8a2a-bb2edc984407",
     *              "dispatch_id": "ceb8a732-efe9-3acb-b8a2-8b2e3498b407"
     *          }
     *      },
   *  ]
   *
   ************************************************************/
  if (historical_headers) {
    event.history = historical_headers
  }

  return event
};


