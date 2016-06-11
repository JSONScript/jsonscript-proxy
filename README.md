# jsonscript-proxy

Proxy server for batch processing of other services using [JSONScript](https://github.com/JSONScript/jsonscript).


## Install

To run proxy server using configuration file (not implemented yet):

```
npm install -g jsonscript-proxy
```

To add proxy to the existing express app

```
npm install jsonscript-proxy
```


## Getting started

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


## License

[MIT](https://github.com/JSONScript/jsonscript-proxy/blob/master/LICENSE)
