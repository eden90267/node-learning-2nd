# Node元件：全域物件、事件及非同步本質

瀏覽器上的應用程式與Node.js之間一個基本的差別是二進位資料**緩衝區**。Node現在可存取ES6的ArrayBuffer與具型別的陣列，但Node大部分的二進位資料是以`Buffer`類別實作。

`buffer`是Node的全域物件之一，另一個全域物件是`global`本身。`process`提供Node應用程式與其環境間的橋樑。

事件驅動非同步本質。Node不同處在於我們**等待檔案開啟**，而非使用者點擊按鈕。

事件驅動也意味著timer函式這些老朋友也存在Node中。

## global與process物件

Node兩個基本物件：global與process。

- global類似瀏覽器的全域物件，但有很大不同
- process物件純粹Node專有

### global物件

瀏覽器中，頂層宣告一個變數，它是全域的。Node非如此。當你在Node模組或應用程式宣告一個變數，該變數非全域可用；它受限於該模組或應用程式。可在一個模組中宣告str的“全域”變數並同樣在使用該模組的應用程式中做同樣的宣告，他們不會有衝突。

```
var base = 2;

function addtwo(input) {
    return parseInt(input) + base;
}
```

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>add2</title>
    <script src="add2.js"></script>
</head>
<body>
    <script>
        var base = 10;
        console.log(addtwo(10)); // 20
    </script>
</body>
</html>
```

原因是瀏覽器中所有在JavaScript**函式外**宣告的變數會被加入到同一個全域物件內。

現在使用Node應用程式的addtwo模組：

```
var base = 2;

exports.addtwo = function(input) {
    return parseInt(input) + base;
}
```

```
var addtwo = require('./addtwo').addtwo;

var base = 10;

console.log(addtwo(10));  // 12
```

在Node應用程式中宣告新的base變數不會影響模組中base的值，因為它們存在不同的全域命名空間。

global在環境中共用的是所有全域可用的Node物件與函式的存取，包括`process`物件。可用下列程式執行，它會輸出所有全域可用的物件與函式：

```
console.log(global);
```

### process物件

為Node環境的基本元件，它提供執行期環境的資訊。此外，標準輸出入(I/O)透過process進行，你可優雅結束Node應用程式，甚至能夠通知Node事件迴圈循環的結束。

process物件提供Node環境以及執行期環境的資訊。

```
$ node -p "process.versions" // 雙引號，windows的命令視窗是必要的
{ http_parser: '2.7.0',
  node: '7.7.1',
  v8: '5.5.372.41',
  uv: '1.11.0',
  zlib: '1.2.11',
  ares: '1.10.1-DEV',
  modules: '51',
  openssl: '1.0.2k',
  icu: '58.2',
  unicode: '9.0',
  cldr: '30.0.3',
  tz: '2016j' }
```

它列出各種Node元件的版本與相依性，包括V8、OpenSSL(用於安全通訊函式庫)、Node本身等的版本。

`process.env`屬性提供關於Node在你的開發/運行環境所見的資訊

```
$ node -p "process.env"
```

使用下列命令探索`process.release`：

```
$ node -p "process.release"
{ name: 'node',
  sourceUrl: 'https://nodejs.org/download/release/v7.7.1/node-v7.7.1.tar.gz',
  headersUrl: 'https://nodejs.org/download/release/v7.7.1/node-v7.7.1-headers.tar.gz',
  libUrl: 'https://nodejs.org/download/release/v7.7.1/win-x64/node.lib' }
```

看到應用程式名稱與原始碼的URL，但在LTS中還會有其他屬性：

```
$ node -p "process.release.lts"
undefined  // v6以後就是這個結果
```

環境資訊能讓開發者在開發過程中了解Node所見內容。

標準串流是預先建立的應用程式與環境間的通訊管道，由

- 標準輸入(stdin)
- 標準輸出(stdout)
- 標準錯誤(stderr)

組成。它們提供Node應用程式與終端機間的通訊。它們是你與應用程式直接通訊的管道。

Node以三個process函式支援管道：

- `process.stdin`：stdin的讀取串流
- `process.stdout`：stdout的寫入串流
- `process.stderr`：stderr的寫入串流

你無法關閉這些串流或在應用程式中結束它們，但可從stdin接收輸入並輸出到stdout與stderr。

process的I/O函式繼承自EventEmitter。這表示它們可以發出事件。且你可以擷取事件並處理任何資料。為使用process.stdin處理進來的資料，你必須設定串流的編碼，若沒這麼作結果會是`buffer`而非字串：

```
process.stdin.setEncoding('utf8');
```

接下來聆聽readable事件，它讓我們知道有一段資料可供讀取。然後使用`process.stdin.read()`函式讀取資料，若資料不是null則使用`process.stdout.write()`函式從process.stdout輸出。

```
process.stdin.on('readable', function() {
    var input = process.stdin.read();

    if (input != null) {
        // 輸出文字
        process.stdout.write(input);
    }
})
```

放棄編碼設定一讀取buffer並輸出buffer一給應用程式使用者。

修改I/O測試程式以"聆聽"結束字串，發生時結束程式

```
process.stdin.setEncoding('utf8')

