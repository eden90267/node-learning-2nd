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

### 讀寫檔案

File System模組的範例使用非串流的讀寫方法，以這種非串流功能讀寫檔案有兩種方式：

第一種：`fs.readFile()`或`fs.writeFile()`方法(or同步化版本)。這些函式開啟檔案、讀寫、然後關閉檔案。

```
var fs = require('fs');

fs.writeFile('./some.txt', 'Writing to a file', function(err) {
    if (err) return console.error(err);
    fs.readFile('./some.txt', 'utf-8', function(err, data) {
        if (err) return console.error(err);
        console.log(data);
    });
});
```

由於檔案輸出入會經由緩衝區(Buffer)，在讀取檔案時使用'utf-8'選項作為fs.readFile()函式的第二個參數。也可將緩衝區轉換成字串。

第二種：開啟檔案並指派一個檔案描述(fd)。使用檔案描述來讀寫檔案。這種方式的好處是更能控制檔案如何開啟與操作。

下列程式建構一個檔案、寫入、然後讀取。`fs.open()`函式的第二個參數是決定可以對檔案做的動作的旗標，此例中的'a+'開啟檔案供增添與讀取，若檔案不存在則建構檔案。第三個參數設定檔案的權限(允許讀寫)。

```
"use strict"

var fs = require('fs');

fs.open('./new.txt', 'a+', 0x766, function (err, fd) {
    if (err) return console.error(err);
    fs.write(fd, 'First line', 'utf-8', function (err, written, str) {
        if (err) return console.error(err);
        var buf = new Buffer(written);
        fs.read(fd, buf, 0, written, 0, function(err, bytes, buffer) {
            if (err) return console.error(err);
            console.log(buffer.toString('utf-8'));
        });
    });
});
```

檔案描述從callback回傳然後用於`fs.write()`函式。字串從位置0寫入檔案。根據Node文件，Linux檔案以增添模式開啟時一定會寫入檔案最後(忽略位置指示)。

`fs.write()`的callback函式回傳錯誤(如果發生)、寫入的位元組數，與寫入的字串。最後，fs.read()用於讀取行到緩衝區中，然後輸出到控制台。

除了檔案，你也可以操控目錄。

### 存取與維護目錄

你可建構目錄、刪除目錄、讀取目錄下的檔案。你也可以建構檔案的符號連結，或切斷連結來刪除它(只要沒程式開啟它)。如果要裁剪檔案(使其大小為零)，可使用`truncate()`，這樣會留下檔案但刪除內容。

下列程式列出目前目錄的檔案，如果是壓縮檔它們會被切斷連結。此任務以“以Path存取資源”的Path模組簡化：

```
'use strict';

var fs = require('fs');
var path = require('path');

fs.readdir('./', function(err, files) {
    for (let file of files) {
        console.log(file);
        if (path.extname(file) == '.gz') {
            fs.unlink('./' + file);
        }
    }
});
```

### 檔案串流

可使用`fs.createReadStream()`建構可讀串流，傳入路徑與options物件，或在選項中指定檔案描述並設定path為空。這也適用於`fs.createWriteStream()`建構的可寫串流。

預設，可讀串流以下列選項建構：

```
{
  flags: 'r',
  encoding: null,
  fd: null,
  mode: 0o666,
  autoClose: true
}
```

如果想使用檔案描述，可在選項中設定。autoClose選項自動地在完成讀取後關閉檔案。如果想要讀取檔案的一段內容，可使用選項的start與end設定開始與結束(以位元組計)。你可指定'utf-8'或其他編碼，但也可以在之後使用`setEncoding()`設定。

可寫串流的預設選項：

```
{
  flags: 'w',
  defaultEncoding: 'utf8',
  fd: null,
  mode: 0o666
}
```

同樣，可使用檔案描述代替路徑。可寫串流的編碼以defaultEncoding而非encoding設定。如果想要寫入特定檔案位置，可設定start選項。不指定end選項是因為寫入結束就結束。

範例：可寫串流開啟檔案供修改。修改的動作是插入字串到檔案指定位置。此例使用檔案描述，這表示應用程式呼叫fs.createWriteStream()時，它不會與建構可寫串流同時初始化檔案開啟。

