# Node的開發與上線

除錯、測試、任務管理、上線，與支援是所有Node專案的重要元素，而能自動化是一件好事。

## Node應用程式除錯

使用控制台紀錄除錯，它是檢查變數值與結果的簡易方式，但會影響應用程式的動態與行為，且會因其使用而遮蔽一或製造一問題。使用除錯工具會更好，特別是應用程式不只是一小段時。

Node提供內建除錯工具可用於設定程式中斷點並加上監視器以檢視過程中間的結果。它不是最複雜的工具，但足以檢查問題與陷阱。之後會討論Node Inspector這個更複雜的工具。

### Node的除錯工具

Node提供內建的除錯工具。它不複雜，但堪用。

你可在程式中直接插入debugger命令來插入中斷點：

```
for (var i = 0; i <= test; i++) {
    debugger;
    second += i;
}
```

要開始應用程式的除錯，你可在執行應用程式時指定debug選項：

```
node debug application
```

示範：

```
var fs = require('fs');
var concat = require('./external.js').concatArray;

var test = 10;
var second = 'test';

for (var i = 0; i <= test; i++) {
    debugger;
    second+=i;
}

setTimeout(function() {
    debugger;
    test = 1000;
    console.log(second);
}, 1000);

fs.readFile('./log.txt', 'utf8', function(err, data) {
    if (err) return console.log(err);
    var arry = ['apple', 'orange', 'strawberry'];
    var arry2 = concat(data, arry);
    console.log(arry2);
});
```

應用程式以下列命令啟動：

```
node debug debugtest
```

如果在啟動Node應用程式時加上--debug命令列旗標，你也可透過pid連結除錯工具：

```
node debug -p 3383
```

或透過URI連結除錯工具：

```
node debug http://localhost:3000
```

啟動除錯工具，應用程式會停在第一行並列出程式前面部分：

```
< Debugger listening on 127.0.0.1:5858
debug>  ok
break in debugtest.js:1
> 1 var fs = require('fs');
  2 var concat = require('./external.js').concatArray;
  3
```

可使用list命令列出原始碼。list(10)會列出前後各10行程式。

可用setBreakpoint或縮寫的sb命令加上中斷點。

```
debug>sb(19)
debug>sb('external.js',3)
```

也可使用`watch('expression')`命令直接在除錯工具中設定變數或運算式的監視。

```
debug> watch('test');
debug> watch('second');
debug> watch('data');
debug> watch('arry2'); // arr2 is not defined
```

輸入cont或c會執行應用程式到第一個中斷點。在輸出中，我們看到第一個中斷點以及四個監視項目的值。另外兩個值為<error>。因為應用程式目前還沒有進到定義參數(data)與變數(arry2)的函式範圍內。忽略錯誤繼續執行。

```
debug> c
break in debugtest.js:8
Watchers:
  0: test = 10
  1: second = "test"
  2: data = "<error>"

  6
  7 for (var i = 0; i <= test; i++) {
> 8     debugger;
  9     second += i;
 10 }
```

前進到下一個中斷點之前有幾個命令可嘗試。scripts命令列列出目前載入的版本：

```
debug> scripts
  26: bootstrap_node.js
* 61: debugtest.js
  63: external.js
```

version命令顯示V8的版本。再次輸入c以前進到下一個中斷點。

```
debug> version
5.5.372.41
debug> c
break in debugtest.js:8
Watchers:
  0: test = 10
  1: second = "test0"
  2: data = "<error>"

  6
  7 for (var i = 0; i <= test; i++) {
> 8     debugger;
  9     second += i;
 10 }
```

second變數的值已經改變。不幸的是我們無法清除以debugger陳述建構的中斷點，但我們可以清除`setBreakpoint`或`sb`設定的中斷點。要使用`clearBreakpoint`或`cb`，指定腳本的名稱與中斷點的行號：

```
cb('debugtest.js', 19);
```

也可使用unwatch關閉監視：

```
debug> unwatch('second');
```

沒有值的sb將目前行設定中斷點

```
debug> sb();
```

相較於輸入c，可使用next或n命令逐行執行應用程式。

