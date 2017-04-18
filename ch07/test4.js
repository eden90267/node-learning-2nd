var net = require('net'),
    client = new net.Socket();
client.setEncoding('utf8');

// 連接伺服器
client.connect('/somepath/nodesocket', function() {
    console.log(`connected to server`);
    client.write('Who needs a browser to communicate?');
});

// 接收資料時發送給伺服器
process.stdin.on('data', function(data) {
    client.write(data);
});

// 收到返回資料時輸出到控制台
client.on('data', function(data) {
    console.log(data);
});

// 伺服器關閉
client.on('close', function() {
    console.log(`connection is closed`);
});