process.stdin.on('readable', function() {
    var input = process.stdin.read();

    if (input != null) {
        // 輸出文字
        process.stdout.write(input);

        if (input.trim() == 'exit')
            process.exit(0);
    }
})
```

如果移除開頭的`process.stdin.setEncoding()`函式，程式會失敗。因為buffer沒有trim()函式，也可將buffer轉字串在執行trim：

```
input.toString().trim()
```

但更好方式是加上編碼並移除任何意料外的副作用。

※ process的I/O物件是Stream介面的實作

process.stderr物件可在發生錯誤時向它輸出。為區分預期中的輸出與發生問題的輸出。

## Buffer、具型別的陣列與字串

早期瀏覽器的JavaScript不需處理二進位陣列(八位元組串流)。JavaScript原始設計適用於處理字串，就算Ajax改變運用範圍，Server與Client之間的資料基本上還是字串(Unicode)。

對JavaScript需求更為複雜後發生了變化

- Ajax
- WebSockets
- WebGL
- Canvas
- 等新技術

JavaScript與瀏覽器的解決方式是透過**具型別陣列**操作的`ArrayBuffer`，而Node的解決方式是`Buffer`。

原這兩個並不相同，Node v4.0.0後，也透過V8 v4.5收到具型別陣列的支援。Node的buffer現在是以`Uint8Array`支持，它是以8位元無正負號整數的陣列所表示的具型別陣列。但這並不表示你可用一個型別取代另一個型別。在Node中，Buffer類別是大部分I/O所使用的主要資料結構，交換具型別陣列會使得應用程式出問題。此外，將Node的buffer轉換成具型別陣列是可行的，但不會沒有問題。根據buffer的API文件，當你“轉換”buffer成具型別陣列時：

- buffer的記憶體是複製而非共用
- buffer的記憶體被解譯成陣列而非位元組陣列。

    `Uint32Array(new Buffer([1,2,3,4]))`會建構帶有[1,2,3,4]四個元素的`Uint32Array`，而非單一`[0x1020304]`或`[0x4030201]`元素的`Uint32Array`。
    
因此你可以在Node中使用這兩種型別的八位元組串流處理，但**主要還是使用buffer**。

※ 什麼是八位元組串流？為何二進位或原始資料檔案稱為八位元組(octet)串流？八位元組是電腦運算的單位度量，它有8個位元長，因此稱為“八位元組”。在支援8位元的位元組的系統中，八位元組與位元組(byte)是相同的東西。串流是一系列的資料。因此，二進位檔案是一系列的八位元組。

Node的buffer是原始二進位資料，分派在V8的heap之外，透過buffer類別管理。**一旦分配後，buffer的大小不能改變**。

buffer是檔案存取的預設資料型別：除非在讀取與寫入檔案時指定編碼，否則資料是輸出入到buffer。

Node v4中，你可直接使用new關鍵字建構新的buffer：

```
let buf = new Buffer(24);
```

不像ArrayBuffer，建構新buffer無需初始化內容。如果想要確保沒怪異、預期外的後果，也不會帶有敏感資料，你需在建構buffer之後立即將其填滿。

```
let buf = new Buffer(24);
buf.fill(0); // 填入零值
```

也可指定開始與結束值對buffer做部分填入。

※ node v5.7.0開始，`buf.fill()`可指定編碼：`buf.fill(string[, start[, end]] [, encoding])`。

也能傳遞八位元組陣列、另一個buffer、或字串給建構元函式來直接建構新的buffer，這樣會建構出帶有複製內容的buffer。對字串來說，如果不是UTF-8，必須指定(Node字串預設UTF-8編碼)。

```
let str = `New String`;
let buf = new Buffer(str);
```

※ raw與raws編碼類型在Node v5就被移除

在Node v6中，建構元已不建議使用，改使用新的Buffer方法來建構新的buffer：

- `Buffer.from()`
- `Buffer.alloc()`
- `Buffer.allocUnsafe()`

`Buffer.from()`函式：

- 傳入陣列會得到複製內容的buffer。
- 傳入ArrayBuffer，加上位元組位移與長度選項，buffer會與ArrayBuffer**共用相同的記憶體**。
- 傳入buffer會複製該buffer內容
- 傳入字串會複製字串

`Buffer.alloc()`函式建構特定大小的填滿buffer。

`Buffer.allocUnsafe()`建構特定大小但可能帶有原來或敏感資料的buffer，必須以`buf.fill()`填入以確保安全。

```
'use strict';

