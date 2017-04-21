var spawn = require('child_process').spawn;
var net = require('net');

var client = new net.Socket();
client.setEncoding('utf8');

// 連接TCP伺服器
client.connect('3000', 'examples.burningbird.net', function () {
    console.log(`connected to server`);
});

// 啟動子行程
var logs = spawn('tail', ['-f',
    '/home/main/logs/access.log',
    '/home/tech/logs/access.log',
    '/home/shelleypowers/logs/access.log',
    '/home/green/logs/access.log',
    '/home/puppies/logs/access.log']);

// 處理子行程資料
logs.stdout.setEncoding('utf8');
logs.stdout.on('data', function (data) {

    // 資源URL
    var re = /GET\s(\S+)\sHTTP/g;

    // 檢測圖檔
    var re2 = /\.gif|\.png|\.jpg|.svg/;

    // 擷取URL
    var parts = re.exec(data);
    console.log(parts[1]);

    // 若找到圖檔則儲存
    var tst = re2.test(parts[1]);
    if (tst) {
        client.write(parts[1]);
    }
});

logs.stderr.on('data', function (data) {
    console.log(`stderr: ${data}`);
});

logs.on('exit', function (code) {
    console.log('child process exited with code ' + code);
    client.end();
})