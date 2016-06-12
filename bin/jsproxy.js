#!/usr/bin/env node

'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var jsonscriptProxy = require('..');
var _ = require('lodash');
var fs = require('fs');

var argv = require('minimist')(process.argv.slice(2));

var optionsFile = argv._[0];
if (!optionsFile) {
    console.error('Configuration file must be specified');
    process.exit(1);
}

var options = JSON.parse(fs.readFileSync(optionsFile));
var port = argv.p || argv.port || 3000;
var api = argv.a || argv.api || '/js';

var app = express();
app.use(bodyParser.json());
app.post(api, jsonscriptProxy(options));

app.listen(port);
console.log('JSONScript proxy listens on port', port);
