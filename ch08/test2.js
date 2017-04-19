var spawn = require('child_process').spawn,
    find = spawn('find', ['.', '-ls']),
    grep = spawn('grep', ['test']);

grep.stdout.setEncoding('utf8');

// 將find輸出導向grep導入
find.stdout.pipe(grep.stdin);

// 執行grep並輸出結果
grep.stdout.on('data', function(data) {
    console.log(data);
});

// 錯誤處理
find.stderr.on('data', function(data) {
    console.log(`find stderr: ${data}`);
});
grep.stderr.on('data', function(data) {
    console.log(`grep stderr: ${data}`);
});

// 結束處理
find.on('close', function(code) {
    if (code !== 0) {
        console.log(`find process exited with code ${code}`);
    }
});
grep.on('close', function(code) {
    if (code !== 0) {
        console.log(`grep process exited with code ${code}`);
    }
});