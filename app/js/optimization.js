'use strict';

var fs = require("fs");
var packing = require('./packing.js');
var lpsolve = require('lp_solve');

var exampleOptions = {
    pattern: {
        width: 100,
        height: 40,
        max: 10,
        cost: 10,
        copyCost: 1
    },
    items: [
        {
            width: 10,
            height: 20,
            min: 500
        }
    ],
    genetic: {
        population: 1000,
        generations: 100,
        selection: 0.5,
        mutation: 0.2
    }
};


function Solution() {
    var self = this;
    
    self.items = [];
    self.patterns = [];
    self.cost = 0;
    self.selection = -1;
    self.itemCount = [];
}

function SolutionPattern(pattern) {
    var self = this;
    
    self.count = 0;
    self.pattern = pattern;
    self.itemMap = {};
    
    self.updateItemMap = function() {
        self.itemMap = {};
        var item;
        for(var i in self.pattern.items) {
            item = self.pattern.items[i];
            if(!self.itemMap[item.constraint.id]) {
                self.itemMap[item.constraint.id] = 1;
            } else {
                self.itemMap[item.constraint.id] ++;
            }
        }
    };
    
    self.updateItemMap();
}


exports.optimize = function (options) {
    
    function addItems(solution, id, count) {
        for(var c = 0; c < count; c ++) {
            solution.items.push(new packing.Item(options.items[id]));
        }
        solution.itemCount[id] = count;
    }
    
    function generateFirstSolution() {
        var solution = new Solution();
        
        var l = options.items.length;
        var item, count, totalSurface = 0;
        for(var i in options.items) {
            item = options.items[i];
            totalSurface += item.min;
        }
        
        for(i in options.items) {
            item = options.items[i];
            // Surface ratio * 2
            // Minimum 1
            count =  item.min / totalSurface * l * 2;
            addItems(solution, i, Math.max(1, Math.round(count)));
        }
        
        updateSolution(solution);
        
        return solution;
    }
    
    function generateNeighbourSolution(neighbour) {
        var solution = new Solution();
        
        // Copy items
        for(i in neighbour.itemCount) {
            addItems(solution, parseInt(i), neighbour.itemCount[i]);
        }
        
        mutateSolution(solution);
        
        updateSolution(solution);
        
        return solution;
    }
    
    function generatePopulation(size) {
        var population = [generateFirstSolution()];
        for(var s = 1; s < size; s ++) {
            population.push(generateNeighbourSolution(population[s-1]));
        }
        return population;
    }
    
    function updateSolution(solution) {
        packSolution(solution);
        solveSolutionCopyCount(solution);
        solution.cost = getSolutionCost(solution);
    }
    
    function packSolution(solution) {
        solution.patterns = [];
        var patterns = packing.pack(solution.items, options);
        for(var p in patterns) {
            solution.patterns.push(new SolutionPattern(patterns[p]));
        }
    }
    
    function solveSolutionCopyCount(solution) {
        // Linear program
        var lp = new lpsolve.LinearProgram();
        
        var objective = new lpsolve.Row();
        
        // Variables: pattern copies count
        var variables = [], variable;
        for(var p in solution.patterns) {
            variable = lp.addColumn('P' + p);
            variables.push(variable);
            objective.Add(variable, 1);
        }
        
        lp.setObjective(objective);
        
        // Constraints: items count
        var constraint, itemC, pattern;
        for(var i in options.items) {
            itemC = options.items[i];
            
            constraint = new lpsolve.Row();
            
            for(p in solution.patterns) {
                pattern = solution.patterns[p];
                if(pattern.itemMap[itemC.id]) {
                    constraint.Add(variables[p], pattern.itemMap[itemC.id]);
                }
            }
            
            lp.addConstraint(constraint, 'GE', itemC.min, 'Item' + itemC.id + ' minimum count');
        }
        
        lp.solve();
        
        // Copies count
        for(p in solution.patterns) {
            solution.patterns[p].count = lp.get(variables[p]);
        }
    }
    
    function getSolutionCost(solution) {
        var cost = 0;
        for(var p in solution.patterns) {
            cost += options.pattern.cost + options.pattern.copyCost * solution.patterns[p].count;
        }
        return cost;
    }
    
    function geneticSelection(population, gen) {
        var selectedPopulation = [];
        
        var l = population.length * options.genetic.selection;
        var totalCost = 0, maxCost = 0;
        var solution;
        
        // Total cost
        for(var i in population) {
            solution = population[i];
            if(solution.cost > maxCost) {
                maxCost = solution.cost;
            }
        }
        for(i in population) {
            solution = population[i];
            totalCost += maxCost - solution.cost + 1;
        }
        
        // Selection based on the wheel of fortune concept
        // Each solution has a slice which size is proportionnal to the solution cost
        var die, cost;
        for(var d = 0; d < l; d++) {
            // Random cost
            die = Math.random() * totalCost;
            cost = 0;
            // Cost added for each non-selected solution
            for(i in population) {
                solution = population[i];
                // Only non-selected solutions
                if(solution.selection != gen) {
                    cost += maxCost - solution.cost + 1;
                    // If we go past the die, we select the solution
                    if(cost >= die) {
                        selectedPopulation.push(solution);
                        solution.selection = gen;
                        totalCost -= solution.cost;
                        break;
                    }
                }
            }
        }
        
        return selectedPopulation;
    }
    
    function geneticCrossOver(population) {
        var solution1, solution2, child;
        var children = [];
        var index1, index2;
        var pl = population.length;
        // Missing solutions number to get <options.population> solutions
        var l = Math.round(pl/options.genetic.selection*(1-options.genetic.selection)/2);
        for(var i = 0; i < l; i++) {
            // Select two random parents
            index1 = Math.round(Math.random()*(pl-1));
            do {
                index2 = Math.round(Math.random()*(pl-1));
            } while(index2 == index1);
            solution1 = population[index1];
            solution2 = population[index2];
            // Create a child from crossover
            children = children.concat(crossOverSolutions(solution1, solution2));
        }
        for(i in children) {
            child = children[i];
            updateSolution(child);
            population.push(child);
        }
    }
    
    function crossOverSolutions(solution1, solution2) {
        var itemCount1 = [];
        var itemCount2 = [];
        var child1 = new Solution();
        var child2 = new Solution();
        var l = options.items.length;
        var index = Math.round(Math.random()*(l-2)+1);
        // Swap items before index ?
        var before = (Math.random() < 0.5);
        for(var i = 0; i < l; i++) {
            // Swap item count
            if((i < index && before) || (i >= index && !before)) {
                itemCount1[i] = solution2.itemCount[i];
                itemCount2[i] = solution1.itemCount[i];
            } else {
                // Or just copy
                itemCount1[i] = solution1.itemCount[i];
                itemCount2[i] = solution2.itemCount[i];
            }
            // Add items
            addItems(child1, i, itemCount1[i]);
            addItems(child2, i, itemCount2[i]);
        }
        return [child1, child2];
    }
    
    function geneticMutation(population) {
        var solution;
        for(var i in population) {
            solution = population[i];
            
            // Mutation chance
            if(Math.random() <= options.genetic.mutation) {
                mutateSolution(solution);
                updateSolution(solution);
            }
        }
    }
    
    function mutateSolution(solution) {
        // Random change
        var changeIndex;
        var ol = options.items.length;
        var sl = solution.items.length;
        if(ol == sl || Math.random() < 0.5) {
            // Add
            // Automatically adds if there is one occurence of each item (solution.items.length == options.items.length)
            var itemId = Math.round(Math.random()*(ol-1));
            solution.items.push(new packing.Item(options.items[itemId]));
            solution.itemCount[itemId] ++;
        } else {
            // Remove
            var item;
            do {
                // Randomly select one occurence
                changeIndex = Math.round(Math.random()*(sl-1));
                item = solution.items[changeIndex];
            } while(solution.itemCount[item.constraint.id] <= 1); // Retry if there is only one occurence of the item
            solution.items.splice(changeIndex, 1);
            solution.itemCount[item.constraint.id] --;
        }
    }
    
    // Id on item sizes
    for(var i in options.items) {
        options.items[i].id = parseInt(i);
    }
    
    // Initial population
    var population = generatePopulation(options.genetic.population);
    
    // Generations
    for(var gen = 0; gen < options.genetic.generations; gen ++) {
        console.log('gen' + gen);
        
        // Selection
        population = geneticSelection(population, gen);
        
        // Crossover
        geneticCrossOver(population);
        
        // Mutation
        geneticMutation(population);
        
        var min = 999999999, cost;
        for(var i in population) {
            if((cost = population[i].cost) < min) {
                min = cost;
            }
        }
        console.log('best ' + min);
    }
    
    // Best solution
    var choice, solution;
    for(var s in population) {
        solution = population[s];
        if(!choice || solution.cost < choice.cost) {
            choice = solution;
        }
    }
    
    return choice;
};

exports.readOptionsFromFile = function(path) {
    var options = {
        pattern: {
            width: 100,
            height: 40,
            max: 999,
            cost: 20,
            copyCost: 1
        },
        items: [
        ],
        genetic: {
            population: 100,
            generations: 100,
            selection: 0.5,
            mutation: 0.2
        }
    };
    
    var content = fs.readFileSync(path, "utf8");
    console.log(content);
    var lines = content.split("\n");
    
    var reg, matches;
    
    reg = /LX=(\d+)/gi;
    matches = reg.exec(lines[0]);
    options.pattern.width = parseInt(matches[1]);
    reg = /LY=(\d+)/gi;
    matches = reg.exec(lines[1]);
    options.pattern.height = parseInt(matches[1]);
    
    reg = /m=(\d+)/gi;
    matches = reg.exec(lines[2]);
    var l = parseInt(matches[1]);
    
    for(var i = 3; i < l + 3; i++) {
        reg = /([\d.]+)\s+([\d.]+)\s+(\d+)/gi;
        matches = reg.exec(lines[i]);
        options.items.push({
            width: parseFloat(matches[1]),
            height: parseFloat(matches[2]),
            min: parseFloat(matches[3])
        });
    }
    
    return options;
};