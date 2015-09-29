'use strict';

var AWS = require('aws-sdk');
var fs = require('fs');
var getChanged = require('./lib/changed');
var intersection = require('lodash.intersection');
var difference = require('lodash.difference');
var auto = require('run-auto');

module.exports = function (opts, cb) {
  var s3 = new AWS.S3(opts.aws);
  auto({
    localFiles: localFiles(opts),
    s3Files: s3Files(s3, opts),
    changed: ['localFiles', 's3Files', function (done, results) {
      getChanged(
        results.s3Files,
        opts.local,
        results.localFiles,
        done
      );
    } ]
  }, function (err, results) {
    cb(err, results && formatResults(results));
  });
};

function formatResults (results) {
  var s3Files = results.s3Files.map(function (obj) {
    return obj.key;
  });
  var localFiles = results.localFiles;
  var intersect = intersection(s3Files, localFiles);
  var missing = difference(s3Files, intersect);
  var extra = difference(localFiles, intersect);
  var keep = difference(intersect, results.changed);

  return {
    missing: missing,
    extra: extra,
    changed: results.changed,
    keep: keep
  };
}

function localFiles (opts) {
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

function s3Files (s3, opts) {
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
