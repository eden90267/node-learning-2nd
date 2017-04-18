# 網路、Socket與安全性

Node應用程式核心必然依賴兩個主要基礎物件：網路與安全性。討論網路就離不開socket。

一旦超出單一獨立的機器就得考慮安全性。

## 伺服器、串流與socket

許多Node核心API與建構傾聽特定類型服務有關。

- HTTP模組建構傾聽HTTP請求的網頁伺服器
- Transmission Control Protocol(TCP)伺服器
- Transport Layer Security(TLS)伺服器
- User Datagram Protocol(UDP) socket

### socket與串流

socket是**通訊的端點**，**網路**socket是網路上兩台電腦上應用程式間通訊的端點。串流資料可作為緩衝區中的二進位資料或Unicode字串傳輸。兩種類型的資料均以**封包**傳輸：部分資料拆開成較小的片段。結束封包(FIN)是特別的封包，由socket發出以表示傳輸完成。

想像兩個人以對講機通話。對講機是端點，通訊的socket。兩個或以上的人要互相通話時，他們必須進入同一個廣播頻率。然後當某一個人想要與他人通訊，他們按下對講機上的按鈕，以某種識別形式連接正確的人。他們還使用“over”一字表示結束並進入傾聽模式。通訊持續直到一方發出“over and out”，這表示通訊結束，每次只有一個人可以說話。

對講機通訊串流稱為**半雙工**，因為每次只有一個方向進行。**全雙工**通訊串流容許雙向通訊。

此概念同樣適用於Node的串流。讀寫檔案的串流是半雙工串流的例子：串流支援可讀介面或可寫介面，但無法同時支援。ZLib壓縮串流是全雙工串流的例子，能夠同時讀寫。

### TCP socket與伺服器

TCP提供網路服務與電子郵件等網際網路應用程式通訊的平台。它提供用戶端與伺服器socket間可靠的資料傳輸。TCP提供HTTP等應用層的基礎設施。

建構TCP伺服器，相較於傳遞requestListener以及獨立的回應與請求物件給伺服器建構函式，TCP的callback函式唯一參數是可收發的socket實例。

以下示範建構一個TCP伺服器。伺服器socket它傾聽兩個事件：收到資料與用戶端關閉連線。然後它輸出所收到的資料到控制台並將資料送回用戶端。

TCP伺服器還將listening事件與error事件加入事件處理程序。

簡單的TCP伺服器，傾聽埠8124：

```
var net = require('net');
const PORT = 8124;

var server = net.createServer(function (conn) {
    console.log(`connected`);

    // 收到資料
    conn.on('data', function (data) {
        console.log(data + ' from ' + conn.remoteAddress + ' ' + conn.remotePort);
        conn.write('Repeating: ' + data);
    });

    // 用戶端關閉連線
    conn.on('close', function () {
        console.log(`client closed connection`);
    });

}).listen(PORT);

server.on('listening', function () {
    console.log(`listening on ${PORT}`);
});

server.on('error', function (err) {
    if (err.code == 'EADDRINUSE') {
        console.warn('Address in use, retrying...');
        setTimeout(() => {
            server.close();
            server.listen(PORT);
        }, 1000);
    } else {
        console.error(err);
    }
});
```

建構TCP socket，可傳入選擇性的參數物件，由兩個值組成：`pauseOnConnect`與`allowHalfOpen`，兩者預設false。

`allowHalfOpen`設為true指示socket從用戶端接收FIN封包時不要發送FIN。這樣可以保持socket開啟供寫入(非讀取)。為關閉socket，你必須使用`end()`函式。

`pauseOnConnect`設為true讓連線通過但不讀取資料。為開始讀取資料，呼叫socket的`resume()`方法。

測試伺服器，可使用Linux或OS X的netcat工具(nc)等TCP用戶端應用程式。下列連線使用netcat連上埠8124的伺服器應用程式，從文字檔案輸出資料到伺服器：

```
nc eden.com 8124 < mydata.txt
```

