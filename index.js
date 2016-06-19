'use strict';

var JSONScript = require('jsonscript-js')
  , request = require('request')
  , Ajv = require('ajv')
  , defineKeywords = require('ajv-keywords')
  , _ = require('lodash')
  , optionsSchema = require('./config_schema.json')
  , validateOptions = getValidator();

module.exports = jsonscriptProxy;


var METHODS = ['get', 'post', 'put', 'delete'];
function jsonscriptProxy(options, js) {
  if (!validateOptions(options)) {
    console.log('Invalid options:\n', validateOptions.errors);
    throw new Error('Invalid options');
  }

  js = js || new JSONScript(options.jsonscript || { strict: true });
  for (var name in options.services)
    js.addExecutor(name, getExecutor(name, options.services[name]));
  evaluator.js = js;

  return evaluator;


  function evaluator(req, res) {
    var script = req.body.script;
    var data = req.body.data;
    var valid = js.validate(script);
    if (valid) {
      js.evaluate(script, data)
      .then(function (value) {
        res.json(value);
      }, function (err) {
        res.status(err.errors ? 400 : err.statusCode || 500)
        .send({
          error: err.message,
          errors: err.errors
        });
      });
    } else {
      res.status(400)
      .send({
        error: 'script is invalid',
        errors: js.validate.errors
      });
    }
  }


  function getExecutor(serviceName, service) {
    var processResponse = processResponseFunc(service.processResponse || options.processResponse);
    addExecutorMethods();
    var serviceInfo = {
      name: serviceName,
      basePath: service.basePath
    };
    return execRouter;

    function execRouter(args) {
      var opts = {
        uri: service.basePath + args.path,
        headers: args.headers,
        json: args.body || true
      };

      return new (options.Promise || Promise)(function (resolve, reject) {
        request[args.method](opts, function (err, resp) {
          if (err) return reject(err);
          try { resolve(processResponse(resp, args, serviceInfo)); }
          catch(e) { reject(e); }
        });
      });
    }

    function addExecutorMethods() {
      METHODS.forEach(function (method) {
        execRouter[method] = function(args) {
          if (args.method && args.method != method) {
            console.warn('method specified in args (' + args.method +
                          ') is different from $method in instruction (' + method + '), used ' + method);
          }
          args.method = method;
          return execRouter(args);
        };
      });
    }
  }
}


function getValidator() {
  var ajv = Ajv({ allErrors: true });
  defineKeywords(ajv, 'typeof');
  return ajv.compile(optionsSchema);
}


function processResponseFunc(processResponse) {
  return processResponse == 'body'
          ? bodyProcessResponse
          : typeof processResponse == 'function'
            ? processResponse
            : defaultProcessResponse;
}


function bodyProcessResponse(resp) {
  if (resp.statusCode < 300) return resp.body;
  throw new HttpError(resp);
}


function defaultProcessResponse(resp, args, service) {
  resp = _.pick(resp, 'statusCode', 'headers', 'body');
  resp.service = service;
  resp.request = args;
  return resp;
}


function HttpError(resp) {
  this.message = resp.body ? JSON.stringify(resp.body) : 'Error';
  this.statusCode = resp.statusCode;
}

HttpError.prototype = Object.create(Error.prototype);
HttpError.prototype.constructor = HttpError;
