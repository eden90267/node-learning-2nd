# Node環境

## 以Node說Hello World

```
/**
 * Created by eden90267 on 2017/4/6.
 */
var http = require('http');

const port = 8124;

http
    .createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World\n');
    })
    .listen(port, function () {
        console.log(`Server running at http://127.0.0.1:${port}`);
    });
```

http模組以`require`陳述匯入，並指派給一個區域變數。`http.createServer()`函式初始化網頁伺服器。函式的參數中，我們看到一個基本結構：**callback**。它是傳遞網頁請求與回應給程式碼以處理網頁請求並提供回應的不具名函式。

JavaScript是單執行緒的，而Node在單執行緒環境中透過**事件迴圈**與特定事件發生時會觸發的callback函式來模擬非同步環境。上述範例，當收到網頁請求，callback就會被呼叫。

### 修改Hello World

```
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
```

應用程式引入了新模組，名稱為`fs`，這是File System模組。還有匯入另一個模組：`let name = require('url').parse(req.url, true).query.name;`，匯出的模組屬性可以鏈接，因此可在同一行匯入模組並使用它的函式。這經常發生在URL模組，它的目的只是提供URL功能。

fs.stat()方法不只檢驗檔案是否存在，還會回傳檔案資訊物件，其中包括檔案大小，此值用於建構header。

如果檔案不存在，應用程式會優雅的處理這種狀況：它會發出友善的訊息表示檔案不存在(`console.error()`)。

如果檔案存在，則讀取圖形到變數中並在回應中回傳，同時調整header的對應值。

`fs.readFileSync()`?在某些情況下，不管用哪種函式，檔案I/O可能不會影響效能，且同步版比較清楚與容易使用。它也會產生較少套疊的程式。

可對同步函式使用例外處理`try...catch`，對非同步函式無法使用這種較傳統的錯誤處理。

第二個範例重點是並非所有的Node的I/O是非同步的。

### Node命令列選項

```
$ node --help
Usage: node [options] [ -e script | script.js ] [arguments]
       node debug script.js [arguments]
```

```
$ node -v
v7.7.1
```

要檢查Node應用程式的語法，使用`-c`選項。它會檢查語法而不執行應用程式：

```
$ node -c or --check hello.js
```

檢視V8選項：

```
$ node --v8-options
```

這會回傳幾個不同的選項，包括`--harmony`選項，用於開啟所有Harmony JavaScript功能。這包括有實作但尚未進入LTS或Current版本的ES6功能。

最喜歡的Node選項是`-p`或`--print`，它可以對一行Node腳本求值並輸出結果。這在檢查環境變數時特別有用。以下是個範例，它輸出process.env屬性的所有值：

```
$ node -p "process.env"
```

## Node運行環境

### 在你的伺服器、VPS或服務廠商的主機運行Node

### 雲端運行服務

## Node的LTS與升級

Node 4.0 是 原始Node 1.0 + io.js的3.0版。

### Node的新版本編號

根據Linux使用者熟悉的Semver嚴格制定的Node版本釋出時間表。Semver版本編號有三群數字，各具有特定的意義。

LTS：Long Term Support

策略為每隔六個月釋出新的Stable(現在稱為Current)，但每隔兩次才有LTS。

### 升級Node

套件安裝程序：

```
sudo apt-get update
sudo apt-get upgrade --show-upgraded
```

也可使用npm來升級Node

```
sudo npm cache clean -f
sudo npm install -g
sudo n stable
```

要在Windows、OS X、或Raspberry Pi上安裝最新版的Node，從Node.js下載安裝程序並執行，它會以新版蓋過舊版。

Node version Manager：Linux與OS X環境中，你也可以使用Node Version Manager(nvm)工具來更新Node。

可用下列命令更新所有Node模組：

```
sudo npm update -g
```

## Node、V8 與 ES6

Node背後是JavaScript引擎，大部分的實作使用的引擎是V8，它是Google為Chrome所設計，原始碼在2008開源。

V8 JavaScript引擎以just-in-time(JIT)編譯器將JavaScript編譯成機械碼而非多年來JavaScript一般的直譯以提升JavaScript的速度。V8引擎是以C++撰寫。

之前的Node要使用新的ES6功能時必須在執行應用程式時使用harmony旗標(--harmony)

```
node --harmony app.js
```

現在ES6功能之源依據下列條件決定：

- 所有V8的**穩定版**功能在Node.js預設為開啟，不需任何執行旗標
- V8團隊認為幾近完成但非**穩定版**的階段功能需要執行旗標：`--es_staging`(or 同義的`--harmony`)
- 開發中的功能可透過相對應的harmony旗標(ex：`--harmony_destructuring`)個別啟用，但除了測試目的外並不鼓勵這麼做

Node有直接支援的ES6(v4)：

- Classes
- Promises
- Symbols
- Arrow Function
- Generators
- Collections
- let
- spread operator

## 進階：Node的C/C++附加元件

熟C/C++可用來建構附加元件以擴充Node功能。

寫好程式，必須使用`node-gyp`工具實際將它編譯成.node附加元件檔案。

若不熟悉C/C++，可使用JavaScript建構模組。

Native Abstractions for Node.js(NAN)，此檔案可幫助緩和不同版本Node.js間的差異。