
var config = require('./config.js');
var optimization = require("./optimization.js");
// Files
var fs = require('fs');
// Socket
var io = require('socket.io')(config.socketConfig.port);
// Web
var Web = require('./lib/web-server.js');
var open = require('open');


// Socket server
io.on('connection', function (socket) {
    socket.on('getFiles', function(callback) {
        try {
            fs.readdir('./data', function(err, files) {
                if(!err) {
                    callback(files);
                }
            });
        } catch(e) {
            console.error(e);
        }
    });
    
    socket.on('optimize', function (options) {
        console.log(options);
        
        try {
        
            var opts = optimization.readOptionsFromFile('./data/' + options.file);

            opts.genetic.population = parseInt(options.population);
            opts.genetic.generations = parseInt(options.generations);
            opts.genetic.selection = parseFloat(options.selection);
            opts.genetic.randomSelection = options.randomSelection;
            opts.genetic.mutation = parseFloat(options.mutation);
            opts.genetic.mutationCount = parseInt(options.mutationCount);
            
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
                socket.emit('result', result);
            }, function(notification) {
                console.log(notification);
                socket.emit('progress', notification);
            });
            
        } catch(e) {
            console.error(e);
        }
    });

    socket.on('disconnect', function () {
        console.log('client disconnected');
    });
});


// Web server
Web.start();
open('http://localhost:' + config.webConfig.port);