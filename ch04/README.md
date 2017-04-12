# REPL與控制台

探索Node與自訂模組或應用程式時，無需輸入JavaScript到檔案並以Node執行來測試你的程式。Node有個稱為REPL或read-eval-print loop的互動元件。

REPL(發音“repple”)支援簡化的行編輯與一組基本命令。

有趣的技巧：

- 替換底層處理命令的機制
- 一些命令列編輯功能
- API供建構自訂的REPL

## REPL：初探與未定義運算式

使用REPL：

```
$ node
```

接下來命令列會顯示提示符號(`>`)。從這裡輸入的任何東西會被底層V8 JavaScript引擎處理。

```
> a = 2
2
```

```
> b = ['a', 'b', 'c'];
['a', 'b', 'c']
```

此工具會輸出你輸入的運算式結果。

要存取最後一次運算式，使用特殊底線變數(_)。下面的a被設為2、將運算式結果加1，然後再加1：

```
> a = 2;
2
> ++_;
3
> ++_;
4
```

你甚至可存取底線運算式的屬性或呼叫其方法：

```
> ['apple', 'orange', 'lime']
[ 'apple', 'orange', 'lime' ]
> _.length
3
> 3 + 4
7
> _.toString();
'7'
```

可在REPL使用var關鍵字以供稍後存取運算式或值，但可能會遇到意料外的結果。

```
> var a = 2;
undefined
```

它並不回傳2值，而是回傳undefined值。運算式的結果為未定義是由於變數指派在求值時不回傳結果。

```
> console.log(eval('a = 2'));
2
undefined
> console.log(eval('var a = 2'));
undefined
undefined
```

REPL代表read-eval-print-loop，強調的是`eval`。

按Ctrl-C兩次或Ctrl-D一次以結束REPL。

## REPL的好處：近一步認識底層JavaScript

以下是REPL典型示範：

```
> 3 > 2 > 1
false
```

在JavaScript求值中，運算子從左到右求值，而每個運算式結果會回傳供下一次求值。

```
> 3 > 2 > 1;
false
> 3 > 2
true
> true > 1
false
```

REPL用途是讓我們發現JavaScript的這些小技巧。

## 多行更複雜的JavaScript

```
> qs = require('querystring');
{ unescapeBuffer: [Function: unescapeBuffer],
  unescape: [Function: qsUnescape],
  escape: [Function: qsEscape],
  stringify: [Function: stringify],
  encode: [Function: stringify],
  parse: [Function: parse],
  decode: [Function: parse] }
> val = qs.parse('file=main&file=secondary&test=one').file;
[ 'main', 'secondary' ]
```

沒使用var關鍵字，運算式結果會被輸出。

除了能操作外部模組外，REPL還可優雅處理多行運算式，以大括弧來表示套疊的程式。

```
> var test = function(x, y) {
... var val = x * y;
... return val;
... };
undefined
> test(3, 4);
12
```

REPL以重複的點表示右大括弧後面輸入的內容還沒結束。它對右括號也是這樣。

```
> test(3,
... 4);
12
```

加深的套疊會產生更多的點：這在互動環境中是必要的。

```
> var test = function(x, y) {
... var test2 = function(x, y) {
..... return x * y;
..... }
... return test2(x, y);
... }
undefined
> test(3, 4);
12
```

可輸入或貼上整個Node應用程式給REPL並加以執行。

```
> var http = require('http');
undefined
> http.createServer(function(req, res) {
...     res.writeHead(200, {'Content-Type': 'text/plain'});
...     res.end('Hello person\n');
... }).listen(8124);
Server {
  domain:
   Domain {
     domain: null,
     _events: { error: [Function: debugDomainError] },
     _eventsCount: 1,
     _maxListeners: undefined,
     members: [] },
  _events:
   { request: [Function],
     connection: [Function: connectionListener] },
  _eventsCount: 2,
  _maxListeners: undefined,
  _connections: 0,
  _handle:
   TCP {
     bytesRead: 0,
     _externalStream: {},
     fd: 15,
     reading: false,
     owner: [Circular],
     onread: null,
     onconnection: [Function: onconnection],
     writeQueueSize: 0 },
  _usingSlaves: false,
  _slaves: [],
  _unref: false,
  allowHalfOpen: true,
  pauseOnConnect: false,
  httpAllowHalfOpen: false,
  timeout: 120000,
  _pendingResponseData: 0,
  maxHeadersCount: null,
  _connectionKey: '6::::8124' }
> console.log('Server running at http://127.0.0.1:8124/');
Server running at http://127.0.0.1:8124/
undefined
```

作者最喜歡REPL的一點是可以快速檢視物件。

```
console.log(global);
```

```
> gl = global
```

```
> global
```

可使用上下鍵叫出曾經在REPL輸入過的內容。但有些限制。

```
> var myFruit = function(fruitArray, pickOne) {
... return fruitArray[pickOne - 1];
... }
undefined
> fruit = ['apples', 'oranges', 'limes', 'cherries'];
[ 'apples', 'oranges', 'limes', 'cherries' ]
> myFruit(fruit, 2);
'oranges'
> myFruit(fruit, 1);
'apples'
> myFruit(fruit, 0);
undefined
> myFruit(fruit, 0);
undefined
> var myFruit = function(fruitArray, pickOne) {
... if (pickOne <= 0) return 'invalid number';
... return fruitArray[pickOne - 1];
... }
undefined
> myFruit(fruit, 0);
'invalid number'
> myFruit(fruit, 1);
'apples'
```

可用方向鍵重複之前內容輸入。

以操作正規表示式就很好用：

```
> var ssRe = /^\d{3}-\d{2}-\d{4}$/;
undefined
> ssRe.test('555-55-5555');
true
> var decRe = /^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/;
undefined
> decRe.test(56.5)
true
```

可免測試重新輸入。

REPL可使用Tab鍵自動完成命令輸入。

REPL上想儲存，可使用`.save`命令儲存目前內容。

### REPL命令

REPL有簡單的介面與一組實用的命令。`.save`可將目前內容儲存到檔案中。除非下令建構新的物件背景或使用`.clear`命令，否則內容會包含在所有REPL的輸入：

```
> .save ./dir/session/save.js
```

只有你的輸入會儲存。

以下列出REPL命令與其功能：

- .break

    如果輸入多行時忘記位置，輸入.break可重新開始，前面的輸入會被清除

- .clear

    重置背景物件並清除所有表達式。此命令基本上就是重新開始

- .exit

    結束REPL

- .help

    顯示所有REPL命令

- .save

    儲存目前REPL過程到檔案中

- .load

    載入檔案(`.load /path/to/file.js`)


### REPL與rlwrap

設定環境變數以在REPL上使用rlwrap

rlwrap工具是將GNU的readline函式庫功能加到命令列以加強鍵盤輸入彈性的包裝程式。它攔截鍵盤輸入並提供額外的功能，像是加強版的行編輯及命令歷史紀錄保存。

你必須安裝rlwrap與readline以在REPL中使用其功能。

```
$ apt-get install rlwrap
```

以下是在RPEL上使用rlwrap來改變REPL提示成紫色的示範：

```
NODE_NO_READLINE=1 rlwrap --ppurple node
```

想永久改變，可在我的bashrc檔案加上別名：

```
alias node="NODE_NO_READLINE=1 rlwrap --ppurple node"
```

有要改變提示與顏色：

```
NODE_NO_READLINE=1 rlwrap --ppurple -S "::>" node
```