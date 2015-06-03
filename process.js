
var optimization = require("./optimization.js");

var opts;

process.on('message', function(options) {
    opts = optimization.readOptionsFromFile('./data/' + options.file);
    opts.genetic.population = parseInt(options.population);
    opts.genetic.generations = parseInt(options.generations);
    opts.genetic.selection = parseFloat(options.selection);
    opts.genetic.randomSelection = options.randomSelection;
    opts.genetic.mutation = parseFloat(options.mutation);
    opts.genetic.mutationCount = parseInt(options.mutationCount);
    launch();
});

function launch() {

    var time = new Date();

    optimization.optimize(opts, function(choice) {
        console.log(choice);
        var patterns = [], pattern, items, item;
        var itemCount = [];
        for(var i in opts.items) {
            itemCount.push({
                id: parseInt(i),
                count: 0,
                min: opts.items[i].min,
                inPatterns: choice.itemCount[i]
            });
        }
        for(var p in choice.patterns) {
            pattern = choice.patterns[p];
            items = [];
            for(i in pattern.pattern.items) {
                item = pattern.pattern.items[i];
                items.push({
                    constraint: item.constraint,
                    x: item.x,
                    y: item.y,
                    width: item.getRotatedWidth(),
                    height: item.getRotatedHeight()
                });
            }
            for(i in pattern.itemMap) {
                itemCount[i].count = pattern.itemMap[i] * pattern.count;
            }
            patterns.push({
                items: items,
                width: opts.pattern.width,
                height: opts.pattern.height,
                count: pattern.count
            });
        }
        var now = new Date();
        var result = {
            cost: choice.cost,
            itemCount: choice.itemCount,
            patterns: patterns,
            options: opts,
            itemCount: itemCount,
            time: now.getTime() - time.getTime()
        };
        process.send({result:result});
    }, function(notification) {
        console.log(notification);
        process.send({notification:notification});
    });
    
}