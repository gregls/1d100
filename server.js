var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var ent = require('ent');
var dice = require('./modules/dice.js');

app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/html', express.static(__dirname + '/html'));

app.get('/', function(request, response){
    response.sendFile(__dirname + '/html/index.htm');
});

var playerList =[];
var socketByRoom = [];
var defaultRoom = 'demo';

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};

Date.now = function(){
    return Math.floor(new Date().getTime()/1000);
}

io.sockets.loginExists = function(login){
    var founded = false;
    playerList[defaultRoom].forEach(function(player){
        if (player.login == login){
            founded = true;
            return;
        }
    });
    
    return founded;
}
    
io.sockets.on('connection', function(socket, pseudo){
        
    socket.on('player', function(player){
        if (!socketByRoom[defaultRoom]){
            socketByRoom[defaultRoom] = [];
        }
        if (!playerList[defaultRoom]){
            playerList[defaultRoom] = new Array();
        }
        
        var login = ent.encode(player.login);
        
        if (io.sockets.loginExists(login)){
            socket.emit('message', {login: login, message: 'Le login '+login+' est déjà présent dans ce chat !', loginIncluded: true, reloadToHome: true});
            socket.disconnect({sendMessage: false});
        } else {
            socket.login = login;
            socket.join(defaultRoom);
            
            socketByRoom[defaultRoom][socket.id] = socket;
            
            playerList[defaultRoom].push({login: socket.login, date: Date.now(), socketId: socket.id});
            io.in(defaultRoom).emit('playerList', playerList[defaultRoom]);
        
            io.in(defaultRoom).emit('message', {login: socket.login, message: socket.login + ' vient de se connecter sur le chat '+defaultRoom+'.', loginIncluded: true});
        }
    });
    
    socket.on('disconnect', function(info){
        if (playerList[defaultRoom]){
            playerList[defaultRoom].forEach(function(player){
                if (player.login == socket.login){
                    playerList[defaultRoom].splice(player, 1);
                }
            });
        }
        if (info.sendMessage){
            io.in(defaultRoom).emit('message', {login: socket.login, message: socket.login + ' vient de se déconnecter du chat '+defaultRoom+'.', loginIncluded: true});
            io.in(defaultRoom).emit('playerList', playerList[defaultRoom]);
        }
        socket.login = null;
        socket.leave(defaultRoom);
    });
    
    socket.on('message', function(message){
        message.login = ent.encode(message.login);
        result = dice.parseString(message.message);
        if (result.diceNumber > 0) {
            finalResult = result.message.join(', ');
            if (result.favorable == 'min'){
                result.message = [result.message.min()];
            } else if (result.favorable == 'max') {
                result.message = [result.message.max()];
            }
            messageToSend = message.login + ' jette ' + message.message.replace('!', '').replace('&', '') + ' et obtient ' + finalResult;
            if (result.diceNumber > 1 || result.freeDice || result.operatorResult){
                somme = result.message.reduce(function(valeurPrecedente, valeurCourante, index, array){
                    return valeurPrecedente + valeurCourante;
                });
                somme = somme + result.operatorResult;
                messageToSend = messageToSend + ' (Total = ' + somme + ')';
            }
            loginIncluded = true;
        } else {
            messageToSend = result.message;
            loginIncluded = false;
        }
        if (result.secret) {
            socketByRoom[defaultRoom][socket.id].emit('message', {login: message.login, message: messageToSend, loginIncluded: loginIncluded});
        } else {
            io.in(defaultRoom).emit('message', {login: message.login, message: messageToSend, loginIncluded: loginIncluded});    
        }
    });   
})

server.listen(8080, function(){
    console.log('ready');
});