/**
 * Created by eden90267 on 2017/4/6.
 */
const http = require('http');
const fs = require('fs');

const port = 8124;

http.createServer(function(req, res) {
    let name = require('url').parse(req.url, true).query.name;
    if (name === undefined) name = 'world';
    if (name === 'burningbird') {
        var file = 'phoenix5a.png';
        fs.stat(file, function(err, stat) {
            if (err) {
                console.error(err);
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end("Sorry, Burningbird isn't around right now \n");
            } else {
                const img = fs.readFileSync(file);
                res.contentType = 'image/png';
                res.contentLength = stat.size;
                res.end(img, 'binary');
            }
        });
    } else {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(`Hello ${name}\n`);
    }
}).listen(port, function() {
    console.log(`Server running at port ${port}`);
})