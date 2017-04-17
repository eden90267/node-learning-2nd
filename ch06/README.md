# Node與本機系統

這一章提供File System更正規介紹。此外，還會更深入檢視OS特定功能與差異。最後，會討論ReadLine與ZLib兩個模組，他們提供互動的命令列通訊與壓縮功能。

## 探索作業系統

某些技術嘗試隱藏作業系統的差異，而其他技術需大量工作來管理特定OS的特質。Node介於其中。通常你可以建構應用程式並在各處執行，但有時會出現OS差別。Node有時成功，有時需要第三方模組幫助。

直接存取作業系統資訊，可透過OS核心模組。它是實用的工具，幫助我們建構跨平台應用程式。它還能提供目前環境的資源使用量與容量資訊。

OS模組的功能只是提供資訊。舉例來說，如果想確保跨平台功能，你可檢查系統的行結束字元、檢查系統是big-endian(BE)或little-endian(LE)、並直接存取暫存目錄與home目錄：

```
var os = require('os');

console.log(`Using end of line` + os.EOL + 'to insert a new line');
console.log(os.endianness());
console.log(os.tmpdir());
console.log(os.homedir());
```

ubuntu與windows 10機器為LE，EOL字元：行的第二個部分從新行開始。兩系統差異在於暫存目錄與home目錄。

OS模組還提供檢查可用資源的方法：

```
var os = require('os');

console.log(os.freemem());
console.log(os.loadavg());
console.log(os.totalmem());
```

`os.loadavg()`函式為Unix專用：它是1、5與15分鐘負載平均值，反應系統的活動。要取得百分比，將這三個數字乘以100。

`os.freemen()`與`os.totalmen()`函式回傳以位元組計量的記憶體。

`os.cpus()`函式回傳機器的CPU資訊。它回傳CPU花在user、nice、sys、idle與irq的毫秒數。

- user：CPU花在執行使用者行程的時間量
- idle：CPU閒置量
- sys：CPU花在執行系統行程(核心)的時間量
- nice：反映有多少使用者行程被nice：調整優先權以讓行程不要經常執行
- irq：硬體層級的插斷請求

可加總所有值然後找出每個百分比。也可使用提供百分比以及其他資訊的第三方模組。

## 串流與管道

Node核心運用串流技術提供HTTP與其他形式的網路功能，它也提供File System功能。因此我們在深入File System前先討論它。

串流物件是抽象介面，這表示你不會直接建構串流，相對的，你會使用實作串流的物件：例如HTTP請求、File System讀取與寫入串流、ZLib壓縮、或process.stdout。唯一需要實作串流API時機是建構自訂串流。

由於Node有很多物件實作串流介面，Node所有串流都有共同基本功能：

- 可使用`setEncoding`改變串流資料的編碼
- 可檢查串流是否可讀可寫
- 擷取串流物件，像是**接收資料**或是**連線關閉**，還可加上callback函式
- 可暫停與恢復串流
- 可串聯可讀串流與可寫串流資料

注意可讀與可寫或可讀寫的項目，後者稱為**雙工**串流。還有一種稱為轉換的雙工串流，其輸出入具有關聯，這種串流在ZLib壓縮，稍後討論。

可讀串流從暫停模式開始，這表示沒有發送資料直到發生某種讀取(`stream.read()`)或恢復(`stream.resume()`)命令。但File System的可讀串流等實作在我們撰寫資料事件時轉換為流模式(對可讀串流存取資料的方式)。在流模式中，資料可用時隨即發送給應用程式。

可讀串流支援幾個事件，通常只關注三個事件；

- 資料事件：有新資料就緒時發生
- 結束事件：所有資料被消耗掉後發生
- 錯誤事件：發生錯誤時發生

可寫串流是發送(寫入)資料的目的地。我們傾聽的事件有`error`，以及呼叫`end()`方法且所有資料已經送出後的`finish`。另一可能事件是`drain`，發生於嘗試寫入資料而回傳false時。

雙工串流具有可讀與可寫串流元素。轉換串流是一種雙工串流一與互相獨立的內部輸出入緩衝區的雙工串流不同
一轉換串流直接連接兩者，中間加上資料轉換步驟。在底層，轉換串流必須實作`_transform()`函式，它對輸入資料做一些動作後推給輸出。

為進一步認識轉換串流，必須深入檢視所有串流都支援的功能：`pipe()`函式。

```
// 建構並連接可讀串流
var file = fs.createReadStream(pathname);
file.on("open", function(){
    file.pipe(res);
});
```

`pipe()`任務是從檔案(串流)取出資料並輸出給`http.ServerResponse`物件。此物件實作可寫串流介面並看到`fs.createReadStream()`回傳`fs.ReadStream`，它是可讀串流的實作。可讀串流支援的方法之一是`pipe()`給可寫串流。

以下是轉換串流的示範：

