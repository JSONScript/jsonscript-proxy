'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var _ = require('lodash');


module.exports = function startService(serviceName, port) {
  var app = express();

  app.use(bodyParser.json());

  app.get('/api/:name/:id', function (req, res) {
    var id = req.params.id;
    send(res, req.params.name, id);
  });

  app.post('/api/:name', function (req, res) {
    var id = Date.now();
    send(res, req.params.name, id, req.body);
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
