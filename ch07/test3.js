var net = require('net'),
    fs = require('fs');

const unixsocket = '/somepath/nodesocket';

var server = net.createServer(function (conn) {
    console.log(`connected`);

    conn.on('data', function (data) {
        conn.write('Repeating: ' + data);
    });

    conn.on('close', function () {
        console.log(`client closed connection`);
    });
}).listen(unixsocket);

server.on('listening', function () {
    console.log(`listening on ${unixsocket}`);
});

// 若結束並重新啟動，必須切斷socket連結
server.on('error', function (err) {
    if (err.code == 'EADDRINUSE') {
        fs.unlink(unixsocket, function () {
            server.listen(unixsocket);
        });
    } else {
        console.log(err);
    }
});

// 使用process處理非由應用程式管理的例外
process.on('uncaughtException', function (err) {
    console.log(err);
});