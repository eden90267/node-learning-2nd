var http = require('http');
var querystring = require('querystring');

var server = http.createServer().listen(8124);

server.on('request', function(req, res) {
    var body = '';

    // 添加資料
    req.on('data', function(data) {
        body += data;
    });

    // 傳送資料
    req.on('end', function() {
        var post = querystring.parse(body);
        console.log(post);
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World\n');
    });
});
console.log(`server listening on 8124`);