可自行建構TCP用戶端應用程式。範例：資料以緩衝區傳送，但我們可使用`setEncoding()`讀取utf8字串。socket的`write()`方法用於傳輸資料。用戶端應用程式也在傾聽函式加上兩個事件：接收資料的data與伺服器關閉連線的close。

```
var net = require('net'),
    client = new net.Socket();
client.setEncoding('utf8');

// 連接伺服器
client.connect('8124', 'localhost', function() {
    console.log(`connected to server`);
    client.write(`Who needs a browser to communicate?`);
});

// 收到資料時發送給伺服器
process.stdin.on('data', function(data) {
    client.write(data);
});

// 收到返回資料時輸出到控制台
client.on('data', function(data) {
    console.log(data);
});

// 伺服器關閉
client.on('close', function() {
    console.log(`connection is closed`);
});
```

用戶端送出數個字串後伺服器的控制台輸出：

```
connected
Who needs a browser to communicate? from ::ffff:127.0.0.1 52222
Hey, hey, hey, hey-now.
 from ::ffff:127.0.0.1 52222
Don't be mean, we don't have to be mean.
 from ::ffff:127.0.0.1 52222
Cuz remember, no matter where you go,
 from ::ffff:127.0.0.1 52222
there you are.
 from ::ffff:127.0.0.1 52222
```

用戶端與伺服器之間的連線持續直到使用Ctrl-C殺掉其中之一。還開啟的socket會收到close事件並輸出到控制台。伺服器可服務來自多個用戶端的多個連線，因為相關函式均為非同步的。

※ IPv4對應IPv6位址：IPv4對上IPv6時加上額外的::ffff

相對於綁定TCP伺服器的埠，可直接綁定socket。以下範例，Unix socket是伺服器上的路徑名稱。讀寫權限可用於控制應用程式存取，讓它比網際網路socket更有優勢。

該範例還修改錯誤處理程序讓應用程式重新啟動且socket已經使用時切斷此Unix socket連結。在上線環境中，你會想要確定在執行工作前沒有其它用戶端使用該socket。

```
var net = require('net'),
    fs = require('fs');

const unixsocket = '/somepath/nodesocket';

var server = net.createServer(function (conn) {
    console.log(`connected`);

    conn.on('data', function (data) {
        conn.write('Repeating: ' + data);
    });

    conn.on('close', function () {
        console.log(`client closed connection`);
    });
}).listen(unixsocket);

server.on('listening', function () {
    console.log(`listening on ${unixsocket}`);
});

// 若結束並重新啟動，必須切斷socket連結
server.on('error', function (err) {
    if (err.code == 'EADDRINUSE') {
        fs.unlink(unixsocket, function () {
            server.listen(unixsocket);
        });
    } else {
        console.log(err);
    }
});

// 使用process處理非由應用程式管理的例外
process.on('uncaughtException', function (err) {
    console.log(err);
});
```

用戶端應用程式(唯連結點不同)：

```
var net = require('net'),
    client = new net.Socket();
client.setEncoding('utf8');

// 連接伺服器
client.connect('/somepath/nodesocket', function() {
    console.log(`connected to server`);
    client.write('Who needs a browser to communicate?');
});

// 接收資料時發送給伺服器
process.stdin.on('data', function(data) {
    client.write(data);
});

// 收到返回資料時輸出到控制台
client.on('data', function(data) {
    console.log(data);
});

// 伺服器關閉
client.on('close', function() {
    console.log(`connection is closed`);
});
```

### UDP / Datagram socket

TCP需要兩通訊端點間專用連線。UDP是無連線的協定，這表示不保證兩端點間的連線。為此，UDP較不可靠。另一方面，UDP通常較TCP快，這讓它實時運用以及Voice over Internet Protocol(VoIP)上更受歡迎，這種情況下TCP的連線需求會嚴重影響信號品質。

UDP模組識別名稱為dgram：

```
require('dgram');
```

為建構UDP socket，使用createSocket方法，傳入socket類型一udp4或udp6。也可傳入callback函式以傾聽事件。與TCP發送的訊息不同，使用UDP發送的訊息必須以緩衝區而非字串發送。

範例：發送訊息給終端機的datagram用戶端

