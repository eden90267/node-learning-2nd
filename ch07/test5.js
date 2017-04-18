var dgram = require('dgram');

var client = dgram.createSocket("udp4");

process.stdin.on('data', function (data) {
    console.log(data.toString('utf8'));
    client.send(data, 0, data.length, 8124, "eden.com", function(err, bytes) {
        if (err) return console.error('error: ' + err);
        console.log(`successful`);
    });
});