# 子行程

作業系統提供的功能，大多只能在命令列存取。如果能從Node應用程式中存取這些功能會有多好。這就是**子行程**的作用。

Node能讓我們在子行程中執行系統命令，並傾聽它的輸出入。這包括傳入參數給命令，以及將結果導向另一個命令。

## child_process.spawn

有四種技術可建構子行程，最常見是使用`spawn`方法。此技術在**新的行程**中啟動命令，傳入參數。父應用程式與子行程間會建立stdin、stdout與stderr的管道。

建構子行程呼叫Unix的pwd命令：

```
var spawn = require('child_process').spawn,
    // pwd = spawn('pwd');
    pwd = spawn('pwd', [-g]);

pwd.stdout.on('data', function (data) {
    console.log(`stdout: ${data}`);
});

pwd.stderr.on('data', function (data) {
    console.error(`stderr: ${data}`)
});

pwd.on('close', function (code) {
    console.log(`child process exited with code ${code}`);
})
```

如果沒有發生錯誤，命令列的所有輸出會傳輸到子行程stdout，觸發該行程的data事件。如果發生錯誤，例如傳入無效的選項給命令：

```
var spawn = require('child_process').spawn,
    pwd = spawn('pwd', ['-g']);
```

錯誤會送到stderr：

```
stderr: pwd: illegal option -- g
usage: pwd [-L | -P]

child process exited with code 1
```

此行程以1結束，表示發生錯誤。

stdin? Node的子行程文件有將資料導向stdin的範例，它模擬Unix的管道(|)，讓一個命令的結果直接作為另一個命令的輸入：

```
find . -ls | grep test
```

範例：使用子行程找尋子目錄下名稱帶有“test”的檔案

```
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
```

Node文件有程式內部使用**行緩衝I/O**的警告，這可能會讓送往程式的資料來不及立即消化，意思是某些子行程的資料在處理前以區塊緩衝。grep子行程就是這種行程。

此範例，find行程輸出被限制，因此對grep行程的輸入不會超過區塊大小(通常為4096，但可根據系統與個別設定變化)。

可使用`--line-buffered`選項關閉grep的行緩衝。

下面應用程式一使用`process status`命令檢視執行中的行程，然後搜尋apache2實例一關閉grep行緩衝，資料是立即輸出而非等待填滿緩衝區。

```
var spawn = require('child_process').spawn,
    ps = spawn('ps', ['ax']),
    grep = spawn('grep', ['--line-buffered', 'apache2']);

ps.stdout.pipe(grep.stdin);

ps.stderr.on('data', function (data) {
    console.log(`ps stderr: ${data}`);
});

ps.on('close', function (code) {
    if (code !== 0) console.log(`ps process exited with code ${code}`);
});

grep.stdout.on('data', function (data) {
    console.log('' + data);
});

grep.stderr.on('data', function(data) {
    console.log(`grep stderr: ${data}`);
});

grep.on('close', function(code) {
    if (code !== 0) console.log(`grep process exited with code ${code}`);
});
```

現在輸出沒有緩衝且立即輸出。

`child_process.spawn()`命令預設上不會在shell中執行命令，但從Node 5.7.0與後續版本開始，你可指定shell選項，然後子行程會產生shell給行程。還有其他選項：

- cwd：改變工作目錄
- env：環境鍵/值對陣列
- detached：準備讓子行程與父行程分離
- stdio：子行程的stdio選項陣列

`child_process.spawnSync()`是同一個函式的同步化版本。

### child_process.exec與child_process.execFile

`child_process.exec()`方法類似於`child_process.spawn()`，除了spawn()在程式執行時立即回傳一個串流。`child_process.exec()`函式如同`child_process.execFile()`，將結果緩衝，但exec()產生shell來處理應用程式，不像`child_process.execFile()`直接執行該行程。這讓`child_process.execFile()`比設定shell選項的`child_process.spawn()`或`child_process.exec()`更有效率。

`child_process.exec()`或`child_process.execFile()`第一個參數命令(對exec()來說)或檔案與位置(對execFile())；第二個參數是命令選項；第三個參數是callback函式。callback函式取用三個參數：error、stdout與stderr。如果沒有錯誤則將資料緩衝給stdout。

如果可執行檔案帶有：

```
#!/usr/bin/env node

console.log(global);
```

這下列的應用程式輸出緩衝的結果：

```
var execfile = require('child_process').execFile,
    child;

child = execfile('./app', function (error, stdout, stderr) {
    if (error == null) {
        console.log(`stdout: ${stdout}`);
    }
});
```

也可用`child_process.exec()`完成：

```
var exec = require('child_process').exec,
    child;

child = exec('./app', function(error, stdout, stderr) {
    if (error) return console.error(error);
    console.log(`stdout: ${stdout}`);
});
```

差別在`child_process.exec()`會產生shell，而`child_process.execFile()`不會。

`child_process.exec()`函式有三個參數：命令、options物件，與callback。options物件有數個值，包括行程的encoding、uid、gid。

以下使用第六章的polaroid效果的應用程式在child_process.exec()執行。

