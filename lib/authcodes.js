'use strict';

//var UUID = require('node-uuid');
var PromiseA = require('bluebird').Promise;
var crypto = require('crypto');
var hri;

module.exports.create = function (CodesDb) {
  // TODO periodically remove expired codes
  // TODO ensure checkId uniqueness (one email address can't have several concurrent authcode attempts)
  // TODO ban by host identifier (ip address)
  // TODO change key length based on duration

  function Codes() {
  }

  Codes.create = function (opts) {
    opts = opts || {};
    var now = Date.now();
    var duration = opts.duration || 20 * 60 * 1000;

    function lookupId(id) {
      // TODO search for check_id
      return CodesDb.get(id).then(function (code) {
        if (!code) {
          return null;
        }

        var expiresAt = new Date(code.expiresAt).valueOf();

        console.error('AuthCode issues');
        console.error('now', now);
        console.error('expiresAt', expiresAt);
        if (!expiresAt || now > expiresAt) {
          return CodesDb.destroy(code.uuid).then(function () {
            return null;
          });
        }

        return code;
      });
    }

    function doStuff(code) {
      if (code) {
        return PromiseA.reject(new Error("there is an outstanding reset. please check your email and or sms"));
      }

      //var uuid = UUID.v4();
      var token;

      if (opts.hri) {
        if (!hri) {
          hri = require('human-readable-ids').hri;
          token = hri.random();
        }
      } else {
        token = (parseInt(crypto.randomBytes(8).toString('hex'), 16) / 10000000
                ).toFixed(8).replace(/.*\.(\d{3})(\d{3}).*/, '$1-$2');
        //Math.random().toString().substr(2).replace(/(\d{3})(\d{3}).*/, "$1-$2")
      }

      code = {}; // CodesDb.create();

      //code.uuid = uuid;
      // TODO check against hash of code instead of code itself?
      code.code = token;
      if (opts.checkId) {
        code.checkId = opts.checkId;
      }
      code.expiresAt = new Date(now + duration);

      return CodesDb.save(code).then(function () {
        return code;
      });
    }

    if (opts.checkId) {
      return lookupId(opts.checkId).then(doStuff);
    }

    return doStuff();
  };

  Codes.destroy = function (uuid, code/*, opts*/) {
    return CodesDb.destroy(code || uuid);
  };

  Codes.save = function (code/*, opts*/) {
    return CodesDb.save(code);
  };

  /*
  Codes.upsert = function (id, code) { // id, code, opts
    return CodesDb.upsert(code);
  };
  */

  Codes.validate = function (uuid, token, opts) {
    if (!uuid) {
      return PromiseA.reject(new Error("You didn't even provide an authcode uuid"));
    }
    if (!token) {
      return PromiseA.reject(new Error("You didn't even provide an authcode code"));
    }

    opts = opts || {};
    return CodesDb.get(uuid).then(function (code) {
      var json;

      function fail(err, opts) {
        opts = opts || {};

        if (!code) {
          // TODO log IP address
          return PromiseA.reject(err);
        }

        if (opts.destroy) {
          return CodesDb.destroy(code).then(function () {
            return PromiseA.reject(err);
          });
        }

        attempts.unshift(new Date());
        code.attempts = attempts;
        return CodesDb.save(code).then(function () {
          return PromiseA.reject(err);
        }, function (err) {
          console.error('[ERROR] authcodes fail()');
          console.error(err);
        });
      }

      if (!code) {
        return fail({ message: "the token has expired or does not exist" });
      }

      var now = Date.now();
      var attempts = code.attempts || [];
      var expiresAt = new Date(code.expiresAt);
      var lastAttempt = new Date(attempts[0]);
      var msPerAttempt = 1 * 1000;
      var maxAttempts = 3;

      if (now > expiresAt.valueOf()) {
        return fail({ message: "this token has expired" }, { destroy: true });
      }

      if (!opts.skipSpeedCheck && (now - lastAttempt < msPerAttempt)) {
        return fail({ message: "you must wait 1 second between auth code attempts" });
      }

      if (attempts.length > maxAttempts) {
        // don't destroy the token until it has expired
        return fail({ message: "you have tried to authorize this code too many times" });
      }

      if (token !== code.code) {
        return fail({ message: "you have entered the code incorrectly. "
          + (maxAttempts - (attempts.length + 1) + " attempts remaining")
        }/*, { destroy: 0 === (maxAttempts - (attempts.length + 1)) }*/);
      }

      if (!opts.skipCheckId && opts.checkId !== code.checkId) {
        return fail({ message: "you have tried to authorize this code against the wrong account" });
      }

      json = code; // .toJSON
      if (false === opts.destroyOnceUsed) {
        return json;
      }
      return CodesDb.destroy(code).then(function () {
        return json;
      });
    });
  };

  return Codes;
};
