'use strict';

/**
 * Rectangular item to arrange in patterns.
 * @constructor
 */
function Item(constraint) {
    var self = this;

    self.constraint = constraint;
    self.x = 0;
    self.y = 0;
    self.pattern = null;
    self.rotated = false;

    self.getRotatedWidth = function() {
        if (self.rotated) {
            return self.constraint.height;
        } else {
            return self.constraint.width;
        }
    };

    self.getRotatedHeight = function() {
        if (self.rotated) {
            return self.constraint.width;
        } else {
            return self.constraint.height;
        }
    };
}

exports.Item = Item;

/**
 * Rectangular sheet containing arranged items.
 * @constructor
 */
function Pattern(width, height) {
    var self = this;

    self.x = 0;
    self.y = 0;
    self.width = width;
    self.height = height;
    self.surface = self.width * self.height;
    self.excludedBins = [];
    self.parent = null;
    self.items = [];

    /**
     * Returns the root parent.
     */
    self.getMainParent = function() {
        if (self.parent) {
            return self.parent.getMainParent();
        } else {
            return self;
        }
    };

    /**
     * Returns 1 if it fits without rotation, -1 if it fits with rotation and 0 if it doesn't fit.
     */
    self.testFit = function(item) {
        if (item.constraint.width <= self.width && item.constraint.height <= self.height) {
            return 1;
        } else if (item.constraint.height <= self.width && item.constraint.width <= self.height) {
            return -1;
        } else {
            return 0;
        }
    };

    /**
     * Returns an array containing 2 couples of bins resulting of the cut, with exclusions.
     */
    self.cutToBins = function(cutWidth, cutHeight) {
        var bins = [];
        
        // Bottom full width
        var p1 = new Pattern(self.width, self.height - cutHeight);
        p1.parent = self;
        p1.x = self.x;
        p1.y = self.y + cutHeight;
        bins.push(p1);
        
        // Left cut height
        var p2 = new Pattern(self.width - cutWidth, cutHeight);
        p2.parent = self;
        p2.x = self.x + cutWidth;
        p2.y = self.y;
        bins.push(p2);
        
        // Bottom cut width
        var p3 = new Pattern(cutWidth, self.height - cutHeight);
        p3.parent = self;
        p3.x = self.x;
        p3.y = self.y + cutHeight;
        bins.push(p3);
        
        // Left full height
        var p4 = new Pattern(self.width - cutWidth, self.height);
        p4.parent = self;
        p4.x = self.x + cutWidth;
        p4.y = self.y;
        bins.push(p4);
        
        // Exclusions
        p1.excludedBins = p2.excludedBins = [p3, p4];
        p3.excludedBins = p4.excludedBins = [p1, p2];
        
        return bins;
    };
}

exports.Pattern = Pattern;

/**
 * Return the first bin where the item can be placed
 */
function getFittingBin(item, bins){
    var i, testFit;
    for(i in bins) {
        testFit = bins[i].testFit(item);
        if(testFit > 0){ 
            item.rotated = false;
            return bins[i];
        } else if(testFit < 0) {
            item.rotated = true;
            return bins[i];
        }
    }
    return null;
};

function placeItem(item, bin){
    item.pattern = bin.getMainParent();
    item.pattern.items.push(item);
    item.x = bin.x;
    item.y = bin.y;
    return bin.cutToBins(item.getRotatedWidth(), item.getRotatedHeight());
};

/**
 * Order bins by decreasing surface
 * @param Pattern[]
 */
function sortBins(bins) {
    return bins.sort(function(bin1, bin2) {

        if (bin1.surface > bin2.surface) {
            return 1;
        }

        if (bin1.surface < bin2.surface) {
            return -1;
        }

        // a must be equal to b
        return 0;
    });
};



/**
 * Options exemple
 */
var exampleOptions = {
    pattern: {
        width: 100,
        height: 40,
        max: 10
    }
};

/**
 * Arrange items in several patterns, minimizing pattern number.
 * @param Array
 * @param Object
 */
exports.pack = function(items, options) {

    var finalPatterns = [];
    var availableBins = [];
    
    // Place all the items in bins
    var currentItem, choosenBin, excludedBin;
    for(var i in items) {
        currentItem = items[i];
        
        // Sort bins
        availableBins = sortBins(availableBins);
        
        // Find a fitting bin
        choosenBin = getFittingBin(currentItem, availableBins);
        if(!choosenBin) {
            // New pattern
            if(finalPatterns.length == options.pattern.max) {
                console.log("max pattern count error");
                return null;
            }
            choosenBin = new Pattern(options.pattern.width, options.pattern.height);
            if(choosenBin.testFit(currentItem) < 0) {
                currentItem.rotated = true;
            }
            finalPatterns.push(choosenBin);
        } else {
            // Remove the bin from available list
            availableBins.splice(availableBins.indexOf(choosenBin), 1);
            
            // Remove the excluded bins from available list
            for(var eb in choosenBin.excludedBins) {
                excludedBin = choosenBin.excludedBins[eb];
                availableBins.splice(availableBins.indexOf(excludedBin), 1);
            }
        }
        
        // Add new bins
        var newBins = placeItem(currentItem, choosenBin);
        availableBins = availableBins.concat(newBins);
    }
    
    return finalPatterns;
};