```
var exec = require('child_process').exec,
    child;

child = exec('./polaroid -s phoenix5a.png -f phoenixpolaroid.png',
    { cwd: 'snaps' }, function (error, stdout, stderr) {
        if (error) return console.error(error);
        console.log(`stdout: ${stdout}`);
    });
```

`child_process.execFile()`有個額外參數：傳給應用程式的命令列選項陣列。使用此函式的相同應用程式：

```
var execfile = require('child_process').execFile,
    child;

child = execfile('./polaroid',
    ['-s', 'phoenix5a.png', '-f', 'phoenixpolaroid.png'],
    { cwd: 'snaps' }, function (error, stdout, stderr) {
        if (error) return console.error(error);
        console.log(`stdout: ${stdout}`);
    });
```

由於`child_process.execFile()`不會產生shell，在某些情況下不能使用。Node文件有說你不能使用I/O重新導向與使用路徑擴展(透過正規表達式或萬用字元)的檔名替換。

但若你嘗試互動的執行子行程，則使用`child_process.execFile()`替代`child_process.exec()`。

```
'use strict';

const cp = require('child_process');
const child = cp.execFile('node', ['-i'], (err, stdout, stderr) => {
    console.log(stdout);
});

child.stdin.write('process.versions;\n');
child.stdin.end();
```

此應用程式啟動一個互動的Node對談，詢問行程版本然後結束輸入。

兩個函式都有同步化版本：`child_process.execSync()`與`child_process.execFileSync()`。

### child_process_fork

此spawn()的變種會產生Node行程。

`child_process.fork()`行程與其他行程不同處在於實際對子行程建構了通訊通道。注意每個行程需要全新的V8實例，這需要時間與記憶體。

`child_process.fork()`用途之一是產生完全獨立的Node實例。假設有個Node實例執行伺服器，而你想要整合第二個實例來提升請求回應性能。Node文件以TCP伺服器為例。也可以類似方式改為建構平行的HTTP伺服器。

範例中建構主HTTP伺服器，然後使用`child_process.send()`函式發送伺服器給子行程。

```
var cp = require('child_process'),
    cp1 = cp.fork('child2.js'),
    http = require('http');

var server = http.createServer();

server.on('request', function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('handled by parent\n');
});

server.on('listening', function(){
    cp1.send('server', server);
});

server.listen(3000);
```

子行程透過process物件接收訊息與HTTP伺服器。它傾聽連線事件，在接收到事件時觸發子HTTP伺服器的連線事件，傳入組成連線端點的socket。

```
var http = require('http');

var server = http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('handled by child\n');
});

process.on('message', function (msg, httpServer) {
    if (msg === 'server') {
        httpServer.on('connection', function (socket) {
            server.emit('connection', socket);
        });
    }
});
```

如果透過存取埠3000測試，會發現有時由父HTTP伺服器處理請求，有時由子伺服器處理。檢查執行中的行程，你會看到兩個：父與子行程。

※ Node叢集：Node的Cluster模組使用`child_process.fork()`與其他函式。

## 在Windows中執行子行程

Windows必須透過Windows的命令直譯器cmd.exe叫用你想要執行的命令。

作為使用shell選項與新版的child_process.spawn()範例，下面應用程式輸出Windows機器上的目錄內容：

```
var spawn = require('child_process').spawn,
    pwd = spawn('echo', ['%cd%'], { shell: true });

pwd.stdout.on('data', function(data) {
    console.log(`stdout: ${data}`);
});

pwd.stderr.on('data', function(data) {
    console.log(`stderr: ${data}`);
});

pwd.on('close', function() {
    console.log(`child process exited with code ${code}`);
});
```

echo命令輸出Windows的cd命令產生的目前目錄。如果沒有將shell選項設為true，它會失敗。

類似結果可從child_process.exec()取得：

```
var exec = require('child_process').exec,
    pwd = exec('cd');

pwd.stdout.on('data', function (data) {
    console.log(`stdout: ${data}`);
});

pwd.stderr.on('data', function (data) {
    console.log(`stderr: ${data}`);
});

pwd.on('close', function () {
    console.log(`child process exited with code ${code}`);
});
```

示範第三個選項：使用cmd執行Windows命令；其後的參數是真正執行的應用程式：

```
var cmd = require('child_process').spawn('cmd', ['/c', 'dir\n']);

cmd.stdout.on('data', function (data) {
    console.log(`stdout: ${data}`);
});

cmd.stderr.on('data', function (data) {
    console.log(`stderr: ${data}`);
});

cmd.on('close', function () {
    console.log(`child process exited with code ${code}`);
});
```

`/c`旗標作為第一個參數傳給cmd.exe，指示它執行命令然後結束。沒有這旗標，應用程式不會運行。你不會想要告訴cmd.exe執行應用程式然後繼續的`/K`旗標，因為你的應用程式因此不會結束。

使用`child_process.exec()`：

```
var cmd = require('child_process').exec('dir');
```

可使用child_process.execFile()執行cmd或批次檔：

```
@echo off
REM Next command generates a list of program files
dir
```

以下列應用程式執行此檔案：

```
var execfile = require('child_process').execFile,
    child;

child = execfile('my.bat', function (error, stdout, stderr) {
    if (error == null) {
        console.log(`stdout: ${stdout}`);
    }
});
```