```
var dgram = require('dgram');

var client = dgram.createSocket("udp4");

process.stdin.on('data', function (data) {
    console.log(data.toString('utf8'));
    client.send(data, 0, data.length, 8124, "eden.com", function(err, bytes) {
        if (err) return console.error('error: ' + err);
        console.log(`successful`);
    });
});
```

範例：綁定埠8124並傾聽訊息的UDP socket伺服器

```
var dgram = require('dgram');

var server = dgram.createSocket('udp4');

server.on('message', function(msg, rinfo) {
    console.log(`Message: ${msg} from ${rinfo.address}:${rinfo.port}`);
});

server.bind(8124);
```

這邊並未在發送/接收訊息時呼叫用戶端或伺服器的close方法：兩者間沒有維護連線一socket能夠發送訊息與接收通訊而已。

## 門衛

網路應用程式的安全性不只確保人們不會存取應用程式伺服器。安全性很複雜又麻煩。幸好Node已具有安全性所需的數個元件，只需在正確位置與時間引用。

### 設置TLS/SSL

伺服器與用戶端之間的安全通訊透過Secure Socket Layer(SSL)與它的升級版Transport Layer Security(TLS)進行。

TLS/SSL連線需要用戶端與伺服器間的handshake。handshake時，用戶端(通常是browser)讓伺服器知道它支援何種安全性功能。伺服器挑選功能然後發送SSL憑證。它包括公鑰。用戶端確認憑證並使用伺服器的鍵產生一個隨機數字送回伺服器。然後伺服器使用它的秘鑰解開此數字以啟動安全通訊。

為能成功運作，你必須產生公司鑰與憑證。對線上系統來說，憑證必須由**權威機構**簽署，但開發環境可使用**自簽憑證**。這樣browser會對應用程式產生警告，但使用者不會存取開發網站。

※ 防止自簽憑證警告：可透過localhost存取Node應用程式以避免瀏覽器警告。也可使用開放測試的Lets Encrypt來避免使用自簽憑證。

用於產生必要檔案的工具是OpenSSL。

```
openssl genrsa -des3 -out site.key 2048
```

此命令產生私鑰，以Triple-DES加密並以ASCII可讀的privacy-enhanced mail(PEM)格式儲存。

你會被要求輸入密碼。下一個步驟建構certificate-signing request(CSR)時需要此密碼。

產生CSR會提示輸入密碼，還會被問到很多問題。最主要是Common Name，它是網站主機名稱一舉例來說：eden.com。提供執行應用程式的主機名稱。

```
openssl req -new -key site.key -out site.csr
```

私鑰需要一個passphrase。問題是每次啟動伺服器都必須提供此passphrase。在上線系統中提供此passphrase是個問題。下一步驟是從私鑰移除此passphrase。首先重新命名私鑰：

```
mv site.key site.key.org
```

然後輸入：

```
openssl rsa -in site.key.org -out site.key
```

如果有移除passphrase，要確保檔案只能被受信任的使用者/群組讀取以保障伺服器的安全性。

下一任務是產生自簽憑證。下面命令建構有效期限365天的憑證：

```
openssl x509 -req -days 365 -in site.csr -signkey site.key -out final.crt
```

現在已經具有使用TLS/SSL與HTTPS所需的所有元件。

## 使用HTTPS

HTTPS是HTTP協定的變化，結合SSL將資料加密以確保網站身份如我們所想與資料抵達時完整無變造。

加上HTTPS支援類似加上HTTP支援，有個options物件提供公鑰加密與簽署憑證。HTTPS預設埠為443。

建構非常簡單的HTTPS伺服器

```
var fs = require('fs'),
    https = require('https');

var privateKey = fs.readFileSync('site.key').toString();
var certificate = fs.readFileSync('final.crt').toString();

var options = {
    key: privateKey,
    cert: certificate
};

https.createServer(options, function(req, res) {
    res.writeHead(200);
    res.end("Hello Secure World\n");
}).listen(443);
```

公鑰與憑證是公開且其內容可同步讀取。

執行此應用程式，會需要root權限(443綁定埠，綁定小於1024需要root權限)，可用其他埠執行，例如3000。