'use strict';

/**
 * Rectangular item to arrange in patterns.
 * @constructor
 */
function Item (width, height) {
    var self = this;
    
    self.width = width;
    self.height = height;
    self.x = 0;
    self.y = 0;
    self.pattern = null;
    self.rotated = false;

    self.getRotatedWidth = function() {
        if(self.rotated) {
            return height;
        } else {
            return width;
        }
    };

    self.getRotatedHeight = function() {
        if(self.rotated) {
            return width;
        } else {
            return height;
        }
    };
}

exports.Item = Item;

/**
 * Rectangular sheet containing arranged items.
 * @constructor
 */
function Pattern (width, height) {
    var self = this;

    self.width =  width;
    self.height = height;

    self.testFit = function (item) {
        if(item.width <= self.width && item.height <= self.height) {
            return 1;
        } else if(item.height <= self.width && item.width <= self.height) {
            return -1;
        } else {
            return 0;
        }
    };
    
    self.cut = function (cutWidth, cutHeight) {
        
    };
}

exports.Pattern = Pattern;


var exampleOptions = {
    pattern: {
        width: 100,
        height: 40,
        min: 0,
        max: 10
    }
};

/**
 * Arrange items in several patterns, minimizing pattern number.
 * @param 
 * @param Object
 */
exports.pack = function (items, options) {
    
    var pattern = options.pattern;
    var items = options.items;
    
    var createdPatterns = [];
    var placedItems = [];
    
    
};