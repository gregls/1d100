var app1d100 = angular.module('app1d100', ['ngRoute']);

app1d100.config(function($routeProvider){
   $routeProvider
       .when('/', {
           templateUrl: 'html/login.htm',
           controller: 'loginController'
       })
       .when('/chat', {
            templateUrl: 'html/chat.htm',
            controller: 'chatController'
        })
});

app1d100.service('chatService', function(){
    
    this.login = 'Joueur#' + Math.floor(Math.random() * 1000);
    this.connected = false;
    this.messageSended = [];
    this.currentIndex = 0;
    
    this.connect = function(){
        this.connected = true;
    };
    this.disconnect = function(){
        this.connected = false;
    };
    this.isConnected = function(){
        return this.connected;
    }
});

app1d100.controller('chatController', ['$scope', 'chatService', 'socketio', function($scope, chatService, socketio){
    if (chatService.isConnected()) {
        socketio.emit('disconnect', {sendMessage: true});
        chatService.disconnect();
    }
    
    $scope.login = chatService.login;
    
    socketio.emit('player', {login: $scope.login});
    socketio.on('playerList', function(playerList){        
        var html = '<ul>';
        playerList.forEach(function(player, key){
            if (player.login == chatService.login){
                html = html + '<li><b><u>'+player.login+'</u></b></li>';
            } else {
                html = html + '<li>'+player.login+'</li>';
            }
        });
        html = html + '</ul>';
        $('#playerList').html(html);
    });
    $('#message').focus();
    chatService.connect();
}]);

app1d100.controller('messageController', ['$scope', 'chatService', 'socketio', function($scope, chatService, socketio){
    $scope.login = chatService.login;
    $scope.sendMessage = function(){
    
        if ($scope.message){
            socketio.emit('message', {login: $scope.login, message: $scope.message});
            chatService.messageSended.push($scope.message);
            chatService.currentIndex = chatService.messageSended.length;
            $scope.message = '';
        }
    }
    
    $scope.onKeyDown = function ($event) {
        var keyCode;
        window.event ? keyCode = $event.keyCode : keyCode = $event.which;
        switch(keyCode) {
            case 13 : //touche entree
                $event.preventDefault();
                $scope.sendMessage();
                break;
            case 38 : //fleche haut
                $event.preventDefault();
                if (chatService.currentIndex > 0) {
                    $scope.message = chatService.messageSended[chatService.currentIndex - 1];
                    chatService.currentIndex --;
                }
                break;
            case 40 : //fleche bas
                $event.preventDefault();
                if (chatService.currentIndex < chatService.messageSended.length) {
                    $scope.message = chatService.messageSended[chatService.currentIndex];
                    chatService.currentIndex ++;
                }
                break;
        }
    };
    
    socketio.on('message', function(message){
        var positionScroll = 0;
        if (message.loginIncluded) {
            $('#messages').append($('<div class="message">').addClass('italic').text(message.message));
        } else {
            $('#messages').append($('<div class="message">').text(message.login + ' : ' + message.message));
        }
        if($('#messages .message:last-child').position()){
            positionScroll = $('#messages .message:last-child').position().top;
        }
        $('#messages').animate({scrollTop: positionScroll}, 'slow');
        if (message.reloadToHome){
            $scope.login = null;
            window.location.href = '/';
        }
    });
}]);

app1d100.controller('loginController', ['$scope', 'chatService', function($scope, chatService){
    $scope.login = chatService.login;
}]);

app1d100.controller('loginFormController', ['$scope', 'chatService', 'socketio', function($scope, chatService, socketio){
    if (chatService.isConnected()) {
        socketio.emit('disconnect');
        chatService.disconnect();
    }
    $scope.onKeyDown = function ($event) {
        var keyCode;
        window.event ? keyCode = $event.keyCode : keyCode = $event.which;
        switch(keyCode) {
            case 13 : //touche entree
                $event.preventDefault();
                chatService.login = $scope.login;
                window.location.href = '/#/chat';
                break;
        }
    };
    $scope.onClick = function ($event) {
        $event.preventDefault();
        chatService.login = $scope.login;
        window.location.href = '/#/chat';
    };
}]);

app1d100.factory('socketio', ['$rootScope', function ($rootScope) {
    'use strict';

    var socket = io.connect();
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
}]);