let a = [1,2,3];

let b = Buffer.from(a);

console.log(b);          // <Buffer 01 02 03>

let a2 = new Uint8Array([1,2,3]);

let b2 = Buffer.from(a2);

console.log(b2);         // <Buffer 01 02 03>

let b3 = Buffer.alloc(10);

console.log(b3);         // <Buffer 00 00 00 00 00 00 00 00 00 00>

let b4 = Buffer.allocUnsafe(10);

console.log(b4);         // <Buffer 00 00 00 00 00 00 00 00 00 00>
```

### buffer、JSON、StringDecoder與UTF-8字串

buffer可轉換成JSON與字串。

```
'use strict'

let buf = new Buffer("This is my pretty example");
let json = JSON.stringify(buf);

console.log(json);
```

結果

```
{"type":"Buffer","data":[84,104,105,115,32,105,115,32,109,121,32,112,114,101,116,116,12
1,32,101,120,97,109,112,108,101]}
```

資料以一系列八位元組存在buffer中。

可反向將JSON轉成buffer資料，然後用Buffer.toString()方法轉換成字串：

```
let buf2 = new Buffer(JSON.parse(json));
console.log(buf2.toString()); // This is my pretty example
```

toString()依預設將字串轉UTF-8，想轉換其他字串型別，可傳入編碼：

```
console.log(buf2.toString('ascii')); // This is my pretty example
```

也可指定字串轉換的開始與結束：

```
console.log(buf2.toString('utf-8', 11, 17)); // pretty
```

buffer轉換字串，也可使用`StringDecoder`輔助類別。它具**彈性與復原能力**。如果**buffer.toString()**方法收到不完整的UTF-8字元序列，會回傳垃圾。**StringDecoder**會緩衝直到完整再回傳結果。如果你是從串流接收UTF-8分段結果，就應該使用`StringDecoder`。

歐元符號以三個八位元組編碼，第一個buffer只帶前兩個八位元組。第二個buffer帶第三個八位元組。

```
"use strict"

let StringDecoder = require('string_decoder').StringDecoder;
let decoder = new StringDecoder('utf8');

let euro = new Buffer([0xE2, 0x82]);
let euro2 = new Buffer([0xAC]);

console.log(decoder.write(euro));  //
console.log(decoder.write(euro2)); // €

console.log(euro.toString());      // ��
console.log(euro2.toString());     // �
```

也可使用`buffer.write()`轉換字串到現有的buffer中，但buffer必須具正確大小以儲存字元的八位元組。

```
let buf = new Buffer(3);
buf.write('€', 'utf8');

console.log(buf.length);  // 3
```

## buffer的操作

你可使用各種具型別的函式讀寫buffer的特定位置。

```
var buf = new Buffer(4);

buf.writeUInt8([0x63], 0);
buf.writeUInt8([0x61], 1);
buf.writeUInt8([0x74], 2);
buf.writeUInt8([0x73], 3);

console.log(buf.toString());  // cats
```

也可用`buf.readUInt8()`讀取個別的8位元整數。

Node支援有正負號與無正負號的8、16與32位元整數、浮點數，與雙精度浮點數的讀取與寫入。對所有非8位元的整數，也可選擇`little-endian`或`big-endian`格式。

- `buffer.readUIntLE()`：使用little-endian格式讀取位移buffer值
- `buffer.writeUInt16BE()`：使用big-endian格式在位移處寫入16位元整數
- `buffer.readFloatLE()`：以little-endian格式在位移處讀取浮點數
- `buffer.writeDoubleBE()`：以big-endian格式於位移處寫入64位元雙精度浮點數

字節序(endianness)：或稱位元組序，決定值如何儲存。高位元組儲存於低記憶體位址(big-endian)或低位元組儲存於低記憶體位址(little-endian)。

也可直接使用類似陣列格式寫入8位元整數：

```
var buf = new Buffer(4);
buf[0] = 0x63;
buf[1] = 0x61;
buf[2] = 0x74;
buf[3] = 0x73;
```

除讀寫指定buffer位移外，也可使用`buffer.slice()`建構由舊buffer段落組成新buffer。修改新buffer內容也會修改舊buffer內容。

```
var buf1 = new Buffer('this is the way we build our buffer');
var lnth = buf1.length;

