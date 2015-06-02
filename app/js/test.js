(function() {
    console.log("Hello world!");
    
    // Packing
    function testPacking() {
        var packing = require('./packing.js');
        var Item = packing.Item;
        
        var itemConstraints = [
            {
                width: 10,
                height: 20,
                count: 100
            },
            {
                width: 30,
                height: 10,
                count: 300
            },
            {
                width: 42,
                height: 25,
                count: 20
            },
            {
                width: 15,
                height: 15,
                count: 200
            },
        ];
            
    
        var items = [];
        
        items.push(new Item(itemConstraints[0]));
        items.push(new Item(itemConstraints[0]));
        items.push(new Item(itemConstraints[0]));
        items.push(new Item(itemConstraints[1]));
        items.push(new Item(itemConstraints[2]));
        items.push(new Item(itemConstraints[3]));
        
        var options = {
            pattern: {
                width: 100,
                height: 40,
                max: 10
            }
        };
        
        var patterns = packing.pack(items, options);
        
        console.log("created " + patterns.length + " patterns");
        
        var item;
        for(var p in patterns) {
            for(var i in patterns[p].items) {
                item = patterns[p].items[i];
                console.log(p + " x:" + item.x + " y:" + item.y + " w:" + item.constraint.width + " h:"+ item.constraint.height + " rotated:" + item.rotated);
            }
        }
    }
    
    // Solver
    function testSolver() {
        var lpsolve = require('lp_solve');
        var Row = lpsolve.Row;
        
        var lp = new lpsolve.LinearProgram();
        
        var x = lp.addColumn('x'); // lp.addColumn('x', true) for integer variable
        var y = lp.addColumn('y'); // lp.addColumn('y', false, true) for binary variable
        
        
        var objective = new Row().Add(x, 1).Add(y, 1);
        
        lp.setObjective(objective);
        
        var machineatime = new Row().Add(x, 50).Add(y, 24);
        lp.addConstraint(machineatime, 'LE', 2400, 'machine a time')
        
        var machinebtime = new Row().Add(x, 30).Add(y, 33);
        lp.addConstraint(machinebtime, 'LE', 2100, 'machine b time')
        
        lp.addConstraint(new Row().Add(x, 1), 'GE', 75 - 30, 'meet demand of x')
        lp.addConstraint(new Row().Add(y, 1), 'GE', 95 - 90, 'meet demand of y')
        
        console.log(lp.dumpProgram());
        console.log(lp.solve());
        console.log('objective =', lp.getObjectiveValue());
        console.log('x =', lp.get(x));
        console.log('y =', lp.get(y));
        console.log('machineatime =', lp.calculate(machineatime));
        console.log('machinebtime =', lp.calculate(machinebtime));
    }
    
    // Optimization
    function testOptimization() {
        var optimization = require("./optimization.js");
        
        var options = {
            pattern: {
                width: 100,
                height: 40,
                max: 42,
                cost: 20,
                copyCost: 1
            },
            items: [
                {
                    width: 5,
                    height: 20,
                    min: 500
                },
                {
                    width: 20,
                    height: 20,
                    min: 200
                },
                {
                    width: 42,
                    height: 10,
                    min: 12
                }
            ],
            genetic: {
                population: 100,
                generations: 100,
                selection: 0.5,
                mutation: 0.2,
                mutationCount: 5
            }
        };
        
        options = optimization.readOptionsFromFile('../../data/data_20Salpha.txt');
        
        var choice = optimization.optimize(options);
        
        console.log(choice);
    }
    
    testOptimization();
    
})();