'use strict';

var test = require('tape');
var checkChanged = require('../lib/changed');
var crypto = require('crypto');
var etag = '"' + crypto.createHash('md5').update('bar\n').digest('hex') + '"';

test('checkChanged', function (t) {
  var s3files = [{
    key: 'bas.txt',
    etag: ''
  }, {
    key: 'bar.txt',
    etag: etag
  }, {
    key: 'foo.txt',
    etag: 'changed'
  }];
  var dir = __dirname + '/files';
  var files = [ 'bar.txt', 'foo.txt' ];
  checkChanged(s3files, dir, files, function (err, changed) {
    t.deepEqual(changed, [ 'foo.txt' ]);
    t.end(err);
  });
});
