function run(opts) {
  var config = require('../config.test.js');
  var sqlite3 = require('sqlite3-cluster');
  var wrap = require('dbwrap');

  var promise = sqlite3.create({
      standalone: true
    , bits: 128
    , filename: config.filename
    , verbose: false
  });

  return promise.then(function (db) {
    return db.init({ bits: 128, key: config.key });
  }).then(function (db) {
    return wrap.wrap(db, Array.isArray(opts) && opts || { idname: 'uuid', tablename: opts && opts.tablename || 'authn' });
  });

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
