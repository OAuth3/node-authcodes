'use strict';

/*global Promise*/
var PromiseA = Promise;
try {
  PromiseA = require('bluebird').Promise;
} catch (e) {
  // ignore
}

function init(Codes) {
  var code;
  var tests;
  var testsCheckId;
  var count = 0;

  function setup(opts) {
    return Codes.create(opts).then(function (_code) {
      code = _code;
      return code;
    });
  }

  function teardown() {
    var _code = code
      ;

    code = null;

    return Codes.destroy(_code);
  }

  // Test that success is successful
  tests = [
    function () {
      // test setup / teardown
      return PromiseA.resolve();
    }
  , function (code) {
      return Codes.validate(code.uuid, code.code, { skipCheckId: true }).then(function (correct) {
        if (!correct || !correct.uuid) {
          console.error(correct);
          throw new Error('expected code.toJSON() to be the success result');
        }

        return Codes.validate(code.uuid, code.code, { skipCheckId: true }).then(function () {
          throw new Error('expected the code to have been deleted');
        }, function (err) {
          if (!/not exist/.test(err.message)) {
            console.error(err);
            throw new Error('Got the wrong error');
          }
        });
      });
    }
  , function (code) {
      return Codes.validate(code.uuid, 'not-the-right-code', { skipCheckId: true }).then(function () {
        throw new Error("should have had an error");
      }, function (err) {
        if (!/incorrect/.test(err.message)) {
          console.error(err);
          throw new Error('should have had error about incorrect code');
        }

        return Codes.validate(code.uuid, 'not-the-right-code', { skipCheckId: true }).then(function () {
          throw new Error("should have had an error");
        }, function (err) {
          if (!/you must wait/.test(err.message)) {
            console.error(err);
            throw new Error('should have had error about waiting longer between attempts');
          }
        });
      });
    }
  , function () {
      return Codes.validate('not-the-right-id', 'not-the-right-code', { skipCheckId: true }).then(function () {
        throw new Error("expected this to not work");
      }, function (err) {
        if (!/not exist/.test(err.message)) {
          console.error(err);
          throw new Error('Got the wrong error');
        }
      });
    }
  // TODO test that the database is empty
  ];

  testsCheckId = [
    function (code) {
      return Codes.validate(code.uuid, code.code, { checkId: 'foo', skipSpeedCheck: true }).then(function () {
        throw new Error('Should have had checkId error');
      }, function (err) {
        if (!/wrong account/.test(err.message)) {
          console.error(err);
          throw new Error('Got the wrong error');
        }
      }).then(function () {
        return Codes.validate(code.uuid, code.code, { checkId: 'abc123', skipSpeedCheck: true });
      });
    }
  ];

  function phase1() {
    var promise = PromiseA.resolve();

    tests.forEach(function (fn) {
      promise = promise.then(function () {
        return setup().then(fn).then(teardown).then(function () {
          count += 1;
        }, function (err) {
          console.error('[ERROR] failure');
          console.error(err);
          console.error(fn.toString());
          return teardown();
        });
      });
    });

    return promise;
  }

  function phase2() {
    var promise = PromiseA.resolve();

    testsCheckId.forEach(function (fn) {
      promise = promise.then(function () {
        return setup({ checkId: 'abc123' }).then(fn).then(teardown).then(function () {
          count += 1;
        }, function (err) {
          console.error('[ERROR] failure');
          console.error(err);
          console.error(fn.toString());
          return teardown();
        });
      });
    });

    return promise;
  }

  phase1().then(phase2).then(function () {
    console.info('%d of %d tests complete', count, tests.length + testsCheckId.length);
    process.exit();
  });
}

module.exports.create = function () {

  require('./setup').run({ tablename: 'codes' }).then(function (DB) {
    return init(require('../lib/authcodes').create(DB));
  });
};

module.exports.create();
