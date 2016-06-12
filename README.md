# jsonscript-proxy

Proxy server for batch processing of other services using [JSONScript](https://github.com/JSONScript/jsonscript).

[![Build Status](https://travis-ci.org/JSONScript/jsonscript-proxy.svg?branch=master)](https://travis-ci.org/JSONScript/jsonscript-proxy)
[![npm version](https://badge.fury.io/js/jsonscript-proxy.svg)](https://www.npmjs.com/package/jsonscript-proxy)
[![Code Climate](https://codeclimate.com/github/JSONScript/jsonscript-proxy/badges/gpa.svg)](https://codeclimate.com/github/JSONScript/jsonscript-proxy)
[![Coverage Status](https://coveralls.io/repos/github/JSONScript/jsonscript-proxy/badge.svg?branch=master)](https://coveralls.io/github/JSONScript/jsonscript-proxy?branch=master)


## Install

To run proxy server from command line using configuration file:

```
npm install -g jsonscript-proxy
```

To add proxy to the existing express app

```
npm install jsonscript-proxy
```


## Using from command line

```
jsproxy config.json
```

The parameter passed to proxy cli is the name of the config file that should be valid according to the [config schema](https://github.com/JSONScript/jsonscript-proxy/blob/master/config_schema.json). See [sample config file](https://github.com/JSONScript/jsonscript-proxy/blob/master/config_sample.json).

Options:

- -p or --port: the port proxy will listen to, `3000` by default
- -a or --api: the path proxy will receive POST requests on, `/js` by default


## Using proxy as a middleware

Sample proxy:

```JavaScript
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var jsonscriptProxy = require('jsonscript-proxy');

// app needs body parser for JSON even if no endpoint uses it.
// it is needed for JSONScript middleware
app.use(bodyParser.json());

/**
 * The code below adds JSONScript proxy on the endpoint '/js'
 * that allows processing any scripts combining existing services
 */
app.post('/js', jsonscriptProxy({
  services: {
    service1: { basePath: 'http://localhost:3001' },
    service2: { basePath: 'http://localhost:3002' },
  }
}));

app.listen(3000);
```

Now you can send POST requests to `/js` endpoint with the body containing the script and an optional data instance that will be processed by JSONScript interpreter. For example, with this request:

```json
{
  "script": {
    "res1": { "$$service1.get": { "path": "/resource/1" } },
    "res2": { "$$service2.get": { "path": "/resource/2" } }
  }
}
```

the response will be a combination of two responses (both requests are processed in parallel):

```javascript
{
  "res1": {
    "statusCode": 200,
    "headers": { /* response headers for the 1st request */ },
    "request": { "method": "get", "path": "/resource/1" },
    "body": { /* response body 1 */ }
  },
  "res2": {
    "statusCode": 200,
    "headers": { /* response headers for the 2nd request */ },
    "request": { "method": "get", "path": "/resource/2" },
    "body": { /* response body 2 */ }
  }
}
```

If option `processResponse: "body"` were used the result would have been:

```javascript
{
  "res1": { /* response body 1 */ },
  "res2": { /* response body 2 */ }
}
```

Options passed to proxy middleware should be valid according to the [options schema](https://github.com/JSONScript/jsonscript-proxy/blob/master/config_schema.json).

JSONScript also supports sequential evaluation, conditionals, data manipulation, functions etc. So you can implement an advanced logic in your script and it will be executed in the server without sending responses of individual requests to the client.

See [JSONScript Language](https://github.com/JSONScript/jsonscript/blob/master/LANGUAGE.md) for more information.


## API

##### jsonscriptProxy(Object options [, Object js]) -&gt; Function

Create express route handling function to process JSONScript. The second optional parameter is the existing instance of JSONScript interpreter, if it is not passed a new one will be created.

Both the `script` and the `data` instance should be properties of the request body:

```javascript
{
  "script": {
    // JSONScript, can be an array
  },
  "data": {
    // data instance that can be used from the script,
    // can be array
  }
}
```


## Options

See [options schema](https://github.com/JSONScript/jsonscript-proxy/blob/master/config_schema.json).

Defaults:

```javascript
{
  services: {}, // must be specified and have at least one property
  processResponse: undefined,
  jsonscript: { strict: true },
  Promise: undefined
}
```

- _services_: the required map of service definitions that are exposed to JSONScript as executors. Each property name will be used as an executor map. See [Service definitions](#service-definitions).
- _processResponse_: the default response processing function, can be overridden for a particular service. The possible values:
  - `"body"` - return only response body if status code is < 300, throw an exception otherwise.
  - function - custom function to process the response object, can throw an exception or return the object to be used as the result.
- _jsonscript_: options passed to JSONScript interpreter [jsonscript-js](https://github.com/JSONScript/jsonscript-js).
- _Promise_: an optional Promise class, the native Promise is used by default.


#### Service definitions

`services` properties in options object should contain a map of services:

```javascript
{
  service1: {
    basePath: '...',
    processResponce: undefined
  },
  service2: {
    // ...
  },
  // ...
}
```

`basePath` will be prepended for the path in the call to the service, `processResponse`, if specified, will be used to process responses from the service.


## License

[MIT](https://github.com/JSONScript/jsonscript-proxy/blob/master/LICENSE)
