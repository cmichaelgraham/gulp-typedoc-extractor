'use strict';
var gutil = require('gulp-util');
var path = require('path');
var nconf = require('nconf');
var File = require('vinyl');
var Transform = require('readable-stream/transform');

module.exports = function(moduleName) {
  return new Transform({
    objectMode: true,
    transform: function(file, enc, callback) {
      if (file.isNull()) {
        return callback(null, file);
      }
      else if ( file.isStream() ) {
        this.emit('error', new gutil.PluginError('gulp-typedoc-extractor', 'Streaming not supported.'));
        return callback();
      }

      try {
        var contents = file.contents.toString("utf-8");
        var obj = JSON.parse(contents);
        var outObj = obj.children[0].children[0];
        file.contents = new Buffer(JSON.stringify(outObj));
        return callback(null, file);

      } catch (e) {
        this.emit('error', new gutil.PluginError('gulp-typedoc-extractor', 'Error:'));
        callback(e);
      }
  }
});
};