// 以舊段落建構新buffer
var buf2 = buf1.slice(19, lnth);
console.log(buf2.toString());  // build our buffer

buf2.fill('*', 0, 5);
console.log(buf2.toString());  // ***** our buffer

// 顯示第一個buffer的影響
console.log(buf1.toString());  // this is the way we ***** our buffer
```

如需測試buffer是否相等，可使用`buffer.equals()`函式：

```
if (buf1.equals(buf2)) console.log('buffers are equal');
```

也可使用`buffer.copy()`複製一個buffer的位元組到另一個buffer。可使用選項參數複製所有或部分位元組。但要注意，若第二個buffer不夠容納所有內容，則只會取得容得下的部分。

```
var buf1 = new Buffer('this is a new buffer with a string');

// 複製buffer
var buf2 = new Buffer(10);
buf1.copy(buf2);

console.log(buf2.toString()); // this is a 
```

如果需要比較buffer，可使用`buffer.compare()`，它回傳值指是受比較buffer的先後順序。受比較的buffer在前回傳-1；在後則回傳1。相同的位元組回傳0。

```
var buf1 = new Buffer('1 is number one');
var buf2 = new Buffer('2 is number two');

var buf3 = new Buffer(buf1.length);
buf1.copy(buf3);

console.log(buf1.compare(buf2)); // -1
console.log(buf2.compare(buf1)); // 1
console.log(buf1.compare(buf3)); // 0
```

另一個buffer類別`SlowBuffer`可用於長時間維持小buffer的內容。通常，若buffer較小(小於4KB)，則Node從預先分配的一段記憶體中建構buffer。這種方式使得垃圾回收不必紀錄與清除一堆小段的記憶體。

`SlowBuffer`類別可讓你從預先分配的記憶體區段外建構小buffer並保存較長時間。但使用此類別對效能會有重大影響，**別無他法**才使用。

## Node 的 callback 與非同步事件處理

JavaScript是單執行緒的，因此是同步的。由於Node基於JavaScript，它也繼承執行序的同步行為。

但若函式須等待某物：

- 開啟檔案
- 網頁回應
- 其他活動

會阻斷應用程式的進行直到操作完成，這會是伺服器應用程式的重大問題。

防止阻斷的解決方法：**事件迴圈**

### 事件佇列(迴圈)

開啟非同步功能，應用程式可採取兩種方式：

1. 指派執行緒給耗時程序，其餘部分平行執行。這種方式的問題是執行緒成本很高，不只是資源，還有應用程式的複雜性。
2. 事件迴圈架構。涉及耗時程序時，應用程式不等待它的完成。相對的，該程序在完成時發出事件通知。此事件會加入到佇列，或稱為**事件迴圈**中。相依的功能向應用程式登記對此事件的興趣，當事件從事件迴圈中抽出並加以處理時，相依的功能被叫用並傳入與事件相關的資料。

browser與Node的JavaScript都採用後者。在browser中，當你對一個元素加上click處理程序，實際上是登記(訂閱)事件並提供事件發生時被叫用的callback函式，讓接下來的應用程式繼續執行。

Node有自己的事件迴圈，但相較於等待點擊元素等UI事件，它的迴圈用於幫助進行伺服器功能，主要是輸出入(I/O)。這包括：

- 開啟檔案的事件
- 檔案開啟時讀取其內容到buffer
- 通知用戶程序已完成
- 等待使用者網路請求

這些程序耗時，還可能競爭資源，且資源的存取通常會鎖住資源直到原始程序結束。此外，網路應用程式會等待使用者或其他應用程式的動作。

Node在佇列中循序處理所有事件。它收到你感興趣的事件時會叫用你提供的callback函式，傳入與事件相關的資訊。

```
var http = require('http');
var server = http.createServer();

server.on('request', function(req, res) {

    console.log('request event');

    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
});

server.on('connection', function() {
    console.log('connection event');
});

server.listen(8124, function() {
    console.log(`listening event`);
});

