'use strict';

var auto = require('run-auto');
var fs = require('fs');
var crypto = require('crypto');
var path = require('path');
var intersection = require('lodash.intersection');

module.exports = function (s3files, dir, files, cb) {
  var common = getCommon(s3files, files);
  var changed = [];
  var tasks = common.map(function (obj) {
    return function (done) {
      getEtag(path.join(dir, obj.key), function (err, etag) {
        if (etag !== obj.etag) {
          changed.push(obj.key);
        }
        done(err);
      });
    };
  });
  auto(tasks, function (err) {
    cb(err, changed);
  });
};

function getCommon (s3files, files) {
  var s3map = s3files.reduce(function (map, obj) {
    map[obj.key] = obj;
    return map;
  }, {});

  return intersection(files, Object.keys(s3map)).map(function (key) {
    return s3map[key];
  });
}

function getEtag (filename, cb) {
  var hash = crypto.createHash('md5');
  hash.setEncoding('hex');
  var stream = fs.createReadStream(filename);
  stream.once('end', function () {
    hash.end();
    cb(null, '"' + hash.read() + '"');
  });
  stream.pipe(hash);
}
