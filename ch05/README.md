# Node與網路

本章更深入檢視HTTP模組、建構簡單的靜態網頁伺服器以及檢視簡化網路開發體驗的Node核心模組。

## HTTP模組：伺服器與用戶端

別期待HTTP模組能開發Apache或Nginx等具複雜功能的網頁伺服器。如同Node文件所述，它是**低階**、**專注於串流與訊息解析**。然而它提供了Express等複雜功能的基礎。

HTTP模組支援數個物件，包括`http.Server`，是`http.createServer()`回傳的物件。可嵌入一個callback函式來處理網頁請求，也可使用獨立的事件，因`http.Server`繼承`EventEmitter`。

```
var http = require('http');

var server = http.createServer().listen(8124);

server.on('request', function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
});

console.log('server listening on 8124');
```

也可傾聽其他事件，像是連線(connect)，或用戶請求升級(upgrade)。後者發生於用戶端請求升級HTTP的版本或不同的通訊協定。

※ HTTP.Server類別實際上是基於Net.Server實作。TCP提供傳輸層，而HTTP提供應用層。

用於回應網頁請求的callback函式支援兩個參數：請求與回應。

response參數是http.ServerResponse型別的物件，它是**可寫入的串流**，具支援建構

- 回應標頭的`response.writeHead()`
- 寫入回應資料的`response.write()`
- 結束回應的`response.end()`

等函式。

request參數是IncomingMessage類別的實例，它是可讀串流。下列是可從請求存檔的一些資訊：

- `request.headers`：請求/回應標頭物件
- `request.httpVersion`：HTTP請求版本
- `request.method`：http.Server請求才有，回傳HTTP動作(GET或POST)
- `request.rawHeader`：原始標頭
- `request.rawTrailers`：原始的trailer