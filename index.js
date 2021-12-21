const request = require('request-promise');
const Parse = require('parse/node');
const moment = require('moment');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const {
  EVENT_SESSIONS_REDATA_URL,
  EVENT_ID,
  PARSE_APP_ID,
  PARSE_SERVER_URL,
  PARSE_JS_KEY,
  PARSE_KEY,
} = process.env;

Parse.initialize(PARSE_APP_ID, PARSE_JS_KEY, PARSE_KEY);
Parse.serverURL = PARSE_SERVER_URL;

function updateEventSessionFromOcData(eventSession, json) {
  let res = false;
  res = eventSession.set('eventId', json.event);
  res = eventSession.set('sessionId', json.id);
  res = eventSession.set('title', json.title);
  if (json.begin) {
    const date = moment(json.begin, moment.ISO_8601);
    if (moment.isMoment(date) && date.isValid()) {
      res = eventSession.set('begin', date.toDate());
    } else {
      console.error('Invalid Date ->', json.begin, 'sessionid', json.id);
      res = eventSession.set('begin', null);
    }
  }
  if (json.end) {
    const date = moment(json.end, moment.ISO_8601);
    if (moment.isMoment(date) && date.isValid()) {
      res = eventSession.set('end', date.toDate());
    } else {
      console.error('Invalid Date ->', json.end, 'sessionid', json.id);
      res = eventSession.set('end', null);
    }
  }
  res = eventSession.set('day', json.day);
  res = eventSession.set('location', json.location);
  res = eventSession.set('cancelled', json.cancelled);
  return res;
}

class EventSession extends Parse.Object {
  constructor() {
    super('EventSession');
  }

  static fromJson(json) {
    const session = new EventSession();
    updateEventSessionFromOcData(session, json);
    return session;
  }
}

async function getSessions() {
  const options = {
    url: EVENT_SESSIONS_REDATA_URL,
    method: 'GET',
    json: true,
  };
  return request(options);
}

async function createUpdateSessions() {
  const sessions = await getSessions();
  const sessionsById = {};
  sessions.data.forEach((session) => {
    sessionsById[session.id] = session;
  });
  const sessionIds = Object.keys(sessionsById);

  const query = new Parse.Query(EventSession);
  query.equalTo('eventId', EVENT_ID);
  query.containedIn('sessionId', sessionIds);
  query.limit(10000);
  const existingSessions = await query.find({ useMasterKey: true });
  console.info('found', existingSessions.length, 'existing sessions');
  const objectsToUpdate = existingSessions.map((session) => {
    const ocsession = sessionsById[session.get('sessionId')];
    if (ocsession) {
      updateEventSessionFromOcData(session, ocsession);
    }
    return session;
  });

  const existingSessionIds = new Set(existingSessions.map(s => s.get('sessionId')));

  const sessionIdsToCreate = sessionIds.filter(id => !existingSessionIds.has(id));
  console.info('creating', sessionIdsToCreate.length, 'new sessions');
  const objectsToCreate = sessionIdsToCreate.map((sessionId) => {
    const session = sessionsById[sessionId];
    const eventSession = EventSession.fromJson(session);
    return eventSession;
  });

  const insertPromise = Parse.Object.saveAll(objectsToCreate, { useMasterKey: true });
  const updatePromise = Parse.Object.saveAll(objectsToUpdate, { useMasterKey: true });

  return Promise.all([insertPromise, updatePromise]);
}

createUpdateSessions()
  .then(res => console.info(`done updating parse data: ${res ? 'OK' : 'NONE'}`))
  .catch(err => console.error(err));