console.log(`Server running on port 8124`);
```

注意requestListener()函式，此伺服器請求的callback不在呼叫http.createServer()函式。相對的，應用程式指派新建構的HTTP伺服器給一個變數，然後擷取兩個事件

- request：用戶發出請求時
- connection：新用戶連上應用程式時

這兩種情況下，事件以HTTP伺服器類別繼承自`EventEmitter`類別的`on()`函式訂閱。還有個聆聽事件：使用HTTP的server.listen()函式這個callback函式存取。

1. 立即輸出“Server running on port 8124”
2. “listening event”
3. “connection event“
4. 一或兩個的“request event”(取決於瀏覽器對新網站的請求方式)

reload只會收到請求事件訊息("request event")，連線已經建立且會持續直到關閉瀏覽器或逾時。

如果應用程式中有函式或模組想要做成非同步，要使用以下的特定條件定義它：

## 建構非同步callback函式

Node應用程式callback功能的基本結構，它建構doSomething()函式的物件，此函式取用三個函數：

1. 沒錯誤回傳資料
2. 必須是字串
3. callback函式

如果沒有第二個字串或不是字串，則物件建構出新的Error物件，它會從callback函式回傳。如果沒發生錯誤，callback函式被呼叫，錯誤設定為null，函式資料得以回傳。

以下是callback功能的基本結構：

```
var fib = function (n) {
    if (n < 2) return n;
    return fib(n - 1) + fib(n - 2);
}

var Obj = function () { };

Obj.prototype.doSomething = function(arg1_) {
    var callback_ = arguments[arguments.length - 1];
    callback = typeof callback_ == 'function' ? callback_ : null;
    var arg1 = typeof arg1_ === 'number' ? arg1_ : null;

    if (!arg1)
        return callback(new Error('first arg missing or not a number'));
    
    process.nextTick(function(){
        // CPU阻斷
        var data = fib(arg1);
        callback(null, data);
    })
}

var test = new Obj();
var number = 10;

test.doSomething(number, function(err, value) {
    if (err) return console.error(err);
    console.log('fibonaci value for %d is %d', number, value);
});

console.log(`called doSomething`);
```

關鍵功能一：確保最後一個參數是callback。錯誤第一的模式通常稱為**errback**。

關鍵功能二：發生錯誤時建構新的Error物件並作為callback函式的結果回傳。在非同步中無法依賴`try...catch`，因此錯誤處理必須以callback的Error物件處理。

關鍵功能三：無錯誤則叫用傳給函式的callback函式。為確保callback是非同步，我們在`process.nextTick()`函式中呼叫它。`process.nextTick()`可確保事件迴圈在呼叫函式前被清除。這表示所有同步功能在叫用(任何)阻斷功能前被處理掉。費氏數列在`process.nextTick()`中呼叫，因此可確保CPU密集功能非同步處理。

簡言之，只要出現這四個關鍵功能，其他都可變：

- 確保最後一個參數是callback
- 如果發生錯誤，建構出Error並作為callback函式的第一個參數回傳
- 如果沒有發生錯誤，呼叫callback函式，將錯誤參數設為null，傳入相關資料
- callback函式必須在`process.nextTick()`中呼叫以確保程序不會被阻斷

## EventEmitter

任何時候見到物件emit事件與使用on函式處理事件，就會看到EventEmitter的痕跡。

EventEmitter使Node能夠非同步處理事件。

```
// 引用Events模組
var events = require('events');

// 建構EventEmitter的實例
var em = new events.EventEmitter();

...
```

使用新建構的EventEmitter進行兩項基本任務：將事件處理程序接上事件與發送實際事件。`EventEmitter.on()`事件處理程序在發生指定事件時被叫用。此方法第一個參數是事件名稱；第二個是執行功能的callback函式。

```
em.on('someevent', function(data) { ... });
```

符合某種條件時，事件會透過`EventEmitter.emit()`方法發出：

```
if (somecriteria) {
    em.emit('data');
}
```

以下是個EventEmitter範例，每隔三秒發送事件。

```
const { EventEmitter } = require('events');

let counter = 0;

const em = new EventEmitter();

setInterval(function () {
    em.emit('timed', counter++);
}, 3000);

