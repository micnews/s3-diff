# s3-diff

Get the diffs between a local file and a s3-folder.

## Installation

```shell
npm install s3-diff --save
```

## Usage

```js
var s3diff = require('s3-diff');
s3diff({
  aws: {
    // aws-config
  },
  local: __dirname + '/my-folder-that-I-want-to-sync',
  remote: {
    bucket: 'name-of-s3-bucket',
    prefix: 'name/of/folder/to/sync/on/s3'
  },
  // If recursive flag is set to true, s3-diff will recursively diff child
  // folders as well as the top level folder.
  recursive: false
}, function (err, data) {
  // data is an object with the following properties:
  //  changed: Files that have been changed - files that exists in both s3 & locally but are out of sync
  //  extra: Files that exists locally but not in s3
  //  missing: Files that exists in s3 but not locally
  //  keep: Files that exists both in s3 & locally and that are equal
});
```
