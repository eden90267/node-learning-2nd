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

早期瀏覽器的JavaScript