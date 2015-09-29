'use strict';

var AWS = require('aws-sdk');
var auto = require('run-auto');
var fs = require('fs');
var Set = require('set');
var getChanged = require('./lib/changed');

module.exports = function (opts, cb) {
  var s3 = new AWS.S3(opts.aws);
  auto({
    missing: ['listLocalSet', 'listS3Set', function (done, results) {
      var intersect = results.listLocalSet.intersect(results.listS3Set);
      done(null, results.listS3Set.difference(intersect).get());
    }],
    extra: ['listLocalSet', 'listS3Set', function (done, results) {
      var intersect = results.listLocalSet.intersect(results.listS3Set);
      done(null, results.listLocalSet.difference(intersect).get());
    }],
    changed: ['listLocal', 'listS3', function (done, results) {
      getChanged(
        results.listS3,
        opts.local,
        results.listLocal,
        done
      );
    }],
    listLocal: listLocal(opts),
    listLocalSet: ['listLocal', function (done, results) {
      done(null, new Set(results.listLocal));
    }],
    listS3: listS3(s3, opts),
    listS3Set: ['listS3', function (done, results) {
      done(null, new Set(results.listS3.map(function (obj) {
        return obj.key;
      }).filter(Boolean)));
    }]
  }, function (err, results) {
    cb(err, results && formatResults(results));
  });
};

function formatResults (results) {
  return {
    missing: results.missing,
    extra: results.extra,
    changed: results.changed
  };
}

function listLocal (opts) {
  return function (cb) {
    fs.readdir(opts.local, function (err, files) {
      if (err && err.code === 'ENOENT') {
        err = null;
        files = [];
      }
      cb(err, files);
    });
  };
}

function listS3 (s3, opts) {
  return function (cb) {
    var params = {
      Bucket: opts.remote.bucket,
      Prefix: opts.remote.prefix
    };

    s3.listObjects(params, function (err, data) {
      cb(err, data.Contents && formatDataContents(opts.remote.prefix, data.Contents));
    });
  };
}

function formatDataContents (prefix, contents) {
  return contents.map(function (obj) {
    return {
      key: obj.Key.slice(prefix.length + 1),
      etag: obj.Etag
    };
  });
}
