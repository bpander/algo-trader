'use strict';

var mysql = require('mysql');
var Q = require('Q');
var CandleCollection = require('./CandleCollection');

var CONFIG = {
    INSTRUMENT: 'EUR_USD',
    GRANULARITY: 'M1',
    START: new Date('01 Jan 2015'),
    END: new Date('05 Jan 2015'),
    MYSQL: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'root',
        database: 'automated-trader'
    }
};

var table = CONFIG.INSTRUMENT + '_' + CONFIG.GRANULARITY;
var connection = mysql.createConnection(CONFIG.MYSQL);
var query = 'SELECT * FROM ' + table + ' WHERE time > "' + CONFIG.START.toISOString() + '" AND time < "' + CONFIG.END.toISOString() + '" ORDER BY time';


var MACD = function (candles, fast, slow, signal) {
    var macdSeries = [];
    var i = slow;
    candles.slice(slow).forEach(function (candle) {
        var emaFast = EMA(candles.slice(i - fast, i).map(extractClose));
        var emaSlow = EMA(candles.slice(i - slow, i).map(extractClose));
        var lines = {
            time: candle.time,
            macd: emaFast - emaSlow,
            signal: undefined,
            candle: candle
        };
        macdSeries.push(lines);
        i++;
    });

    i = signal;
    macdSeries.slice(signal).forEach(function (lines) {
        lines.signal = EMA(macdSeries.slice(i - signal, i).map(function (lines) {
            return lines.macd;
        }));
        i++;
    });
    return macdSeries;
};


var backtest = function () {
    var dfd = Q.defer();
    connection.query(query, function (error, rows) {
        if (error) {
            dfd.reject(error);
            return;
        }
        var candleCollection = new CandleCollection(rows);

        dfd.resolve();
    });
    return dfd.promise;
};

backtest().then(function () {
    console.log('SUCCESS');
    connection.end();
}, function (error) {
    console.error('ERROR:', error);
    connection.end();
});