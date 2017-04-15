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

以下檢視`request.headers`與`request.rawHeaders`的不同。注意值在`request.headers`中是屬性，但在`request.rawHeaders`是陣列元素，若要分別存取，屬性是陣列的第一個元素，而值是第二個：

```
var http = require('http');

var server = http.createServer().listen(8124);

server.on('request', function (req, res) {

    console.log(req.headers);
    console.log(req.rawHeaders);
    
    // // 輸出host值
    console.log(req.headers.host);
    console.log(req.rawHeaders[0] + ' is ' + req.rawHeaders[1]);

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World!');
});
console.log(`server listening on 8124`);
```

在Node文件中，有些`IncomingMessage`屬性(`statusCode`與`statusMessage`)只能從`HTTP.ClientRequest`物件的回應中取得。除了建構傾聽請求的伺服器外，你也可以使用以`http.request()`函式初始的`ClientRequest類`別建構**發出**請求的用戶端。

為展示伺服器與用戶端功能，這裡建構一個存取本機伺服器的用戶端。在用戶端，建構POST方法發送資料。相較於傾聽request事件，此應用程式傾聽一或多個data事件來取得請求的**區塊資料**(術語：chunk)。應用程式取得chunk直到請求物件收到end事件，然後使用Query String來解析資料並輸出控制台。此時才回傳回應。

```
var http = require('http');
var querystring = require('querystring');

var server = http.createServer().listen(8124);

server.on('request', function(req, res) {
    var body = '';

    // 添加資料
    req.on('data', function(data) {
        body += data;
    });

    // 傳送資料
    req.on('end', function() {
        var post = querystring.parse(body);
        console.log(post);
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World\n');
    });
});
console.log(`server listening on 8124`);
```

下列用戶端範例，它使用`http.ClientRequest`這個可寫入串流的實作，從範例中的req.write()方法可看得出來。

請求的標頭設定內容類型為application/x-www-form-urlencoded，它是用於送出的資料上。

```
var http = require('http');
var querystring = require('querystring');

var postData = querystring.stringify({
    'msg': 'Hello World!'
});

var options = {
    hostname: 'localhost',
    port: 8124,
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
    }
};

var req = http.request(options, function(res) {
    console.log(`STATUS: ` + res.statusCode);
    console.log(`HEADERS: ` + JSON.stringify(res.headers));
    res.setEncoding('utf8');

    // 取得區塊資料
    res.on('data', function(chunk) {
        console.log(`BODY: ` + chunk);
    });

    // 結束回應
    res.on('end', function() {
        console.log(`No more data in response.`);
    });
});

req.on('error', function(e) {
    console.log(`problem with request: ` + e.message);
});

// 輸出資料到請求內容
req.write(postData);
req.end();
```

這一切就是兩個程序互相打招呼，但你實作了雙向的用戶端/伺服器溝通並有機會操作POST資料，並認識HTTP模組幾個類別：`http.ClientRequest`、`http.Server`、`http.IncomingMessage`與`http.ServerResponse`。

還沒討論的類別是`http.Agent`，它用於socket的pooling。Node提供維護連線socket的pool以供處理`http.request()`或`http.get()`所做的請求，後者是簡化的無資料GET請求。如果應用程式發出大量請求，它們可能會因為pool數量限制而產生瓶頸，解決辦法是設定請求agent屬性為false以關閉pooling。

```
var options = {
  hostname: 'localhost',
  port: 8124,
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': postData.length
  },
  agent: false
}
```

也可使用`agent.maxFreeSockets`改變最大pool數量。預設256，但要注意對記憶體與其他資源會產生影響。
