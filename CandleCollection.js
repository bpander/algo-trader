'use strict';

function CandleCollection (candles) {

    this.collection = candles;

}


CandleCollection.prototype.add = function (candles) {
    if (candles instanceof Array === false) {
        return this.add([ candles ]);
    }
    this.collection = this.collection.concat(candles);
    return this;
};


CandleCollection.prototype.MACD = function (fast, slow, signal) {

};


CandleCollection.prototype.RSI = function (period) {

};


CandleCollection.prototype.SMA = function (period) {

};


CandleCollection.prototype.EMA = function (period) {

};


module.exports = CandleCollection;
