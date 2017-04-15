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


## 建構靜態網頁伺服器

思考建構簡單但可用的檔案伺服器需求，我們或許會列出以下步驟：

1. 建構HTTP伺服器並傾聽請求
2. 請求到來時，解析請求URL以判斷檔案位置
3. 檢查檔案是否存在
4. 如果不存在則據實回應
5. 如果檔案存在，開啟檔案供讀取
6. 準備回應標頭
7. 輸出檔案到回應
8. 等待下一個請求

執行這些功能只需要核心模組(有一個例外，稍後說明)。建構HTTP伺服器並讀取檔案，需要HTTP與File System模組。此外，我們想定義根目錄的全域變數，或使用預先定義的`__dirname`。

```
var http = require('http'),
    fs = require('fs'),
    base = '/Users/eden90267/Desktop/node-learning-2nd/ch05/public_html';

http.createServer(function(req, res) {
    var pathname = base + req.url;
    console.log(pathname);
}).listen(8124);

console.log(`Server web running at 8124`);
```

以一個index.html檔案測試此應用程式會產生類似下列的輸出：

```
/Users/eden90267/Desktop/node-learning-2nd/ch05/public_html/index.html
```

可在開啟檔案前測試檔案是否存在。`fs.stat()`函式在檔案不存在時回傳錯誤。

讀取檔案：`fs.readFile()`，但它會嘗試將檔案完全讀進記憶體中。此外，同時間一個檔案可能會有多個請求。`fs.readFile()`的規模不太能放大。

相較於`fs.readFile()`，此應用程式使用`fs.createReadStream()`方法以預設值來建構讀取串流。它直接將檔案內容導到HTTP回應物件。由於串流在結束時送出結束信號，我們無須使用end方法：

```
res.setHeader('Content-Type', 'text/html');

// 建構並導向可讀串流
var file = fs.createReadStream(pathname);
file.on("open", function() {
    // 200表示沒有錯誤
    res.statusCode = 200;
    file.pipe(res);
});
file.on("error", function(err) {
    console.log(err);
    res.writeHead(403);
    res.write('file missing, or permission problem');
    res.end();
});
```

讀取串流有兩個事件：open與error。open事件於串流就緒時發出，若有問題則發出error。什麼錯誤？檔案可能在狀態檢查過程中消失、權限不夠、或檔案其實是子目錄。由於此時不知什麼問題，只能產生403錯誤，它涵蓋大部分的可能。我們輸出訊息，是否顯示視瀏覽器而定。

此應用程式呼叫open事件的callback函式中的pipe方法。

靜態檔案伺服器範例：

```
var http = require('http'),
    fs = require('fs'),
    base = '/Users/eden90267/Desktop/node-learning-2nd/ch05/public_html';

http.createServer(function (req, res) {
    var pathname = base + req.url;
    console.log(pathname);

    fs.stat(pathname, function (err, stats) {
        if (err) {
            console.log(err);
            res.writeHead(404);
            res.write('Resource missing 404\n');
            res.end();
        } else {
            res.setHeader('Content-Type', 'text/html');

            // 建構並導向可讀串流
            var file = fs.createReadStream(pathname);
            file.on("open", function () {
                // 200表示沒有錯誤
                res.statusCode = 200;
                file.pipe(res);
            });
            file.on("error", function (err) {
                console.log(err);
                res.writeHead(403); // 403：權限拒絕
                res.write('file missing, or permission problem');
                res.end();
            });
        }
    });

}).listen(8124);

console.log(`Server web running at 8124`);
```

以簡單的html檔案測試：

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test</title>
</head>
<body>
    <img src="./phoenix5a.png">
</body>
</html>
```

另外以不存在檔案測試。錯誤在使用`fs.stat()`時出現，回傳404訊息給瀏覽器並輸出檔案不存在或為目錄的訊息給控制台。

接下來嘗試讀取權限被拿掉的檔案。這一次會由讀取串流捕捉到錯誤，發送無法讀取的錯誤給browser，發送權限錯誤給控制台。並回傳合適的HTTP狀態碼403檔案權限拒絕。

最後，以另一個HTML5的video元素檔案測試：

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Video</title>
</head>
<body>
    <video id="meadow" controls>
        <source src="videofile.mp4">
        <source src="videofile.ogv">
        <source src="videofile.webm">
    </video>
</body>
</html>
```

IE 10時video元素不能作用。控制台輸出提供原因：

雖IE 10能播放MP4影片，但三個影片的回應標頭是text/html，瀏覽器會忽略內容型別並正確播放，但IE 10不會一這樣才對，才能發現應用程式錯誤。

它經過修改以檢查檔案的副檔名並在回應標頭回傳正確的MIME型別。可使用已存在的模組：Mime。

Mime模組可針對檔案名稱(無論有無路徑)回傳合適的MIME型別，並能回傳某個內容型別的副檔名。

回傳的內容型別用於回應標頭以及輸出到控制台：

```
// 內容型別
var type = mime.lookup(pathname);
console.log(type);
res.setHeader('Content-Type', type);
```

這樣使用IE 10存取有影片元素的檔案時影片會正常顯示。對所有瀏覽器而言，回傳的內容型別是正確的。

然而存取目錄非檔案還是有問題，輸出給控制台的錯誤：

```
{ Error: EISDIR: illegal operation on a directory, read errno: -21, code: 'EISDIR', syscall: 'read' }
```

我們不只需要檢查資源是否存在，還要檢查它是檔案或目錄。如果存取的是目錄，我們可顯示它的內容或輸出錯誤一開發者決定。

還有一項修改。Linux的根目錄沒問題，但Windows會有問題：

- Windows機器上沒有`/Users/eden90267/Desktop/node-learning-2nd/ch05/public_html`目錄
- Windows支援反斜線而非斜線

使用核心path模組將路徑字串**正規化**。`path.normalize()`函式取用一個字串並回傳經過環境正規化的字串。

```
var pathname = path.normalize(base + req.url);
```

最終版：

```
var http = require('http'),
    fs = require('fs'),
    mime = require('mime'),
    path = require('path');

// 可使用預定義的__dirname作為指定Node應用程式工作目錄的方式
// 若不是範例中存取與Node應用程式不同位置的檔案，你應該使用__dirname
// var base = '/Users/eden90267/Desktop/node-learning-2nd/ch05/public_html';

http.createServer(function (req, res) {
    var pathname =
        // path.normalize(base + req.url);
        path.normalize(__dirname + req.url);
    console.log(pathname);

    fs.stat(pathname, function (err, stats) {
        if (err) {
            res.writeHead(404);
            res.write('Resource missing 404\n');
            res.end();
        } else if (stats.isFile()) {
            // 內容型別
            var type = mime.lookup(pathname);
            console.log(type);
            res.setHeader('Content-Type', type);

            // 建構並導向可讀串流
            var file = fs.createReadStream(pathname);
            file.on("open", function () {
                // 200表示沒有錯誤
                res.statusCode = 200;
                file.pipe(res);
            });
            file.on("error", function (err) {
                console.log(err);
                res.writeHead(403); // 403：權限拒絕
                res.write('file permission');
                res.end();
            });
        } else {
            res.writeHead(403);
            res.write('Directory access is forbidden');
            res.end();
        }
    });

}).listen(8124);

console.log(`Server web running at 8124`);
```

建構靜態網頁伺服器有許多小問題要解決，因此人們使用更複雜的系統：Express。

## 使用Apache代理Node應用程式


