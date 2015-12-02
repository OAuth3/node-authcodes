function run(opts) {
  var Mq = require('masterquest-sqlite3');
  var sqlite3 = require('sqlite3');

  return Mq.wrap(new sqlite3.Database('/tmp/authcodes.sqlite3'), opts);

  /*
  var config = require('../config.test.js');
  var sqlite3 = require('sqlite3-cluster');
  var promise = sqlite3.create({
      standalone: true
    , bits: 128
    , filename: config.filename
    , verbose: false
  });

  return promise.then(function (db) {
    return db.init({ bits: 128, key: config.key });
  }).then(function (db) {
    return wrap.wrap(db, opts);
  });
  */

  /*
  if (require.main === module) {
    create({
      key: '1892d335081d8d346e556c9c3c8ff2c3'
    , bits: 128
    , filename: '/tmp/authn.sqlcipher'
    }).then(function (DB) {
    });
  }
  */
}

module.exports = run;
module.exports.run = run;
