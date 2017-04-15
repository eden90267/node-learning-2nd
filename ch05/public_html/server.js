var http = require('http'),
    fs = require('fs'),
    mime = require('mime'),
    path = require('path');

// 可使用預定義的__dirname作為指定Node應用程式工作目錄的方式
// 若不是範例中存取與Node應用程式不同位置的檔案，你應該使用__dirname
// var base = '/Users/eden90267/Desktop/node-learning-2nd/ch05/public_html';

http.createServer(function (req, res) {
    var pathname =
        // path.normalize(base + req.url);
        path.normalize(__dirname + req.url);
    console.log(pathname);

    fs.stat(pathname, function (err, stats) {
        if (err) {
            res.writeHead(404);
            res.write('Resource missing 404\n');
            res.end();
        } else if (stats.isFile()) {
            // 內容型別
            var type = mime.lookup(pathname);
            console.log(type);
            res.setHeader('Content-Type', type);

            // 建構並導向可讀串流
            var file = fs.createReadStream(pathname);
            file.on("open", function () {
                // 200表示沒有錯誤
                res.statusCode = 200;
                file.pipe(res);
            });
            file.on("error", function (err) {
                console.log(err);
                res.writeHead(403); // 403：權限拒絕
                res.write('file permission');
                res.end();
            });
        } else {
            res.writeHead(403);
            res.write('Directory access is forbidden');
            res.end();
        }
    });

}).listen(8124);

console.log(`Server web running at 8124`);