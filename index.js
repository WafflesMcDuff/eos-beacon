/* dependancies verklaren en ophalen */
var express = require('express');
var app     = express();
var http    = require('http').Server(app);
var io      = require('socket.io')(http);
var $       = require('jquery');
var ip      = require('ip');
var bodyParser = require('body-parser');


/* CONFIGURATIE: vaste gegevens bij start up. */
var port          = process.env.PORT || 5000;
var globalSettings = {
  appnaam1      : 'BEACON',
  appnaam2      : 'beacon',
  appnaam3      : 'Beacon',
  appdescription: '/ EOS BASTION INFORMATION SERVICE',
  localaddress  : ip.address() +':'+ port,
}
var default_security_level = "Code green - All clear";
/* SS13 VOORBEELDEN : */
/*
  Code Blue - Confirmed Threat. Weapons may be visible.
  Code Red - Immediate Threat
  Code Delta - Imminent Destruction
  PSY-hazard?
  BIO-hazard?
*/

/* DYNAMIC DATA: data die bij setup worden gebruikt en constant kunnen worden aangepast. */
var dynamicData = {
  countClients  : 0,
  alertLevel    : default_security_level
}



/* INITIALISEN VAN APP */

// connection.connect();

app.use(express.static('public'));
app.use(express.static('_includes'));
app.use('_includes', express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));

http.listen(port, function(){
  console.log('. ');
  console.log('. ');
  console.log('.. ');
  console.log('// '+globalSettings['appnaam1']+' ////////////');
  console.log('# Initialising ..' );
  console.log('# Loading dependancies ..');
  console.log('-------------------------');
  console.log('# CONNECT DEVICES//USERS TO :');
  console.log(' ? External IP : ' + globalSettings['localaddress'] );
  console.log(' ? Internal IP : localhost:'+ port  + ' | ' + '127.0.0.1:'+ port );
  console.log('-------------------------');
  console.log('THANK YOU FOR USING '+globalSettings['appnaam1']+' INFORMATION & BROADCASTING SERVICES');
});



/* pathing / routing */
app.get('/', function(req, res){
  res.sendFile('index.html', {"root": __dirname+'/public/'});
});


io.on('connection', function (socket) {

  dynamicData['countClients']++;
  console.log('Device connected. '+dynamicData['countClients']+' active clients.');

  // stuurt IP naar de index pagina zodat deze bovenin kan worden laten zien.
  // socket.emit('showIP', 'IP: ' + localaddress);
  socket.emit('startConfig', globalSettings);

  // CLEARALL :: reset broadcasts.
  socket.on('ClearAll', function() {
    dynamicData['alertLevel'] = default_security_level;
    io.emit('allclear', dynamicData['alertLevel']);
  });

  // FORCE RESET ::
  socket.on('forceReset', function() {
    io.emit('F5');
  });

  socket.on('requestDynamicData', function (){
    io.emit('updateDynamicData', dynamicData);
  });


  socket.on('broadcastSend', function(value){
    console.log(value);
    io.emit('broadcastReceive', value);
  });

  socket.on('disconnect', function(){
    dynamicData['countClients'] = (dynamicData['countClients']-1);
    console.log('DISCONNECT// .. ' +dynamicData['countClients']+' active clients.');
    io.emit('updateDynamicData', dynamicData);
  });


  socket.on('auth', function(keycode){
    console.log('authentication code received: '+keycode);

    if(keycode == '00451') {
      socket.emit('authTrue', keycode);
    } else {
      socket.emit('authFalse');
    }
  });

});