```
var gzip = zlib.createGzip();
var fs = require('fs');
var inp = fs.createReadStream('input.txt');
var out = fs.createWriteStream('input.txt.gz');

inp.pipe(gzip).pipe(out);
```

輸入是可讀串流，而輸出是可寫串流。一個串流的內容連接到另一個串流，但先經過壓縮程序。這就是轉換。

## File System 的正式介紹

File System是一組POSIX函式的包裝。這表示它支援POSIX標準化(跨平台相容)檔案系統存取功能。應用程式可在OS X、Linux與Windows上執行，還包括Android與Raspberry Pi等新環境與電腦。

File System模組提供同步版本與傳統非同步版本。

非同步版本以錯誤優先的callback作為最後一個參數，而同步函式在錯誤發生時立即拋出錯誤。你可使用傳統的`try...catch`操作同步化File System函式。對非同步版本則存取錯誤物件。接下來這節內容會focus在非同步函式。要注意這些函式還是有同步版本。

除了各種函式外，File System支援四種類別：

- fs.FSWatcher

    支援檔案異動事件

- fs.ReadStream

    可讀串流

- fs.WriteStream

    可寫串流

- fs.Stats

    從*stat函式回傳的資訊

### fs.Stats類別

`fs.stat()`、`fs.lstat()`與`fs.fstat()`回傳`fs.Stats`物件，可用來檢查檔案(or 目錄)是否存在，還回傳物件是否為檔案或目錄、UNIX網域socket、檔案權限、上次存取或修改時間等資訊。Node提供一些函式來存取資訊，例如fs.isFile()與fs.isDirectory()來檢查物件是檔案或目錄。也可如下存取狀態資料：

```
var fs = require('fs');
var util = require('util');

fs.stat('./phoenix5a.png', function(err, stats) {
    if (err) return console.log(err);
    console.log(util.inspect(stats));
});
```

在Windows取回的資料結構如下：

```
Stats {
  dev: 41226322,
  mode: 33206,
  nlink: 1,
  uid: 0,
  gid: 0,
  rdev: 0,
  blksize: undefined,
  ino: 99360666779254880,
  size: 225434,
  blocks: undefined,
  atime: 2017-04-17T07:59:28.156Z,
  mtime: 2017-04-17T07:59:28.159Z,
  ctime: 2017-04-17T07:59:28.160Z,
  birthtime: 2017-04-17T07:59:28.156Z }
```

這基本上就是POSIX的stat()函式的輸出，它回傳檔案的狀態。size為位元組數，blksize是作業系統區塊大小，blocks是物件區塊數量。後兩者windows上為undefined。

mode，此值是帶有物件的權限，問題是看不懂。

此時需要呼叫輔助函式(Node輔助模組)。`stat-mode`模組的目的是讓我們直接查詢fs.stat()等函式回傳的stat物件。範例示範如何使用它來擷取檔案權限資訊。

```
$ npm install stat-mode
```

```
var fs = require('fs');
var Mode = require('stat-mode');

fs.stat('./phoenix5a.png', function(err, stats) {
    if (err) return console.log(err);

    // 取得檔案權限
    var mode = new Mode(stats);
    console.log(mode.toString());
    console.log(`Group execute ` + mode.group.execute);
    console.log(`Others write ` + mode.others.write);
    console.log(`Owner read ` + mode.owner.read);
})
```

結果：

```
-rw-rw-rw-
Group execute false
Others write true
Owner read true
```

### 檔案系統的監聽器

"傾聽"檔案或目錄異動並在發生異動時執行一些工作的應用程式不算罕見。`fs.FSWatcher`是Node處理此工作的介面。但它在跨平台上不一致且不實用。

我們會忽略它與回傳該物件的`fs.watch()`。相對的，我們要檢視第三方模組：[Chokidar](https://github.com/paulmillr/chokidar)模組(Gulp也有用到它)。

```
npm install chokidar
```

下面程式碼會在目前目錄加上監視器。它會檢測目錄異動，包括檔案異動。它執行遞迴檢測，找出新的子目錄與旗下的新檔案。原始事件挑出所有事件，而其他事件處理程序則檢測高階事件。

```
var chokidar = require('chokidar');

var watcher = chokidar.watch('.', {
    ignored: /[\/\\]\./,
    persistent: true
});

var log = console.log.bind(console);

watcher
    .on('add', function (path) {
        log('File', path, 'has been added');
    })
    .on('unlink', function (path) {
        log('File', path, 'has been removed');
    })
    .on('addDir', function (path) {
        log('Directory', path, 'has been added');
    })
    .on('unlinkDir', function (path) {
        log('Directory', path, 'has been removed');
    })
    .on('error', function (error) {
        log('Error happened', error);
    })
    .on('ready', function () {
        log('Initial scan complete. Ready for changes');
    })
    .on('raw', function (event, path, details) {
        log('Raw event info:', event, path, details);
    });

watcher.on('change', function (path, stats) {
    if (stats) log('File', path, 'changed size to', stats.size);
})
```