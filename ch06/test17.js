var http = require('http');
var zlib = require('zlib');
var fs = require('fs');

var server = http.createServer().listen(8124);

server.on('request', function(req, res) {
    
    if (req.method == 'POST') {
        var chunks = [];

        req.on('data', function(chunk) {
            chunks.push(chunk);
        });

        req.on('end', function() {
            var buf = Buffer.concat(chunks);
            zlib.unzip(buf, function(err, result) {
                if (err) {
                    res.writeHead(500);
                    res.end();
                    return console.log(`error ` + err);
                }
                var timestamp = Date.now();
                var filename = './done' + timestamp + '.png';
                fs.createWriteStream(filename).write(result);
            });
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Received and undecompressed file\n');
        });
    }
});

console.log(`server listening on 8124`);