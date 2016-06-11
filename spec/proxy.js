'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var jsonscriptProxy = require('..');
var _ = require('lodash');


module.exports = function createProxy(options) {
  var app = express();
  app.use(bodyParser.json());
  app.post('/js', jsonscriptProxy(options));
  return app;
};
