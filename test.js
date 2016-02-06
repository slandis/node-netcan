var path = '/usr/bin';
var opts = [ 'can0' ];
var can = require('./can').createCanInterface(path, opts);

can.on('data', function(p) {
  console.log("%s %s %s", p.iface, p.source, p.bytes.join());
});

can.StartListener();

setTimeout(function() {
  can.StopListener();
}, 1500);

can.on('error', function(error) {
  console.log(error);
});

can.Send('can1', '001', ['00', 'FF', 'D8', 'D0']);