```
var fs = require('fs');

fs.open('./working.txt', 'r+', function(err, fd) {
    if (err) return console.error(err);

    var writable = fs.createWriteStream(null, {
        fd: fd,
        start: 10,
        defaultEncoding: 'utf8'
    });

    writable.write(' inserting this text ');
});
```

注意檔案以r+旗標開啟，這讓應用程式可讀可修改檔案。

範例：開啟同個檔案，這次是讀取內容。使用預設的r旗標，因只是讀取檔案。但使用了setEncoding()將編碼改為utf-8：

```
var fs = require('fs');

var readable =
    fs.createReadStream('./working.txt').setEncoding('utf8');

var data = '';
readable.on('data', function(chunk) {
    data += chunk;
});

readable.on('end', function() {
    console.log(data);
});
```

現在若開啟檔案供讀取並連接結果到可寫串流可節省時間。可使用`pipe()`函式。但不能中途修改結果，因為可寫串流：只可寫。它不是雙工串流或可修改內容的轉換串流。但你可以複製檔案的內容到另一邊檔案。

```
var fs = require('fs');

var readable = fs.createReadStream('./working.txt');
var writable = fs.createWriteStream('./working2.txt');

readable.pipe(writable);
```

## 以 Path 存取資源

Node的Path工具模組是一種從檔案系統路徑轉換與擷取資料的方式，它還提供處理檔案系統路徑的環境中立方式，因此無須分別編寫Linux與Windows模組。

之前在遍歷目錄下的檔案以擷取副檔名看過擷取功能：

```
'use strict';

var fs = require('fs');
var path = require('path');

fs.readdir('./', function(err, files) {
    for (let file of files) {
        console.log(file);
        if (path.extname(file) == '.gz') {
            fs.unlink('./' + file);
        }
    }
});
```

想取得檔案名稱：

```
var fs = require('fs'),
    path = require('path');

fs.readdir('./', function (err, files) {
    for (let file of files) {
        let ext = path.extname(file);
        let base = path.basename(file);
        console.log(`file ${base} with extension of ${ext}`);
    }
});
```

`path.basename()`結果的第二個參數回傳沒有副檔名的檔案名稱。

Path的環境中立的一個例子是`path.delimeter`屬性，它是系統的分隔字。在Linux是冒號(:)，在windows中則為分號(;)。如果想在應用程式中拆解PATH環境變數值供各種作業系統操作，可使用`Path.delimeter`：

```
var path = require('path');

console.log(process.env.PATH);
console.log(process.env.PATH.split(path.delimiter));
```

現在後者回傳的PATH變數陣列可用於各種環境。

不同系統另一個差別是使用斜線(Linux)與反斜線(Windows)。使用`path.normalize()`讓應用程式的檔案路徑設置可在兩種中運行：

```
pathname = path.normalize(base + req.url);
```

Path模組的重點不在於它可執行我們使用String物件或RegExp也可以做到的字串轉換，而是它以**不可知論**(**作業系統中立**)的方式轉換檔案系統路徑。

如果想要解析檔案系統路徑成個別元件，可使用`path.parse()`函式，結果視作業系統有所不同。

```
var path = require('path');

console.log(path.parse(__filename));
```

結果：

```
{ root: '/',
  dir: '/Users/eden90267/Desktop/node-learning-2nd/ch06',
  base: 'test14.js',
  ext: '.js',
  name: 'test14' }
```

## 建構命令列工具

在Unix環境，你可建構直接執行而無須使用node命令的Node應用程式。

※ 建構Windows命令列工具，必須建構帶有呼叫Node與應用程式的批次檔。

為示範，會使用Commander模組與存取ImageMagick這個圖形工具的**子行程**。

此應用程式，使用ImageMagick將圖檔加上Polaroid效果，儲存到新的檔案中。如範例，使用Commander來處理命令列參數並提供使用此工具的輔助說明。

