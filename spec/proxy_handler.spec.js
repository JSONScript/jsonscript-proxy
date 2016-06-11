'use strict';

var test = require('supertest');
var createProxy = require('./proxy');
var startService = require('./service');
var assert = require('assert');

var SERVICES = {
  service1: {
    basePath: 'http://localhost:3001/api'
  },
  service2: {
    basePath: 'http://localhost:3002/api'
  }
};

describe('jsonscript proxy handler', function() {
  var proxy, service1, service2;

  before(function (done) {
    service1 = startService('service1', 3001);
    service2 = startService('service2', 3002);
    setTimeout(done, 1000);
  });

  beforeEach(function() {
    proxy = createProxy({ services: SERVICES });
  });


  describe('single instruction without $method', function() {
    it('should process GET', function (done) {
      send({
        script: {
          $exec: 'service1',
          $args: {
            method: 'get',
            path: '/object/1'
          }
        }
      }, function (err, resp) {
        assertGetResult(resp.body, 'service1', 'object', '1');
        done();
      });
    });

    it('should process GET with macro', function (done) {
      send({
        script: {
          $$service1: {
            method: 'get',
            path: '/object/1'
          }
        }
      }, function (err, resp) {
        assertGetResult(resp.body, 'service1', 'object', '1');
        done();
      });
    });

    it('should process POST', function (done) {
      send({
        script: {
          $exec: 'service1',
          $args: {
            method: 'post',
            path: '/object',
            body: { foo: 'bar' }
          }
        }
      }, function (err, resp) {
        assertPostResult(resp.body, 'service1', 'object', { foo: 'bar' });
        done();
      });
    });

    it('should process POST with macro', function (done) {
      send({
        script: {
          $$service1: {
            method: 'post',
            path: '/object',
            body: { foo: 'bar' }
          }
        }
      }, function (err, resp) {
        assertPostResult(resp.body, 'service1', 'object', { foo: 'bar' });
        done();
      });
    });
  });

  describe('single instruction with $method', function() {
    it('should process GET', function (done) {
      send({
        script: {
          $exec: 'service1',
          $method: 'get',
          $args: {
            path: '/object/1'
          }
        }
      }, function (err, resp) {
        assertGetResult(resp.body, 'service1', 'object', '1');
        done();
      });
    });

    it('should process GET with macro', function (done) {
      send({
        script: {
          '$$service1.get': { path: '/object/1' }
        }
      }, function (err, resp) {
        assertGetResult(resp.body, 'service1', 'object', '1');
        done();
      });
    });

    it('should process GET even if method in $args is different', function (done) {
      send({
        script: {
          $exec: 'service1',
          $method: 'get',
          $args: {
            method: 'post',
            path: '/object/1'
          }
        }
      }, function (err, resp) {
        assertGetResult(resp.body, 'service1', 'object', '1');
        done();
      });
    });

    it('should process POST', function (done) {
      send({
        script: {
          $exec: 'service1',
          $method: 'post',
          $args: {
            path: '/object',
            body: { foo: 'bar' }
          }
        }
      }, function (err, resp) {
        assertPostResult(resp.body, 'service1', 'object', { foo: 'bar' });
        done();
      });
    });

    it('should process POST with macro', function (done) {
      send({
        script: {
          '$$service1.post': {
            path: '/object',
            body: { foo: 'bar' }
          }
        }
      }, function (err, resp) {
        assertPostResult(resp.body, 'service1', 'object', { foo: 'bar' });
        done();
      });
    });
  });

  describe('parallel evaluation', function() {
    it('should process GETs', function (done) {
      send({
        script: {
          obj1: {
            $exec: 'service1',
            $method: 'get',
            $args: {
              path: '/object/1'
            }
          },
          obj2: {
            $exec: 'service2',
            $method: 'get',
            $args: {
              path: '/object/2'
            }
          }
        }
      }, function (err, resp) {
        assertGetResult(resp.body.obj1, 'service1', 'object', '1');
        assertGetResult(resp.body.obj2, 'service2', 'object', '2');
        done();
      });
    });

    it('should process GETs with macros', function (done) {
      send({
        script: {
          obj1: { '$$service1.get': { path: '/object/1' } },
          obj2: { '$$service2.get': { path: '/object/2' } }
        }
      }, function (err, resp) {
        assertGetResult(resp.body.obj1, 'service1', 'object', '1');
        assertGetResult(resp.body.obj2, 'service2', 'object', '2');
        done();
      });
    });
  });

  describe('error handling', function() {
    it('should return error if script is invalid', function() {
      send({
        script: {
          $exec: 'service1',
          $args: {
            method: 'get',
            path: '/object/1'
          },
          $wrongProperty: true
        }
      }, function (err, resp) {
        assert(!!err);
        assert.equal(resp.statusCode, 400);
        assert.equal(resp.body.error, 'script is invalid');
        done();
      });
    });
  });

  describe('sequential evaluation', function() {
    it('should process GET and then POST', function (done) {
      send({
        script: [
          {
            $exec: 'service1',
            $method: 'get',
            $args: {
              path: '/object/1'
            }
          },
          {
            $exec: 'service2',
            $method: 'post',
            $args: {
              path: '/object',
              body: { foo: 'bar' }
            }
          }
        ]
      }, function (err, resp) {
        assertGetResult(resp.body[0], 'service1', 'object', '1');
        assertPostResult(resp.body[1], 'service2', 'object', { foo: 'bar' });
        done();
      });
    });

    it('should process GET and then POST with macros', function (done) {
      send({
        script: [
          { '$$service1.get': { path: '/object/1' } },
          { '$$service2.post': { path: '/object', body: { foo: 'bar' } } }
        ]
      }, function (err, resp) {
        assertGetResult(resp.body[0], 'service1', 'object', '1');
        assertPostResult(resp.body[1], 'service2', 'object', { foo: 'bar' });
        done();
      });
    });
  });


  describe('options', function() {
    describe('options validation', function() {
      it('should throw if options are invalid', function() {
        assert.throws(function() {
          var proxy = createProxy({}); // "services" is required property
        });
      });
    });

    describe('processResponse: "body"', function() {
      beforeEach(function() {
        proxy = createProxy({ services: SERVICES, processResponse: 'body' });
      });

      it('should return response body only', function (done) {
        send({
          script: {
            $exec: 'service1',
            $args: {
              method: 'get',
              path: '/object/1'
            }
          }
        }, function (err, resp) {
          assert.deepEqual(resp.body, {
            name: 'object',
            id: 1,
            service: 'service1',
            info: 'resource object id 1'
          });
          done();
        });
      });
    });
  });

  function send(reqBody, callback) {
    test(proxy)
    .post('/js')
    .set('Accept', 'application/json')
    .send(reqBody)
    .expect(200)
    .end(callback);
  }
});


function assertGetResult(result, serviceName, name, id) {
  assert.equal(result.statusCode, 200);
  assert.equal(typeof result.headers, 'object');
  assert.deepEqual(result.request, { method: 'get', path: '/' + name + '/' + id })
  assert.deepEqual(result.body, {
    name: name,
    id: id,
    service: serviceName,
    info: 'resource ' + name + ' id ' + id
  });
}


function assertPostResult(result, serviceName, name, data) {
  assert.equal(result.statusCode, 200);
  assert.equal(typeof result.headers, 'object');
  assert.deepEqual(result.request, { method: 'post', path: '/' + name, body: data })
  assert.equal(result.body.name, name);
  var id = result.body.id;
  assert(Date.now() - id < 1000);
  assert.equal(result.body.service, serviceName);
  assert.equal(result.body.info, 'resource ' + name + ' id ' + id);
  assert.deepEqual(result.body.data, data);
}