em.on('timed', function(data) {
    console.log(`timed ${data}`);
});
```

此程式的重點在於事件是透過EventEmitter.emit()函式觸發，而EventEmitter.on()用於擷取事件並加以處理。

但這沒什麼用途。我們需要的是在**現有的物件中加上EventEmitter**功能一而非在應用程式中使用EventEmitter的實例。這是Node的`http.Server`與其他大部分事件類別所做的事。

繼承了`EventEmitter`功能，因此我們必須使用Node的`Util`物件來啟用。

Util模組是很好的輔助工具。目前會運用到它的`util.inherits()`函式。

util.inherits()函式讓建構元繼承超建構元的原型方法。`util.inherits()`更特別的是，讓你也可在建構元的函式中直接存取超建構元。

```
util.inherits(Someobj, EventEmitter);
```

你可在該物件的方法中呼叫emit方法並對該物件實例撰寫事件處理程序：

```
Someobj.prototype.someMethod = function() { this.emit('event'); }
...
Someobjinstance.on('event', function() { });
```

以下為範例

```
"use strict";

const util = require('util');
const { EventEmitter } = require('events');
const fs = require('fs');

function InputChecker(name, file) {
    this.name = name;
    this.writeStream = fs.createWriteStream('./' + file + '.txt',
        {
            'flags': 'a',
            'encoding': 'utf8',
            'mode': 0o666  // 使用ES6樣式實字的記號法
        });
}

util.inherits(InputChecker, EventEmitter);

InputChecker.prototype.check = function check(input) {
    let command = input.trim().substr(0, 3);
    if (command === 'wr:') {
        this.emit('write', input.substr(3, input.length));
    } else if (command === 'en:') {
        this.emit('end');
    } else {
        this.emit('echo', input);
    }
}

// 測試
let ic = new InputChecker('Shelley', 'output');

ic.on('write', function (data) {
    this.writeStream.write(data, 'utf8');
});

ic.on('echo', function (data) {
    process.stdout.write(ic.name + ' wrote ' + data);
});

ic.on('end', function () {
    process.exit();
});

// 設定編碼後擷取輸入
process.stdin.setEncoding('utf8');
process.stdin.on('readable', function() {
    let input = process.stdin.read();
    if (input !== null)
        ic.check(input);
})
```

此功能包含`process.stdin.on`事件處理方法，`process.stdin`是繼承來自`EventEmitter`的眾多Node物件之一。

on()函式其實是EventEmitter.addListener函式的捷徑，取用相同參數。

可使用`EventEmitter.once()`傾聽下一個事件：

```
ic.once(event. function);
```

一個事件有十個以上的傾聽程序時，預設會提出警告。使用`setMaxListeners`並傳入數字來改變傾聽程序的數量。使用零值設定無上限。

也可使用EventEmitter.reomveListener()移除傾聽程序

```
ic.on('echo', callback);
ic.removeListener('echo', callback);
```

這會從事件傾聽陣列移除一個傾聽程序並維持原來順序。但若有使用`EventEmitter.listeners()`複製事件傾聽程序陣列，移除傾聽程序後必須要重新建構它。

### Node的事件迴圈與計時器

Node也有`setTimeout()`與`setInterval()`，不完全一樣，因為browser使用**browser引擎**維護事件迴圈，而Node的事件迴圈是由**libuv這個C++函式庫**處理一但差異幾乎無關緊要。

```
setTimeout(function(name) {
    console.log('Hello ' + name);
}, 3000, 'Shelley');
console.log('waiting on timer...');
```

參數列中的名稱傳入給setTimeout()中的callback函式作為參數。setTimeout是非同步的。

如果建構計時器將它指派給變數，可以取消它。

```
var timer1 = setTimeout(function(name) {
    console.log(`Hello ${name}`);
}, 30000, 'Shelley');

console.log(`waiting on timer...`);

setTimeout(function(timer) {
    clearTimeout(timer);
    console.log(`cleared timer`);
}, 3000, timer1);
```

`setInterval()`計時器會持續重新啟動，直到應用程式結束或使用`clearInterval()`清除計時器。

```
var interval = setInterval(function(name) {
    console.log(`Hello ${name}`);
}, 3000, 'Shelley');

setTimeout(function(interval) {
    clearInterval(interval);
    console.log(`cleared interval `);
}, 30000, interval);

console.log(`waiting on first interval...`);
```

Node文件記載，callback函式不保證會準確以n毫秒(無論n為何)叫用。(與browser使用setTimeout()相同)一我們沒有對環境的絕對控制，各種因素會稍微延遲計時器。大部分情況會看不出計時器的差異，但如果要產生動畫，則會確實看到影響。

有兩個Node專屬的函式`ref()`與`runref()`，可對呼叫`setTimeout()`或`setInterval()`所回傳的計時器/間隔使用。

- 如果對計時器呼叫unref()且它是事件佇列中唯一的事件，則計時器被取消且程式可結束
- 如果你對同一個計時器物件呼叫ref()，這樣會讓程式繼續執行直到計時器被處理。

```
var timer = setTimeout(function() {
    console.log(`Hello ${name}`);
}, 30000, 'Shelley');