```
#!/usr/bin/env node

var spawn = require('child_process').spawn;
var program = require('commander');

program
    .version('0.0.1')
    .option('-s, --source [file name]', 'Source graphic file name')
    .option('-f, --file [file name]', 'Resulting file name')
    .parse(process.argv);

if ((program.source === undefined) || (program.file === undefined)) {
    console.error('source and file must be provided');
    process.exit();
}

var photo = program.source;
var file = program.file;

// 轉換陣列
var opts = [
    photo,
    "-bordercolor", "snow",
    "-border", "20",
    "-background", "gray60",
    "-background", "none",
    "-rotate", 6,
    "-background", "black",
    "(", "+clone", "-shadow", "60x8+8+8", ")",
    "+swap",
    "-background", "none",
    "-thumbnail", "240x240",
    "-flatten",
    file
];

var im = spawn('convert', opts);
im.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
});

im.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});
```

為將它轉換成命令列工具，檔案頂端加上這個：

```
#!/usr/bin/env node
```

"#!"字元稱為shebang，其後應該是用於執行檔案的應用程式，此例中為Node。子目錄是應用程式所在的路徑。

檔案沒加上.js副檔名，以chmod轉換成可執行檔：

```
chmod a+x polaroid
```

現在能以下列命令執行此工具：

```
./polaroid -h

  Usage: polaroid [options]

  Options:

    -h, --help                output usage information
    -V, --version             output the version number
    -s, --source [file name]  Source graphic file name
    -f, --file [file name]    Resulting file name
```

取得工具的補助說明

```
./polaroid -s phoenix5a.png -f phoenix5apolaroid.png
```

以建構Polaroid效果的新圖檔。此工具在可執行的地方執行得很好。(Windows、Mac失敗...)。

建構命令列工具與建構獨立應用程式不同，後者表示要在沒有安裝Node(或其他相依檔案)下安裝該應用程式。

※ 以NW.js建構獨立應用程式：Intel的NW.js(之前稱為node-webkit)。可使用它來包裝你的檔案，然後使用提供此功能的nw.JS執行此套件。

## 以ZLib壓縮/解壓縮

ZLib提供壓縮/解壓縮功能。它是轉換串流：

```
var zlib = require('zlib');
var fs = require('fs');

var gzip = zlib.createGzip();

var inp = fs.createReadStream('./phoenix5a.png');
var out = fs.createWriteStream('./phoenix5a.png.gz');

inp.pipe(gzip).pipe(out);
```

輸入串流直接連接到輸出，中間加上gzip壓縮轉換內容。

Zlib提供zlib或更複雜可控演算法的deflate壓縮。注意，不像zlib可以使用gunzip(或unzip)命令列工具解壓縮，deflate不行。你必須使用Node或其他工具解deflate的壓縮檔案。

以下示範建構兩個命令列工具：壓縮與解壓縮。第一個工具可選擇gzip或deflate。由於需要處理選項，我們會使用Commander模組處理命令列選項：

```
var zlib = require('zlib');
var program = require('commander');
var fs = require('fs');

program
    .version('0.0.1')
    .option('-s, --source [file name]', 'Source File Name')
    .option('-f, --file [file name]', 'Destination File Name')
    .option('-t, --type <mode>', /^(gzip|deflate)$/i)
    .parse(process.argv);

var compress;
if (program.type == 'deflate') {
    compress = zlib.createDeflate();
} else {
    compress = zlib.createGzip();
}

var inp = fs.createReadStream(program.source);
var out = fs.createWriteStream(program.file);

inp.pipe(compress).pipe(out);
```

此工具有趣且有用(特別在沒原生壓縮功能的Windows環境中)，是網路請求中很常見的壓縮技術。 

以下示範如何透過發送壓縮檔給伺服器然後解壓縮。注意發送的資料以分段陣列接收，最終使用`buffer.concat()`建構新的Buffer。因處理是Buffer而非串流，所以無法使用`pipe()`函式。但相對的，使用`zlib.unzip`函式，傳入Buffer與callback函式。此callback函式有錯誤與結果參數，結果也是個Buffer，使用`write()`函式輸出到新建構的可寫串流。為確保區分檔案，使用時間戳記修改檔案名稱。

