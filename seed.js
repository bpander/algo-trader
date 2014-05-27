var mysql = require('mysql');
var Oanda = require('./Oanda');
var Q = require('Q');

var CONFIG = {
    INSTRUMENT: 'EUR_USD',
    GRANULARITY: 'M5',
    START: new Date('1 Jan 2011'),
    END: new Date(),
    MYSQL: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'root',
        database: 'automated-trader'
    }
};

var connection = mysql.createConnection(CONFIG.MYSQL);
var table = CONFIG.INSTRUMENT + '_' + CONFIG.GRANULARITY;

var seed = function () {
    var dfd = Q.defer();
    var start = CONFIG.START;
    var numRecordsCreated = 0;
    var fetch = function () {
        var query = '';
        var inserts = [];
        Oanda.request({
            qs: {
                instrument: CONFIG.INSTRUMENT,
                granularity: CONFIG.GRANULARITY,
                start: start.toISOString(),
                includeFirst: false
            }
        }).then(function (response) {
            if (response.candles.length === 0 || (start = new Date(response.candles[response.candles.length - 1].time)) > CONFIG.END) {
                dfd.resolve(numRecordsCreated);
                return;
            } else {
                query = 'INSERT INTO ' + table + ' VALUES ';
                inserts = [];
                console.log('Calling fetch again from', start);
                response.candles.forEach(function (candle) {
                    inserts.push('("' + candle.time + '",' + candle.closeBid + ',' + candle.closeAsk + ')');
                });
                query = query + inserts.join(',');
                connection.query(query, function (error, response) {
                    if (error) {
                        dfd.reject(error);
                    } else {
                        numRecordsCreated = numRecordsCreated + response.affectedRows;
                        fetch();
                    }
                });
            }
        }, function (error) {
            dfd.reject(error);
        });
    };
    connection.query('' +
        'CREATE TABLE IF NOT EXISTS ' + table + ' (' +
            'time varchar(60) NOT NULL,' +
            'closeBid float NOT NULL,' +
            'closeAsk float NOT NULL' +
        ')' +
    '', function (error) {
        if (error) {
            dfd.reject(error);
        } else {
            fetch();
        }
    });
    return dfd.promise;
};



seed().then(function (numRecordsCreated) {
    console.log('Finished with', numRecordsCreated, 'records created');
    connection.end();
}, function (error) {
    console.log('ERROR:', error);
    connection.end();
});
