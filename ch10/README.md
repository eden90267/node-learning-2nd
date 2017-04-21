# Node全端開發

這表示熟悉資料系統、API、用戶端開發一全都使用一種技術：Node。

最常見Node全端開發形式是MEAN一MongoDB、Express、AngularJS與Node。全端開發可由其他工具組成。但Express還是很常見，使用Node會需要熟悉Express。

## Express應用程式架構

建構Node網頁應用程式的任務不簡單，因此Express之類的應用程式很受歡迎：它提供大部分功能。

```
npm install express --save
```

app.js：

```
var express = require('express');
var app = express();

app.get('/', function(req, res) {
    res.send('Hello World');
});

app.listen(3000, function() {
    console.log(`Example app listening on port 3000!`);
});
```

`app.get()`函式處理所有GET請求，請求與回應物件具預設相同功能，加上Express提供的功能。舉例：回應網頁請求可用`res.write()`與`res.end()`，也可使用Express加強版的`res.send()`。

也可使用Express應用程式產生器來產生應用程式骨架。接下來會使用它，因它更具細節與複雜的Express應用程式。

```
sudo npm install express-generator -g
```

```
express bookapp
```

```
cd bookapp
npm install
```

就這樣，你已建構出第一個骨架的Express應用程式。可使用下列命令執行它(Linux、OS X)：

```
DEBUG=bookapp:* npm start
```

Windows的Command：

```
set DEBUG=bookapp:* & npm start
```

也可使用`npm start`啟動應用程式不除錯。

此應用程式會產生幾個子目錄與檔案：

![express sub directory and file](./express_file.png)

公開的靜態檔案位於public子目錄下。動態內容樣板檔案位於views。routes子目錄帶有傾聽網頁請求與產生網頁的網路端點應用程式。

bin目錄下的www檔案是應用程式的啟動腳本。它是轉換為命令列應用程式的Node檔案。檢視package.json，會看到它列為應用程式的啟動腳本。

```
{
  "name": "bookapp",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "start": "node ./bin/www"
  },
  "dependencies": {
    "body-parser": "~1.17.1",
    "cookie-parser": "~1.4.3",
    "debug": "~2.6.3",
    "express": "~4.15.2",
    "jade": "~1.11.0",
    "morgan": "~1.8.1",
    "serve-favicon": "~2.4.2"
  }
}
```

為深入應用程式，接下來會檢視app.js這個應用程式進入點。

app.js。它匯入更多的模組，大部分均提供網頁應用程式所需的**中介軟體**支援。匯入模組包括應用程式指定的部分，位於routes目錄：

```
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();
```

以下是模組與其目的：

- express

    Express應用程式

- path

    Node檔案路徑核心模組

- serve-favicon

    從路徑或緩衝區服務favicon.ico檔案的中介軟體

- morgan

    HTTP請求紀錄程序

- cookie-parser

    解析cookie標頭與產生req.cookie

- body-parser

    提供四種不同請求內容的解析程序(但不處理多部份內容)

每個中介軟體模組可對HTTP伺服器與Express操作。

※ 何謂中介軟體？中介軟體系統 / 作業系統 / 資料庫與應用程式之間的介質。在Express中，中介軟體是應用程式鏈的一部分。各具有與HTTP請求有關的特定功能一處理它或為了其他中介軟體應用程式對請求執行某種操作。

下一段app.js程式透過`app.use()`函式載入中介軟體(讓它在應用程式中可用)。中介軟體載入順序很重要。

這一段程式包括定義view引擎的設置：

```
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
```

最後一個`app.use()`呼叫參考Express內建的中介軟體之一。`express.static`用於處理所有靜態檔案。所有靜態檔案以載入中介軟體時指定的路徑相對關係服務，此例中為public目錄。

view引擎設置的`app.set()`函式，你會使用幫助對應資料的樣版引擎。default：Jade。引擎設置定義樣板檔案(view)的目錄與使用何種引擎(Jade)。

index.jade裡面的值(title)在樣板中如何呈現需要到app.js檔案查看。

```
app.use('/', index);
app.use('/users', users);
```

這些是應用程式的端點，它是回應用戶端請求的功能。頂端請求('/')由routes目錄的index.js處理，使用者由user.js檔案處理。

在index.js檔案中，我們看到Express的router，它提供回應處理功能。router的動作模式：

```
app.METHOD(PATHM HANDKER)
```

method是HTTP方法，Express支援常見的get、post、put與delete，以及merge、search、head、options等較少見的方法。path是網頁路徑，handler是處理請求的函式。

```
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
```

資料(區域變數)與view在res.render()函式呼叫中相遇。view用於index.jade檔案，可看到樣板中title屬性的值作為資料傳入函式。

app.js檔案其餘部分是錯誤處理。