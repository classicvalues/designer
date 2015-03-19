/**
 * @license
 * Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

var express = require('express');
var fs = require('fs');
var http = require('http');
var path = require('path');
var parseUrl = require('url').parse;
var send = require('send');

var bowerComponentDir = 'bower_components';
var app = express();

app.get('/', function (req, res) {
  send(req, path.join(__dirname, 'index.html')).pipe(res);
});

app.get('/components/*', function (req, res) {

    var url = parseUrl(req.url, true);

    // Serve designer2 files from the polymer-designer package
    // and other components from bower_components
    var splitPath = url.pathname.split(path.sep).slice(2);
    splitPath = splitPath[0] == 'polymer-designer'
       ? splitPath.slice(1)
       : [bowerComponentDir].concat(splitPath);
    var filePath = splitPath.join(path.sep);

    // The designer-stage frame has a null origin, so we need to
    // allow cross-origin requests for imports to work
    res.append('Access-Control-Allow-Origin', '*');

    if (filePath == 'elements/designer-stage/frame.js') {
      // dynamically build frame.js for edit-refresh goodness
      res.send(buildFrameScript());
    } else {
      send(req, filePath).pipe(res);
    }
  });

/**
 * Dynamically build the frame.js script so that we have edit-refresh
 * development.
 */
function buildFrameScript() {
  // files must be in dependency order
  var paths = [
    'bower_components/imd/imd.js',
    'src/dom-utils/dom-utils.js',
    'src/path/path.js',
    'src/css/css.js',
    'src/commands/commands.js',
    'src/commands/CommandApplier.js',
    'src/commands/DomCommandApplier.js',
    'src/protocol/Request.js',
    'src/async/async.js',
    'src/protocol/ServerConnection.js',
    'src/protocol/DocumentServer.js',
  ];
  var files = paths.map(function(p) {
    return fs.readFileSync(p, {encoding: 'utf-8'})
  });

  var frameScript = '(function() {\n' +
    files.join('\n') +
    'define(["polymer-designer/protocol/ServerConnection", "polymer-designer/protocol/DocumentServer"], function(ServerConnection, DocumentServer) {\n' +
    '  var connection = new ServerConnection(window);\n' +
    '  new DocumentServer(connection);\n' +
    '});\n' +
    '})();';
  return frameScript;
}

module.exports = app;