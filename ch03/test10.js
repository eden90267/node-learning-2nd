var fs = require('fs'),
    async = require('async');

async.parallel({
    data1: function(callback) {
        fs.readFile('./data/fruit1.txt', 'utf8', function(err, data) {
            callback(err, data);
        });
    },
    data2: function(callback) {
        fs.readFile('./data/fruit2.txt', 'utf8', function(err, data) {
            callback(err, data);
        });
    },
    data3: function(callback) {
        fs.readFile('./data/fruit3.txt', 'utf8', function(err, data) {
            callback(err, data);
        });
    }
}, function(err, result) {
    if (err) return console.log(err.message);
    console.log(result); // { data1: 'apples', data2: 'oranges', data3: 'peaches' }
});