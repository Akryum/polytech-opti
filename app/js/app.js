(function(){
    'use strict';
    
    angular.module('app', [])
    
    .controller('OptimizationCtrl', function() {
        var ctrl = this;
        
        ctrl.population = 100;
        ctrl.generations = 100;
        ctrl.selection = 0.5;
        ctrl.randomSelection = false;
        ctrl.mutation = 0.3;
        ctrl.mutationCount = 5;
        
        angular.extend(ctrl, {
            
        });
    })
    
})();