/*
 * netcan.js - SocketCAN node interface
 * Copyright (C) 2016
 * Shaun Landis - slandis@github
 */

var events = require('events');
var util = require('util');
var spawn = require('child_process').spawn;
var spawnSync = require('child_process').spawnSync;

var dcb;  /* data callback    */
var ecb;  /* error callback */

function data(packet) {
  this.emit('data', packet);
}

function error(error) {
  if (error == undefined)
    this.emit('error');
  else
    this.emit('error', error);
}

exports.createCanInterface = function(path, opts) {
  return new CanInterface(path, opts);
}

function CanInterface(path, opts) {
  this.path = path;
  this.opts = opts; /* Can be a single string, or array of strings, send candump usage for format */

  /* Callbacks */
  dcb = data.bind(this);
  ecb = error.bind(this);
}

util.inherits(CanInterface, events.EventEmitter);

CanInterface.prototype.StartListener = function() {
  this.pid = spawn(this.path + '/candump',
    (typeof(this.opts) == 'string') ? [this.opts] : this.opts);

  this.pid.stdout.on('data', function(data) {
    var line = data.toString().trim();
    var re = new RegExp(/^(can[0-9])[ ]+([\w]+)[ ]+\[([\w]+)\][ ]+(.*)/);
    var matches = line.match(re);
    var bytes = matches[4].split(' ');

    var packet = {
      iface: matches[1],
      source: matches[2],
      length: parseInt(matches[3], 10),
      bytes: bytes,
    };

    dcb(packet);
  });

  this.pid.stdout.on('error', function() {
    this.emit('error');
  });
}

CanInterface.prototype.StopListener = function() {
  this.pid.kill('SIGTERM');
}

CanInterface.prototype.Send = function(iface, source, data) {
  var send = spawnSync(this.path + '/cansend', [iface, source + '#' + data.join('')]);

  if (send.error)
    ecb(send.error);
}