timer.unref();

console.log(`waiting on timer...`);
```

執行此應用程式會輸出控制台訊息然後結束。原因是使用setTimeout()設定的計時器是應用程式的事件佇列中唯一的事件。若加入另一個事件呢？

```
var interval = setInterval(function (name) {
    console.log(`Hello ${name}`);
}, 3000, 'Shelley');

var timer = setTimeout(function(interval) {
    clearInterval(interval);
    console.log(`cleared timer`);
}, 30000, interval);

timer.unref();

console.log(`waiting on first interval...`);
```

計時器可以繼續，這表示他終結了間隔，且讓計時器保持存活夠久的間隔事件讓計時器得以清除間隔。

最後一組Node計時器函式是Node專屬的：

- `setImmediate()`
- `clearImmediate()`

`setImmediate()`：建構一個事件，但優先於`setTimeout()`與s`etInterval()`所建構的事件。然而他不會優先於I/O事件，且它沒有相關的計時器。`setImmediate()`事件在所有I/O事件之後與任何計時器事件之前於目前的事件佇列中發出。如果從callback函式呼叫它，它會被放在叫用它的事件完成後的下一個事件迴圈中。這是一種**加入事件到目前或下一個事件迴圈而不用加入任何計時器的方式**。這比`setTimeout(callback, 0)`更有效率，因它優先於其他計時器事件。

它類似`process.nextTick()`，除了`process.nextTick()`的callback函式是在`目前事件迴圈結束後與新的I/O事件加入前被叫用`。

## 套疊callback與例外處理

循序程式設計：

```
const fs = require('fs');

try {
    let data = fs.readFileSync('./apples.txt', 'utf8');
    console.log(data);
    var adjData = data.replace(/[A|a]pple/g, 'orange');
    fs.writeFileSync('./oranges.txt', adjData);
} catch (error) {
    console.error(error);
}
```

由於可能發生問題且我們無法確保能在模組函式內部處理錯誤，我們將函式呼叫包裝在try區塊以優雅一或至少更能提供資訊一的進行例外處理。

轉換此同步循序應用程式模式成非同步實作需要幾個修改。以非同步函式取代相對應的同步函式，但為避免阻斷情況，表示如果個別呼叫函式不能保證正確的順序。唯一能保證正確順序的辦法是使用**套疊callback**。

```
const fs = require('fs');
fs.readFile('./apples.txt', 'utf8', function(err, data) {
    if (err) {
        console.error(err);
    } else {
        let adjData = data.replace(/[A\a]pple/g, 'orange');
        fs.writeFile('./oranges.txt', adjData, function(err) {
            if (err) console.error(err);
        });
    }
});
```

想記錄錯誤，可輸出Node錯誤物件的stack屬性：

```
if (err) {
    console.error(err.stack);
}
```

引用循序非同步函式會增加另一個callback套疊且可能對錯誤處理是個挑戰。範例，存取一個目錄下的檔案，做replace然後寫回原檔案。每個檔案修改使用輸出串流來記錄：

```
const fs = require('fs');
const ws = fs.createWriteStream('./log.txt', {
    'flags': 'a',
    'encoding': 'utf8',
    'mode': 0666
});

ws.on('open', function() {
    fs.readdir('./data/', function(err, files) {
        if (err) {
            console.log(err.message);
        } else {
            files.forEach(function(name) {
                fs.readFile('./data/' + name, 'utf8', function(err, data) {
                    if (err) {
                        console.error(err.message);
                    } else {
                        var adjData = data.replace(/somecompany\.com/g, 'burningbird.net');
                        fs.writeFile('./data/' + name, adjData, function(err) {
                            if (err) {
                                console.error(err.message);
                            } else {
                                ws.write('change ' + name + '\n', 'utf8', function(err) {
                                    if (err) console.error(err.message);
                                });
                            }
                        });
                    }
                });
            });
        }
    });
});

ws.on('error', function(err) {
    console.error('ERROR:' + err);
})
```

如果執行此應用程式多次並檢查log.txt檔案，你會發現檔案以不同隨機順序處理。

如果想要檢查檔案何時處理完以便執行其他動作會引發另一個問題。forEach方法非同步叫用迭代callback，因此它不會阻斷。

```
const fs = require('fs');
const ws = fs.createWriteStream('./log.txt', {
    'flags': 'a',
    'encoding': 'utf8',
    'mode': 0666
});

