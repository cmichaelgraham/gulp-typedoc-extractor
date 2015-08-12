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
        var itemIndex = createIndex(obj);
        // gutil.log('\n\nindex created:\n\n' + JSON.stringify(itemIndex, null, 2));

        var outObj = obj.children[0].children[0];
        addExternalReferences(outObj, itemIndex);
        file.contents = new Buffer(JSON.stringify(outObj, null, 2));
        return callback(null, file);

      } catch (e) {
        this.emit('error', new gutil.PluginError('gulp-typedoc-extractor', 'Error:'));
        callback(e);
      }
    }
  });

  function createIndex(obj) {
    var moduleIndex = { "modules": [], "items": [] };
    
    // for modules
    for (var moduleKey in obj.children) {
      var module = obj.children[moduleKey].children[0];
      moduleIndex.modules.push({
        'moduleName': module.name
      });

      // for classes, variables, and functions
      for (var moduleChildKey in module.children) {
        var moduleChild = module.children[moduleChildKey];
        moduleIndex.items[moduleChild.id] = moduleKey;

        // for functions
        if (moduleChild.kindString === 'Function') {
          for (var signatureKey in moduleChild.signatures) {
            var signature = moduleChild.signatures[signatureKey];
            moduleIndex.items[signature.id] = moduleKey;

            // for parameters
            for (var parameterKey in signature.parameters) {
                var parameter = signature.parameters[parameterKey];
                moduleIndex.items[parameter.id] = moduleKey;
            }
          }
        }

        // for classes
        if (moduleChild.kindString === 'Class') {
          for (var classChildKey in moduleChild.children) {
            var classChild = moduleChild.children[classChildKey];
            moduleIndex.items[classChild.id] = moduleKey;

            // methods and constructors
            if (classChild.kindString === 'Constructor' || classChild.kindString === 'Method') {
              for (signatureKey in classChild.signatures) {
                var signature = classChild.signatures[signatureKey];
                moduleIndex.items[signature.id] = moduleKey;

                // for parameters
                for (var parameterKey in signature.parameters) {
                  var parameter = signature.parameters[parameterKey];
                  moduleIndex.items[parameter.id] = moduleKey;
                }
              }
            }
          }
        }
      }
    }

    return moduleIndex;
  }

  function addExternalReferences(module, moduleIndex) {
    // for classes, variables, and functions
    for (var moduleChildKey in module.children) {
      var moduleChild = module.children[moduleChildKey];

      // for variables
      if (moduleChild.kindString === 'Variable') {
        if (moduleChild.type && moduleChild.type.id && moduleChild.type.type === 'reference') {
          moduleChild.type.moduleName = moduleIndex.modules[moduleIndex.items[moduleChild.type.id]].moduleName;
        }          
      }

      // for functions
      if (moduleChild.kindString === 'Function') {
        for (var signatureKey in moduleChild.signatures) {
          var signature = moduleChild.signatures[signatureKey];
          if (signature.type && signature.type.id && signature.type.type === 'reference') {
            signature.type.moduleName = moduleIndex.modules[moduleIndex.items[signature.type.id]].moduleName;
          }

          // for parameters
          for (var parameterKey in signature.parameters) {
              var parameter = signature.parameters[parameterKey];
              if (parameter.type && parameter.type.id && parameter.type.type === 'reference') {
                parameter.type.moduleName = moduleIndex.modules[moduleIndex.items[parameter.type.id]].moduleName;
              }
          }
        }
      }

      // for classes
      if (moduleChild.kindString === 'Class') {
        for (var classChildKey in moduleChild.children) {
          var classChild = moduleChild.children[classChildKey];

          // properties
          if (classChild.kindString === 'Property') {
            if (classChild.type && classChild.type.id && classChild.type.type && classChild.type.type === 'reference') {
              classChild.type.moduleName = moduleIndex.modules[moduleIndex.items[classChild.type.id]].moduleName;
            }
          }

          // methods and constructors
          if (classChild.kindString === 'Constructor' || classChild.kindString === 'Method') {
            for (signatureKey in classChild.signatures) {
              var signature = classChild.signatures[signatureKey];
              if (signature.type && signature.type.id && signature.type.type === 'reference') {
                signature.type.moduleName = moduleIndex.modules[moduleIndex.items[signature.type.id]].moduleName;
              }

              // for parameters
              for (var parameterKey in signature.parameters) {
                var parameter = signature.parameters[parameterKey];
                if (parameter.type && parameter.type.id && parameter.type.type === 'reference') {
                  parameter.type.moduleName = moduleIndex.modules[moduleIndex.items[parameter.type.id]].moduleName;
                }
              }
            }
          }
        }
      }
    }
  };

  function addImportExports(outObj, exportsObj) {

  };

  function expandImportExports(obj, exportsObj) {

  };
};