var net = require('net');
const PORT = 8124;

var server = net.createServer(function (conn) {
    console.log(`connected`);

    // 收到資料
    conn.on('data', function (data) {
        console.log(data + ' from ' + conn.remoteAddress + ' ' + conn.remotePort);
        conn.write('Repeating: ' + data);
    });

    // 用戶端關閉連線
    conn.on('close', function () {
        console.log(`client closed connection`);
    });

}).listen(PORT);

server.on('listening', function () {
    console.log(`listening on ${PORT}`);
});

server.on('error', function (err) {
    if (err.code == 'EADDRINUSE') {
        console.warn('Address in use, retrying...');
        setTimeout(() => {
            server.close();
            server.listen(PORT);
        }, 1000);
    } else {
        console.error(err);
    }
});