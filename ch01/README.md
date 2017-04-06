# Node環境

第一個Hello,World：

```
/**
 * Created by eden90267 on 2017/4/6.
 */
var http = require('http');

const port = 8124;

http
    .createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World\n');
    })
    .listen(port, function () {
        console.log(`Server running at http://127.0.0.1:${port}`);
    });
```

http模組以`require`陳述匯入，並指派給一個區域變數。`http.createServer()`函式初始化網頁伺服器。函式的參數中，我們看到一個基本結構：**callback**。它是傳遞網頁請求與回應給程式碼以處理網頁請求並提供回應的不具名函式。

JavaScript是單執行緒的，而Node在單執行緒環境中透過**事件迴圈**與特定事件發生時會觸發的callback函式來模擬非同步環境。上述範例，當收到網頁請求，callback就會被呼叫。

