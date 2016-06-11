'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var _ = require('lodash');


module.exports = function startService(serviceName, port) {
  var app = express();

  app.use(bodyParser.json());

  app.get('/api/:name/:id', function (req, res) {
    send(res, req.params.name, req.params.id);
  });

  app.post('/api/:name', function (req, res) {
    var id = Date.now();
    send(res, req.params.name, id, req.body);
  });

  app.get('/api/:name/:id/error', function (req, res) {
    send(res.status(500), req.params.name, req.params.id);
  });


  function send(res, name, id, data) {
    res.send({
      name: name,
      id: id,
      service: serviceName,
      info: 'resource ' + name + ' id ' + id,
      data: data
    });
  }

  app.listen(port);

  return app;
};
