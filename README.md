node-authcodes
=========

Create, Check, and Expire one-time-use authorization codes

Install & Usage
=======

```bash
npm install --save https://github.com/OAuth3/node-authcodes.git
```

**Setup**

```javascript
'use strict';

var storage = {
  get: function (uuid) { /* return Promise */ }
, destroy: function (uuid) { /* return Promise */ }
, save: function (obj) { if (obj.uuid) { /* update */ } else { /* create */ } }
};

var Codes = require('../lib/authcodes').create(storage)
```

**Create an Auth Code**

```javascript
//
// Create an Auth Code
//
Codes.create({
  checkId: 'john@example.com' // default is undefined
, hri: false                  // default is false
, duration: 20 * 60 * 1000    // default is 20 minutes
}).then(function (code) {

  console.log(code);

  // { uuid: 'xxxx...'
  // , token: '123-456'         // hri:true -> 'red-dragon-88'
  // , expiresAt: '2015-12-...' // ISO time string
  // }

});
```

**Validate an Auth code** (DOES NOT DESTROY by default)

```javascript
//
// Validate an Auth code
// DOES NOT DESTROY by default
//
Codes.validate('xxx...', '123-456', {
  checkId: 'john@example.com' // must match create, if defined
, destroyOnceUsed: false      // default false, useful if not soft-checking in browser
, skipCheckId: false          // may be set to true for testing
, skipSpeedCheck: false       // may be set to true for testing
}).then(function (code) {

  // code is valid, success
  console.log(code);

}, function (err) {

  // rate-limited, invalid code, or other error
  console.error(err.message);

});
```

**Destroy an auth code**

```javascript
//
// As if it never even happened
//
Codes.destroy(uuid).then(function () {

  // destroyed a used (or unused) code

});
```

Storage Options
=======

Master Quest
------------

* sqlite3 - masterquest-sqlite3
* postgresql - masterquest-pg

```javascript
'use strict';

var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('/tmp/authcodes.sqlite3');
var Mq = require('masterquest-sqlite3');

return Mq.wrap(db, [{ modelname: 'Codes', idname: 'uuid' }]).then(function (store) {
  var Codes = require('../lib/authcodes').create(store.Codes);
  return Codes;
});
```

Others
------

You may provide whichever storage engine you wish -
rethinkdb, mongodb, couchdb, postgresql, sqlite3, etc -
as long as it is wrapped to expose these methods:

* `get(uuid) // returns the object identified by the uuid (must not return deleted objects)`
* `destroy(uuid) // completely removes the object with the given uuid`
* `save(obj) // updates the object if the uuid property, or otherwise creates it and assigns a uuid`

LICENSE
=======

Dual-licensed MIT and Apache-2.0

See LICENSE
