var app = require('express')(),
    http = require('http'),
    fs = require('fs'),
    adb = require('adbkit'),
    client = adb.createClient(),
    server = require('http').createServer(app);

// Chargement de la page index.html
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

// Chargement de socket.io
var io = require('socket.io').listen(server);
var logcat = require('adbkit-logcat');
var spawn = require('child_process').spawn;


// Quand on client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {
    console.log('Un client est connecté !');
    socket.emit('client_connected', 'Un client est connecté !');

// On track les devices qui sont connectés
    client.trackDevices()
  .then(function(tracker) {
    tracker.on('add', function(device) {
      console.log('Device %s was plugged in', device.id);
      socket.emit('device-plugged' ,'Device ' + device.id + ' was plugged in');
    })
    tracker.on('remove', function(device) {
      console.log('Device %s was unplugged', device.id);
      socket.emit('device-unplugged' ,'Device ' + device.id + ' was unplugged');
    })
    tracker.on('end', function() {
      console.log('Tracking stopped')
      socket.emit('device-stop' ,'Tracking stopped');
    })
  })
  .catch(function(err) {
    console.error('Something went wrong:', err.stack)
  });

  // On envoie la commande adb 
  var proc = spawn('adb', ['logcat', '-B']);
   
  // On connecte le logcat au stream
  reader = logcat.readStream(proc.stdout);
  reader.on('entry', function(entry) {
    //console.log(entry.message);
    socket.emit('logcat', entry.message);
  });
   
  // On quitte proprement en tuant le process à la sortie
  process.on('exit', function() {
    proc.kill();
  });

});



 


server.listen(3000);

