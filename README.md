# ocdata-parse-glue

Fetches the schedule of a conference in [ocdata format](http://github.com/ocdata/re-data/blob/master/doc/api.md) and saves the essentials in [parse](https://parseplatform.org). This is done so the parse server can send out change pushes if xertain properties change (e.g. begin, etc.).

Should be run periodically after data update of the re-data server.

## Setup & Configuration

First do a `npm i` to install the dependencies

Create a `.env` file. Set the following properties.

- `EVENT_SESSIONS_REDATA_URL`: re-data sessions URL. E.g. `https://example.com/api/rp14/sessions`
- `EVENT_ID`: event id for re-data e.g. `rp14`
- `PARSE_APP_ID`: Parse app id `some-fancy-app`
- `PARSE_SERVER_URL`: Parse server URL `https://example.com/parse`
- `PARSE_JS_KEY`: JS key configured with the server
- `PARSE_KEY`: Master key configured with the server

Don't commit the `.env` file.