建構接收壓縮資料並解壓制檔案的網頁伺服器

```
var http = require('http');
var zlib = require('zlib');
var fs = require('fs');

var server = http.createServer().listen(8124);

server.on('request', function(req, res) {
    
    if (req.method == 'POST') {
        var chunks = [];

        req.on('data', function(chunk) {
            chunks.push(chunk);
        });

        req.on('end', function() {
            var buf = Buffer.concat(chunks);
            zlib.unzip(buf, function(err, result) {
                if (err) {
                    res.writeHead(500);
                    res.end();
                    return console.log(`error ` + err);
                }
                var timestamp = Date.now();
                var filename = './done' + timestamp + '.png';
                fs.createWriteStream(filename).write(result);
            });
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Received and undecompressed file\n');
        });
    }
});

console.log(`server listening on 8124`);
```

壓縮檔案並發送網頁請求的用戶端(關鍵在於確保設定正確的Content-Encoding標頭，它應該是'gzip, deflate'。Content-Type也設定為'application/javascript')

```
var http = require('http');
var fs = require('fs');
var zlib = require('zlib');

var gzip = zlib.createGzip();

var options = {
    hostname: 'localhost',
    port: 8124,
    method: 'POST',
    headers: {
        'Content-Type': 'application/javascript',
        'Content-Encoding': 'gzip,deflate'
    }
};

var req = http.request(options, function(res) {
    res.setEncoding('utf8');
    var data = '';
    res.on('data', function(chunk) {
        data += chunk;
    });

    res.on('end', function() {
        console.log(data);
    });

    req.on('error', function(e) {
        console.log(`problem with request: ` + e.message);
    });
});

// 將壓縮檔案以串流發送至伺服器
var readable = fs.createReadStream('./test.png');
readable.pipe(gzip).pipe(req);
```

在記憶體中緩衝檔案會有擴展性問題，因此另一種方式是儲存壓縮檔案、解壓縮、然後刪除壓縮檔。

## pipe 與 readline

最簡單的pipe示範是啟動REPL並輸入下列程式：

```
process.stdin.resume();
process.stdin.pipe(process.stdout);
```

此後所有輸入都會產生回音。

如果想保持開啟輸出串流，傳入`{ end: false }`選項給輸出串流：

```
process.stdin.pipe(process.stdout, {end:false});
```

REPL逐行處理實作：Readline。匯入Readline會啟動不終止的交談。使用下列程式引用：

```
var readline = require('readline');
```

注意一旦匯入此模組，Node的程式不會終止，直到你關閉介面。

範例：使用Readline建構簡單的命令導向使用者介面

```
var readline = require('readline');

// 建構新的介面
var rl = readline.createInterface(process.stdin, process.stdout);

// 問問題
rl.question(">>What is the meaning of life? ", function(answer) {
    console.log(`About the meaning of life, you said ` + answer);
    rl.setPrompt(">> ");
    rl.prompt();
});

// 關閉介面的函式
function closeInterface() {
    rl.close();
    console.log(`Leaving Readline`);
}

// 傾聽.leave
rl.on('line', function(cmd) {
    if (cmd.trim() == '.leave') {
        closeInterface();
        return;
    }
    console.log(`repeating command: ` + cmd);
    rl.prompt();
});

rl.on('close', function() {
    closeInterface();
});
```

執行範例：

```
>>What is the meaning of life? ===
About the meaning of life, you said ===
>> This could be a command
repeating command: This could be a command
>> We could add eval in here and actually run this thing
repeating command: We could add eval in here and actually run this thing
>> And now you know where REPL comes from
repeating command: And now you know where REPL comes from
>> And that using rlwrap replaces this Readline functionality
repeating command: And that using rlwrap replaces this Readline functionality
>> Time to go
repeating command: Time to go
>> .leave
Leaving Readline
Leaving Readline
```

使用rlwrap覆寫REPL的命令列功能

```
env NODE_NO_READLINE=1 rlwrap node
```

一它指示REPL不要使用Node的Readline模組處理命令行，改用rlwrap。