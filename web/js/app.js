(function(){
    'use strict';
    
    angular.module('app', [])
    
    .controller('OptimizationCtrl', function(SocketService, OptimizationService) {
        var ctrl = this;
        
        ctrl.file = null;
        ctrl.population = 100;
        ctrl.generations = 100;
        ctrl.selection = 0.5;
        ctrl.randomSelection = false;
        ctrl.mutation = 0.3;
        ctrl.mutationCount = 5;
        ctrl.result = null;
        
        function launch() {
            console.log(ctrl.file);
            
            ctrl.result = null;
            
            OptimizationService.optimize({
                file: ctrl.file,
                population: ctrl.population,
                generations: ctrl.generations,
                selection: ctrl.selection,
                randomSelection: ctrl.randomSelection,
                mutation: ctrl.mutation,
                mutationCount: ctrl.mutationCount
            }).then(function(result) {
                ctrl.result = result;
            }, function(error) {
                
            }, function(notification) {
                
            });
        }
        
        angular.extend(ctrl, {
            launch: launch,
            netStatus: SocketService.status,
            files: OptimizationService.files,
            progress: OptimizationService.progress
        });
    })
    
    .service('SocketService', function($timeout) {
        var srv = {
            status: {
                connected: false,
                connecting: false
            }
        };
        
        var socket = io('localhost:4243');
        socket.connect();
        srv.status.connecting = true;
        socket.on('connect', function () {
            $timeout(function() {
                console.log('connected');
                srv.status.connected = true;
                srv.status.connecting = false;
            });
        });
        socket.on('disconnect', function () {
            $timeout(function() {
                console.log('disconnected');
                srv.status.connected = false;
                srv.status.connecting = false;
            });
        });
        
        angular.extend(srv, {
            socket: socket
        });
        
        return srv;
    })
    
    .service('OptimizationService', function($q, $timeout, SocketService) {
        var srv = {
            files: [],
            progress: {
                current: 0,
                total: 0,
                notification: null
            }
        };
        
        $q(function(resolve) {
            SocketService.socket.emit('getFiles', function(files) {
                resolve(files);
            });
        }).then(function(files) {
            srv.files.length = 0;
            for(var i in files) {
                srv.files.push(files[i]);
            }
        });
        
        SocketService.socket.on('progress', function(notification) {
            $timeout(function() {
                srv.progress.current = notification.generation + 1;
                srv.progress.notification = notification;
            });
        });
        
        function optimize(options) {
            var deferred = $q.defer();

            srv.progress.current = 1;
            srv.progress.total = options.generations;

            SocketService.socket.emit('optimize', options);
            SocketService.socket.on('result', function(result) {
                SocketService.socket.off('result');
                deferred.resolve(result);
                console.log(result);
            });

            return deferred.promise;
        }
        
        angular.extend(srv, {
            optimize: optimize
        });
        
        return srv;
    })
    
})();