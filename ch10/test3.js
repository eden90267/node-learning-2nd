var net = require('net');
var redis = require('redis');

var server = net.createServer(function (conn) {
    console.log(`connected`);

    // 建構Redis用戶端
    var client = redis.createClient();

    client.on('error', function (err) {
        console.log(`Error ${err}`);
    });

    // 第六個資料庫是圖檔佇列
    client.select(6);
    // 傾聽資料
    conn.on('data', function (data) {
        console.log(`${data} from ${conn.remoteAddress} ${conn.remotePort}`);

        // 儲存資料
        client.rpush('images', data);
    });
}).listen(3000);

server.on('close', function(err) {
    client.quit();
});

console.log(`listening on port 3000`);