```
debug> n
break in external.js:3
Watchers:
  0: test = "<error>"
  1: second = "<error>"
  2: data = "<error>"

  1 var concatArray = function(str, arry) {
  2     return arry.map(function(element) {
> 3         return str + ' ' + element;
  4     });
  5 }
```

也可執行應用程式的第23行並使用step或s命令**前進至**模組函式：

```
debug> s
break in external.js:3
Watchers:
  0: test = "<error>"
  1: second = "<error>"
  2: data = "<error>"

  1 var concatArray = function(str, arry) {
> 2     return arry.map(function(element) {
  3         return str + ' ' + element;
  4     });
  5 }
```

※ 繼續執行的錯誤：如果應用程式已在尾端，輸入c或cont會導致除錯工具當掉，沒辦法脫離。這是已知的臭蟲。

backtrace或bt提供目前執行背景的回朔。

```
debug> bt
#0 concatArray external.js:3:3
#1 debugtest.js:23:15
```

兩筆記錄，一個是目前應用程式中的行，另一個代表目前在匯入模組函式的行。

可使用out或o返回應用程式。此命令在處於函式時(無論函式位於區域或模組)返回應用程式。

Node的除錯工具是基於REPL所建構的，可輸入repl命令叫出除錯工具的REPL。如果想殺掉腳本，可使用kill命令。想重新啟動腳本，可用restart，但要注意所有中斷點與監視也會被消除。

### Node檢查工具

Node檢查工具(Inspector)利用Chrome或Opera使用的Blink DevTools除錯工具的除錯功能。

此工具的好處是功能比較複雜，且具除錯視覺環境，壞處是他的系統需求。(windows需.NET Framework 2.0 SDK或Microsoft Visual Studio 2005)

```
npm install -g node-inspector
```

要使用它時，以下列命令執行你的Node應用程式。以Node檢查工具執行時對應應用程式需加上.js副檔名：

```
node-debug application.js
```

如果預設瀏覽器是Chrome或Opera，應用程式會在開發者工具中開啟。

![從Node檢查工具執行debugtest.js](./node-inspector.png)

上面的程式命令可讓你執行應用程式到下一個中斷點、跳到下一個函式呼叫、進入函式、跳出目前函式、清除所有中斷點、與暫停應用程式。

此視覺介面新功能：

- 左邊列出應用程式/模組
- 右邊視窗列出呼叫堆疊、變數範圍(區域與全域)、以及中斷點

※ 更複雜的開發工具：可用Eclipse IDE使用Nodeclipse等工具

## 單元測試

**單元測試**是隔離應用程式的特定元件以供測試的方式。許多Node模組的tests子目錄提供的測試**都是**單元測試。這些單元測試中很多都是使用接下來會討論的Assert模組。

### 以Assert進行單元測試

**斷言測試**評估表示式，其最終結果值為true或false。Node內建有處理這種斷言測試的模組：Assert。它是供Node內部使用，但我們也可使用它。我們只需知道它不是真正的測試架構。

```
var assert = require('assert');
```

舉例，有個測試Utilities模組的應用程式稱為test-util.js。下面的程式碼測試isArray方法：

```
// isArray
assert.equal(true, util.isArray([]));
assert.equal(true, util.isArray(Array()));
...
```

assert.equal()與assert.strictEqual()方法有兩個必要參數：預期的回應與對回應求值的表達式。若表達式求出true且預期回應是true，則assert.equal方法成功且沒有輸出一**不做**任何表示。

但若預期不符，assert.equal方法以例外回應。(e.g. AssertionError: false == true)

assert.equal()與assert.strictEqual()方法有選擇性的第三個參數，用於失敗時代替預設內容顯示：

```
assert.equal(false, util.isArray([]), 'Test 1Ab failed');
```

這是在測試腳本中執行多個測試時識別哪一個測試失敗的實用方式。此訊息在捕捉到例外時顯示並會將訊息輸出。

下列的Assert模組方法取用相同的三個參數，但測試值與表示式關係不同：

- assert.equal
- assert.strictEqual
- assert.notEqual
- assert.notStrictEqual
- assert.deepEqual
- assert.notDeepEqual
- assert.deepStrictEqual
- assert.notDeepStrictEqual