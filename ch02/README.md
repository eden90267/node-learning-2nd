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