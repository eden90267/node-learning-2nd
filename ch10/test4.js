var redis = require('redis'),
    http = require('http');

var messageServer = http.createServer();

// 傾聽請求
messageServer.on('request', function (req, res) {

    // 濾掉icon請求
    if (req.url === '/favicon.ico') {
        res.writeHead(200, { 'Content-Type': 'image/x-icon' });
        res.end();
        return;
    }

    // 建構Redis用戶端
    var client = redis.createClient();

    client.on('error', function (err) {
        console.log(`Error ${err}`);
    });

    // 設定圖檔佇列資料庫
    client.select(6);
    client.lpop('images', function (err, reply) {
        if (err) {
            return console.error(`error response ${err}`);
        }

        // 如果有資料
        if (reply) {
            res.write(reply + '\n');
        } else {
            res.write('End of queue\n');
        }
        res.end();
    });
    client.quit();
});

messageServer.listen(8124);

console.log(`listening on 8124`);