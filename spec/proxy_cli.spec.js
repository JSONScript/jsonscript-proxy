'use strict';

var startService = require('./service')
  , proxyConfig = require('./proxy_config.json')
  , request = require('request')
  , assert = require('assert')
  , spawn = require('child_process').spawn;

describe('jsonscript proxy cli', function() {
  var proxy;

  before(function (done) {
    proxy = spawnProxy(['proxy_config.json']);
    startService('service1', 3003);
    startService('service2', 3004);
    setTimeout(done, 1000);
  });

  after(function (done) {
    proxy.on('exit', done);
    proxy.kill();
  });

  describe('parallel evaluation', function() {
    it('should process script via proxy', function (done) {
      testProxy(3000, '/js', done);
    });
  });

  describe('port option', function() {
    it('should support -p option', function (done) {
      var proxy = spawnProxy(['-p', '3010',  'proxy_config.json']);
      testNewProxy(proxy, 3010, '/js', done);
    });

    it('should support --port option', function (done) {
      var proxy = spawnProxy(['--port', '3020',  'proxy_config.json']);
      testNewProxy(proxy, 3020, '/js', done);
    });
  });

  describe('api option', function() {
    it('should support -a option', function (done) {
      var proxy = spawnProxy(['-a', '/jsonscript', '-p', '3030', 'proxy_config.json']);
      testNewProxy(proxy, 3030, '/jsonscript', done);
    });

    it('should support --api option', function (done) {
      var proxy = spawnProxy(['--api', '/jsonscript', '-p', '3040', 'proxy_config.json']);
      testNewProxy(proxy, 3040, '/jsonscript', done);
    });
  });
});


function spawnProxy(params) {
  return spawn('../bin/jsproxy.js', params, { cwd: __dirname });
}


function testProxy(port, api, callback) {
  send(port, api, {
    script: {
      obj1: { '$$service1.get': { path: '/object/1' } },
      obj2: { '$$service2.get': { path: '/object/2' } }
    }
  }, function (err, resp, body) {
    assert(!err, err && err.message);
    assert.equal(resp.statusCode, 200);
    assertGetResult(body.obj1, 'service1', 'object', '1');
    assertGetResult(body.obj2, 'service2', 'object', '2');
    callback();
  });
}


function testNewProxy(proxy, port, api, callback) {
  setTimeout(function() {
    testProxy(port, api, function() {
      proxy.on('exit', callback);
      proxy.kill();
    });
  }, 1000);
}


function send(port, api, reqBody, callback) {
  request.post({
    uri: 'http://localhost:' + port + api,
    headers: { Accept: 'application/json' },
    json: reqBody
  }, callback);
}


function assertGetResult(result, serviceName, name, id) {
  assert.equal(result.statusCode, 200);
  assert.equal(typeof result.headers, 'object');
  assert.deepEqual(result.service, { name: serviceName, basePath: proxyConfig.services[serviceName].basePath });
  assert.deepEqual(result.request, { method: 'get', path: '/' + name + '/' + id })
  assert.deepEqual(result.body, {
    name: name,
    id: id,
    service: serviceName,
    info: 'resource ' + name + ' id ' + id
  });
}