ws.on('open', function() {
    fs.readdir('./data/', function(err, files) {
        if (err) {
            console.log(err.message);
        } else {
            files.forEach(function(name) {
                fs.readFile('./data/' + name, 'utf8', function(err, data) {
                    if (err) {
                        console.error(err.message);
                    } else {
                        var adjData = data.replace(/somecompany\.com/g, 'burningbird.net');
                        fs.writeFile('./data/' + name, adjData, function(err) {
                            if (err) {
                                console.error(err.message);
                            } else {
                                ws.write('change ' + name + '\n', 'utf8', function(err) {
                                    if (err) console.error(err.message);
                                    else console.log(`finished ${name}`);
                                });
                            }
                        });
                    }
                });
            });
            console.log(`all finished`);
        }
    });
});

ws.on('error', function(err) {
    console.error('ERROR:' + err);
})
```

會在控制台收到下列輸出：

```
all finished
finished data1.txt
finished data2.txt
finished data4.txt
finished data3.txt
finished data5.txt
```

為克服這個挑戰，對每個紀錄訊息加上遞增計數然後檢查陣列長度以輸出"all done"訊息：

```
const fs = require('fs');
const ws = fs.createWriteStream('./log.txt', {
    'flags': 'a',
    'encoding': 'utf8',
    'mode': 0666
});

ws.on('open', function () {
    fs.readdir('./data/', function (err, files) {
        if (err) {
            console.log(err.message);
        } else {
            let counter = 0;
            files.forEach(function (name) {
                fs.readFile('./data/' + name, 'utf8', function (err, data) {
                    if (err) {
                        console.error(err.message);
                    } else {
                        var adjData = data.replace(/somecompany\.com/g, 'burningbird.net');
                        fs.writeFile('./data/' + name, adjData, function (err) {
                            if (err) {
                                console.error(err.message);
                            } else {
                                ws.write('change ' + name + '\n', 'utf8', function (err) {
                                    if (err) {
                                        console.error(err.message);
                                    } else {
                                        console.log(`finished ${name}`);
                                        counter++;
                                        if (counter >= files.length) {
                                            console.log(`all done`);
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            });
        }
    });
});

ws.on('error', function (err) {
    console.error('ERROR:' + err);
})
```

如果操作的目錄下面還有子目錄。此應用程式若遇到子目錄，它會輸出下列錯誤訊息但繼續處理其他內容：

```
EISDIR: illegal operation on a directory, read
```

使用`fs.stats`方法以回傳代表來自Unix的stat命令的資料來防止這種錯誤。此物件帶有關於物件的資訊，包括它是否為檔案。`fs.stats`方法也是非同步方法，需更複雜的callback套疊。

```
const fs = require('fs');
const ws = fs.createWriteStream('./log.txt', {
    'flags': 'a',
    'encoding': 'utf8',
    'mode': 0666
});

ws.on('open', function () {
    let counter = 0;
    fs.readdir('./data/', function (err, files) {
        if (err) {
            console.log(err.message);
        } else {
            files.forEach(function (name) {
                fs.stat('./data/' + name, function (err, stats) {
                    if (err) return err;
                    if (!stats.isFile()) {
                        counter++;
                        return;
                    }
                    fs.readFile('./data/' + name, 'utf8', function (err, data) {
                        if (err) {
                            console.error(err.message);
                        } else {
                            var adjData = data.replace(/somecompany\.com/g, 'burningbird.net');
                            fs.writeFile('./data/' + name, adjData, function (err) {
                                if (err) {
                                    console.error(err.message);
                                } else {
                                    ws.write('change ' + name + '\n', 'utf8', function (err) {
                                        if (err) {
                                            console.error(err.message);
                                        } else {
                                            console.log(`finished ${name}`);
                                            counter++;
                                            if (counter >= files.length) {
                                                console.log(`all done`);
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    });
                });
            });
        }
    });
});

ws.on('error', function (err) {
    console.error('ERROR:' + err);
});
```

同樣的，此應用程式運作的很好一但不容易閱讀與維護！使用了return來做一些錯誤處理，消除一個條件套疊，但程式還是很難維護。這種callback套疊被叫做**callback千層麵**或**毀滅金字塔**。

之後可以透過Async模組來解決毀滅金字塔，or ES6功能：需要非同步控制處理模組。