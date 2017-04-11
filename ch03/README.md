# Node模組與Node套件管理員(npm)

## Node模組系統概要

Node模組系統運用**CommonJS模組系統**的模式，它是一種建構模組供利用的方式。此系統的核心是開發者所遵守的約定以確保模組間可以交互運作。

Node的CommonJS模組系統實作需求為：

- 支援取用模組識別名稱並回傳匯出API的`require`函式
- 模組名稱為字元字串，可包含斜線(用於路徑辨識)
- 模組必須明確的匯出要顯露的部分
- 變數是模組私用的

### Node如何找到與載入模組？

```
var http = require('http');
var name = require('url').parse(req.url, true).query.name; // 存取匯出物件的特定屬性
var spawn = require('child_process').spawn; // 存取特定模組物件
```

當應用程式請求一個模組，發生好幾件事。

首先是Node檢查模組是否已經被快取住(第一次存取快取該模組)。

如果模組未被快取，Node會檢查是否為原生模組。原生模組是預編譯過的二進位檔案。如果是原生模組，函式用於原生模組，回傳匯出的功能。

若模組未快取且非原生模組，則建構新的Module物件並回傳模組的exports屬性。它基本上回傳開放給應用程式的功能。

此模組也會被快取著，若為了某種原因要從快取中刪掉模組：

```
delete require('./circle.js');
```

下次應用程式請求模組時會重新載入。

Node載入模組還必須解析它的位置，找尋模組檔案時會檢查階層結構。

首先，核心模組有優先權。可將模組命名為http，但載入http時Node會從核心取出模組。唯一能使用http作為模組名稱的辦法是**同時提供路徑以區別核心模組**。

```
var http = require('/home/mylogin/public/modules/http.js');
```

如果你提供絕對與相對路徑檔名，Node會使用該路徑：

```
var someModule = require('./somemodule.js');
```

副檔名非必須，提供的模組名稱若沒副檔名:

1. Node先從目前目錄找尋有.js副檔名的模組。如果找到，載入該模組。
2. 沒找到，會查詢.json的檔案。如果找到會以JSON格式載入。
3. 最後，Node找尋副檔名為.node的模組

如果模組是使用npm安裝的，無須提供路徑，只要列出模組名稱：

```
var async = require('async');
```

Node從node_modules目錄找尋模組，階層搜尋包括：

1. 應用程式的node_modules子目錄
2. 應用程式父目錄的node_modules
3. 向上找尋node_modules到最頂層(root)
4. 最後，從全域安裝的模組中找尋

可使用require.resolve()函式檢查載入哪個模組：

```
console.log(require.resolve('async'));
```

它回傳解析過的模組位置。

如果以檔案夾名稱作為模組，Node會尋找帶有main屬性標示要載入的模組檔案的package.json檔案：

```
{ "name": "somemodule",
  "main": "./lib/somemodule.js"}
```

如果Node找不到package.json檔案，它會尋找index.js或index.node檔案來載入。

如果所有搜尋都失敗，會收到一個錯誤。

每個Module物件包裝的模組都有require函式，我們以全域的require叫用模組的函式。Module.require()函式會呼叫Module._load()這個內部函式。它執行以上所說的所有功能。唯一例外是若請求為REPL，則有獨特的處理方式。

如果模組是命令列實際叫用的主模組(應用程式)，它會被指派給全域require物件的require.main屬性。

```
console.log(require);
{ [Function: require]
  resolve: [Function: resolve],
  main:
   Module {
     id: '.',
     exports: {},
     parent: null,
     filename: '/Users/eden90267/Desktop/node-learning-2nd/ch03/test1.js',
     loaded: false,
     children: [],
     paths:
      [ '/Users/eden90267/Desktop/node-learning-2nd/ch03/node_modules',
        '/Users/eden90267/Desktop/node-learning-2nd/node_modules',
        '/Users/eden90267/Desktop/node_modules',
        '/Users/eden90267/node_modules',
        '/Users/node_modules',
        '/node_modules' ] },
  extensions: { '.js': [Function], '.json': [Function], '.node': [Function] },
  cache:
   { '/Users/eden90267/Desktop/node-learning-2nd/ch03/test1.js':
      Module {
        id: '.',
        exports: {},
        parent: null,
        filename: '/Users/eden90267/Desktop/node-learning-2nd/ch03/test1.js',
        loaded: false,
        children: [],
        paths: [Object] } } }
```

Node以下列方式包裝所有腳本：

```
function (module, exports, __filename, ...) {}
```

Node以不具名函式包裝模組(main或其他)，只有顯露模組開發者想顯露的部分，由於這些模組在使用時屬性前置有模組名稱，它們不會與區域宣告的變數衝突。

### 沙盒與VM模組

JavaScript開發者學習到的第一件事是盡力避免eval()，原因eval()在同一應用程式的背景下執行JavaScript，會與小心撰寫JavaScript的同一信任狀態下執行未知或任意的一段JavaScript。

如果為某種原因要在Node應用程式中執行一段未知的JavaScript，可使用VM模組以從沙盒執行該腳本。

腳本可預先使用`vm.Script`物件編譯，或直接作為vm呼叫函式的一部分。有三種方式：

第一種是`script.runInNewContext()` or `vm.runInNewContext()`，在新的背景下執行腳本，且腳本無法存取區域變數或全域物件。相對的，有個`contextified`沙盒傳入給函式。

範例：沙盒有兩個全域值一與兩個Node全域物件同名一但為重新定義的：

```
var vm = require('vm');

var sanbox = {
    process: 'this baby',
    require: 'that'
};

vm.runInNewContext('console.log(process);console.log(require)', sanbox);
```

發生錯誤，因為`console`物件不是腳本的執行期背景的一部分，可這麼做：

```
var vm = require('vm');

var sanbox = {
    process: 'this baby',
    require: 'that',
    console
};

vm.runInNewContext('console.log(process);console.log(require)', sanbox);
```

但這會牴觸腳本建構全新背景的用意。如果你想讓腳本存取全域控制台(或其他)物件，改用runInThisContext()。

範例：使用Script物件示範背景如何引用全域物件，但不能引用區域物件。

```
var vm = require('vm');

global.count1 = 100;
var count2 = 100;

var txt = 'if (count1 === undefined) var count1 = 0; count1++;' +
          'if (count2 === undefined) var count2 = 0; count2++;' +
          'console.log(count1);console.log(count2);';

var script = new vm.Script(txt);
script.runInThisContext({filename: 'count.vm'});

console.log(count1);
console.log(count2);
```

結果：

```
101
1
101
100
```

count2是區域變數，必須在背景中定義。沙盒腳本中修改區域變數不會影響應用程式中同名的區域變數。

如果沒有宣告在另一個背景上執行的腳本中count2會收到錯誤。因沙盒內容函式的displayErrors選項default是true。另一個runInThisContext()的選項是filename。還有timeout，它是容許腳本結束(與拋出錯誤)前執行的毫秒數。filename選項用於指定腳本執行時顯示在堆疊紀錄中的檔名。如果想指定Script物件的檔名，你必須在建構Script物件而非呼叫背景函式時將其傳入：

```
var vm = require('vm');

global.count1 = 100;
var count2 = 100;

var txt = 'count1++;' +
          'count2++;' +
          'console.log(count1);console.log(count2);';

var script = new vm.Script(txt, {filename: 'count.vm'});
try {
script.runInThisContext();    
} catch (err) {
    console.log(err.stack);
}
```

除filename差別外，Script還在背景函式呼叫中支援另外兩個全域選項：`displayErrors`與`timeout`。

相較在應用程式中直接撰寫程式碼，我們可從檔案中將其載入。

```
if (count1 === undefined) var count1 = 0; count1++;
if (count2 === undefined) var count2 = 0; count2++;
console.log(count1);console.log(count2);
```

可預先編譯它並以下列方式在沙盒中執行：

```
var vm = require('vm');
var fs = require('fs');

global.count1 = 100;
var count2 = 100;

var script = new vm.Script(fs.readFileSync('script.js', 'utf8'));
script.runInThisContext({filename: 'count.vm'});

console.log(count1);
console.log(count2);
```

最後一個沙盒函式是runInContext()。它也取用一個沙盒，但此沙盒必須在呼叫函式前背景化(直接建構的背景)。

```
var vm = require('vm');
var util = require('util');

var sandbox = {
    count1: 1
};

vm.createContext(sandbox);

if (vm.isContext(sandbox)) console.log('contextualized');

vm.runInContext('count1++; counter=true;', sandbox, {filename: 'context.vm'});

console.log(util.inspect(sandbox));
```

結果

```
contextualized
{ count1: 2, counter: true }
```

runInContext()函式支援runInThisContext()與runInNewContext()函式支援的三個選項。

Script執行函式與直接在VM中執行函式的差別是Script物件預先編譯程式且在建構物件時傳入檔名而非作為函式呼叫的選項。

## 深入探索npm

許多Node功能來自第三方模組:

- 路由器模組
- 操作關聯式模組
- 文件資料庫模組
- 樣板模組
- 測試模組
- 甚或是付款機制模組

比起原始檔下載安裝，使用npm更簡單。

Node安裝附有npm，但不一定是最新版。可更新版本：

```
$ npm install npm -g
```

以下列命令取得npm命令的概要：

```
$ npm help npm
```

模組可全域與區域安裝。如果正進行隔離的專案請共用同一個系統的人並不需要存取該模組，區域安裝是最好的方式。

```
$ npm install modulename
```

以安裝request為例:

```
$ npm install request
```

npm不只安裝Request，它還會檢查模組相依性並安裝它。

模組安裝完成後，你可在本地目錄下node_modules目錄找到該模組，相依檔案也是。

如果想全域安裝，使用-g或--global選項：

```
$ npm install request -g
```

如果使用linux，安裝全域模組別忘了使用`sudo`。

有些模組，包括命令列應用程式，必須全域安裝。這些範例安裝套件登錄於npm網站。你也可以安裝檔案系統中檔案夾內的模組，或從本機與URL取得tarball：

```
npm install http://somecompany.com/somemodule.tgz
```

如果套件有分版本，可安裝指定版本：

```
npm install modulename@0.1
```

如果不須使用某模組，可移除：

```
npm uninstall modulename
```

下列命令告訴npm檢查新模組並執行找到的更新：

```
npm update
```

或更新單一模組

```
npm update modulename
```

如果只想檢查套件是否過期：

```
npm outdated
```

再一次，你可以對單一模組執行此命令。

以`list`、`ls`、`la`或`ll`列出安裝過的套件與相依檔案。

la與ll選項提供更多資訊。舉例：`npm la request`列出相依檔案的細節。

有時輸出會顯示警告，像是缺少相依檔案或需要舊版模組，則安裝該模組或必要的版本:

```
npm install jsdom@0.2.0
```

也可使用`-d`旗標直接安裝所有相依模組。舉例來說，在模組的目錄下輸入此命令:

```
npm install -d
```

如果想要安裝還沒對npm登記的模組版本，可從Git程式庫直接安裝:

```
npm install https://github.com/visionmedia/express/tarball/master
```

但須謹慎使用，安裝尚未釋出版本的模組並執行npm更新，npm登記的版本會覆寫掉你正使用的版本。

檢視哪些模組全域安裝：

```
npm ls -g
```

可使用config命令了解你的npm安裝，下列命令列出npm組態設定：

```
npm config list
```

可取得更深入的組態設定：

```
npm config ls -l
```

可透過命令列修改或移除組態設定

```
npm config delete keyname
npm config set keyname value
```

或直接修改組態檔案

```
$ npm config edit
```

※ 強烈建議不要碰。除非你非常確定修改作用

可使用任何關鍵字搜尋模組

```
$ npm search html5 parser
NAME                      | DESCRIPTION          | AUTHOR          | DATE       | VERSION  | KEYWORDS
fabric                    | Object model for…    | =asturur…       | 2017-03-25 | 1.7.9    |
context-parser            | HTML5 Context Parser | =neraliu…       | 2015-07-10 | 2.0.1    |
352-fabric                | Object model for…    | =dvideby0       | 2017-01-24 | 1.7.8    |
safe-html                 | A whitelist-based…   | =almost         | 2016-03-23 | 1.0.0    |
parse-srcset              | A spec-conformant…   | =albell         | 2016-12-10 | 1.0.2    |
browser-x                 | A partial…           | =aui            | 2017-02-13 | 0.0.1-b… |
parsonic                  | Ultra fast HTML5…    | =oabtm          | 2016-11-19 | 2.1.0    |
html5                     | HTML5 HTML parser,…  | =aredridel      | 2014-08-12 | 1.0.5    |
html5-parser              | html5 parser for…    | =niklasvh       | 2014-09-18 | 0.1.1    |
neutron-html5parser       | Small Pure-JS HTML5… | =munawwar       | 2015-04-16 | 0.2.0    |
html5-papandreou          | HTML5 HTML parser,…  | =maartenwinter… | 2016-05-30 | 0.3.15-… |
gumbo-node                | A node.js wrapper…   | =eric.oconnell  | 2013-08-22 | 0.1.2    |
mp4js                     | A modern MP4 parser… | =lmaa           | 2013-11-03 | 0.0.2    |
kaj                       | A Kaj to HTML5…      | =jakwings       | 2015-05-15 | 0.11.1   |
react-native-html5        | html, html5 parser…  | =pillys         | 2016-06-25 | 0.2.2    |
dedom                     | A partial…           | =mbostock       | 2015-01-23 | 0.0.1    |
id3js                     | A modern ID3 parser… | =43081j         | 2014-05-11 | 1.1.3    |
html5-chase               | HTML5 HTML parser,…  | =infinityatlas  | 2012-10-05 | 0.3.9    |
```

第一次執行搜尋，npm會建構索引，會花幾分鐘。

※ 收到"registry error parsing json"錯誤：可使用npm鏡像來完成任務。下列命令使用歐洲鏡像：`npm --registry http://registry.npmjs.eu/ search html5 parser`(執行會失敗...)

npm網站提供可瀏覽的模組紀錄與最新模組相依排行一也就是其他模組或Node應用程式最常使用的模組。

第一次操作npm，你或許會注意到輸出後面的一組警告訊息：

- 第一行表示無法找到package.json檔案
- 其餘訊息是找不到package.json有關的警告

npm文件建議你建構package.json檔案來維護你的區域相依性。

要在專案目錄建構預設的package.json檔案，執行以下命令：

```
npm init --yes
```

如此就會在專案目錄建構預設的package.json檔案。

- 姓名、專案名稱等有預設值的一組基本問題
- JSON加上description
- JSON加上repository

此外，想更新此檔案以反映新安裝的模組，使用下列命令：

```
npm install request --save-dev
```

這會儲存模組名稱與版本到package.json檔案中的devDependencies欄位中。你也可儲存模組到生產相依性中。

要自動儲存相依性，你可以修改npmrc檔案。你可根據每個使用者(~/.npmrc)、每個專案(/path/project/.npmrc)、全域($PREFIX/etc/npmrc)，與使用內建組態檔案(/path/to/npm/npmrc)加入。

使用下列命令修改個人設定以自動的儲存相依性：

```
npm config set save=true
npm config set save-exact=true
```

這會在你安裝新套件，自動加上`--save`旗標(將套件儲存在相依性)與`--save-exact`旗標(實際儲存一個版本而非npm的預設語意版本範圍)。

還有許多不同的組態設定可調整，見npm文件。

## 建構與發佈你自己的Node模組

你必須採取幾個額外的步驟以將你的JavaScript函式庫轉換成Node使用的模組。

### 建構模組

假設有個JavaScript函式庫函式稱為`concatArray`，它取用一個字串與一個字串陣列並結合兩者成為一個新的陣列:

```
function concatArray(str, array) {
    return array.map(function(element) {
        return str + ' ' + element;
    });
}
```

為將你的JavaScript函式庫轉換成Node使用的模組，你必須使用exports物件匯出要顯露的函式:

```
exports.concatArray = function(str,array) {
    return array.map(function(element) {
        return str + ' ' + element;
    });
}
```

現在匯出的函式可用於你的應用程式中：

```
var newArray = require('./arrayfunctions.js');

console.log(newArray.concatArray('hello', ['test1','test2']));
```

也可以建構由物件建構元或函式組成的模組並使用`module.exports`匯出。

例如受到大量相依的Mime模組建構了Mime()函式：

```
function Mime() { ... }
```

使用prototype屬性加入函式：

```
Mime.prototype.define = function(map) {...}
```

建構預設實例：

```
var mime = new Mime();
```

指派Mime函式到它自己同名的屬性：

```
mime.Mime = Mime;
```

然後匯出該實例：

```
module.exports = mime;
```

然後你可以在你的應用程式中使用各種mime函式：

```
var mime = require('mime');
console.log(mime.lookup('phoenix5a.png')); .. image/png
```

### 打包整個目錄

你可以將模組製作成獨立的JavaScript檔案，集中在一個目錄下。Node可以載入目錄內容，只要內容依據兩種方式之一安排。

第一種方式是提供帶有目錄資訊的`package.json`檔案，其結構帶有其他資訊，但name與main這兩筆記錄與模組套件有關：

```
{ "name": "mylibrary",
  "main": "./mymodule/mylibrary.js"
}
```

- name：模組名稱
- main：模組進入點

第二種方式是載入目錄下的index.js或index.node檔案作為模組進入點

為何提供目錄而非單一模組？最可能原因是你使用了現有的JavaScript函式庫，你只是提供“包裝”檔案以exports陳述包裝顯露的函式。另一原因是你的函式庫很大，想拆開以利修改。

無論是什麼原因，要注意所有匯出的物件必須在Node所載入的主檔中。

### 釋出模組的準備工作

準備要公開模組時，你會想要登記在npm的紀錄中。

package.json。實際上是依循CommonJS模組系統的建議。

package.json檔案中引入的建議欄位有：

- name

    套件名稱一必要
    
- description

    套件說明
    
- version

    符合語意版本需求的目前版本編號一必要
    
- keywords

    搜尋關鍵字陣列
    
- maintainers

    套件維護者陣列(包括姓名、郵件與網站)
    
- contributors

    套件貢獻者陣列(包括姓名、郵件與網站)
    
- bugs

    提出錯誤的URL

- licenses

    授權陣列

- repository

    套件庫

- dependencies

    套件與版本的需求
    
只有name與version欄位是必須的，但建議包括這些欄位。幸好npm讓這檔案很容易建構：

```
npm init
```

此工具會提示每個必要/建議欄位，完成時產生package.json檔案。

範例：InputChecker物件

1. `node_modules/inputcheck/index.js`

    ```
    var inputChecker = require('inputcheck').InputChecker;

    // 測試新物件與事件處理程序
    var ic = new inputChecker('Shelley', 'output');

    ic.on('write', function(data) {
        this.writeStream.write(data, 'utf8');
    });

    ic.addListener('echo', function(data) {
        console.log(`${this.name} wrote ${data}`);
    });

    ic.on('end', function() {
        process.exit();
    });

    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', function(input) {
        ic.check(input);
    })
    ```

2. 建構package.json

    ```
    {
      "name": "inputcheck",
      "version": "1.0.0",
      "description": "Looks for and implements commands from input",
      "main": "index.js",
      "scripts": {
          "test": "node test/test.js"
      },
      "keywords": [
          "command",
          "check"
      ],
      "author": "Shelley Powers",
      "license": "ISC"
    }
    ```
    
3. test/test.js

    ```
    var inputChecker = require('inputcheck').InputChecker;

    // 測試新物件與事件處理程序
    var ic = new inputChecker('Shelley', 'output');

    ic.on('write', function(data) {
        this.writeStream.write(data, 'utf8');
    });

    ic.addListener('echo', function(data) {
        console.log(`${this.name} wrote ${data}`);
    });

    ic.on('end', function() {
        process.exit();
    });

    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', function(input) {
        ic.check(input);
    })
    ```
    
4. 修改package.json

    ```
    "scripts": {
      "test": "node test/test.js"
    }
    ```
    
5. 執行測試應用程式

    ```
    npm test
    ```
    
6. 為模組建構tarball壓縮檔案。(公布模組可略)

一旦我們提供了必須提供的內容，我們就可以釋出該模組。

### 公佈模組

npm團隊提供釋出Node模組必要內容的詳細指引：[Developer Guide](https://docs.npmjs.com/misc/developers)。

此文件規定一些package.json檔案的額外需求。除了已建構欄位外，我們還需加上`directories`欄位與一些檔案夾，像之前提到的test與doc：

```
"directories": {
  "doc": ".",
  "test": "test",
  "example": "examples"
}
```

Guide建議公佈前測試模組是否能乾淨安裝。為進行此測試，在模組的根目錄輸入下列命令

```
$ npm install . -g
/usr/local/lib
└── inputcheck@1.0.0
```

此時我們已經測試過inputChecker模組、修改package.json檔案以加上檔案夾、並確定套件可以安裝。

加入成npm使用者：

```
npm adduser
```

最後還有一件事：

```
npm publish
```

我們可提供tarball或目錄的路徑。如同Guide的警告，目錄下的所有東西都會露出，除非使用`.npmignore`列出要略過的package.json中列出的檔案。但最好就在釋出模組前移除不需要的檔案。

公佈後一且原始碼也上傳至GitHub，此模組已經正式可以供他人使用。

## 發現Node模組與三個必備模組

Async、Commander與Underscore。

### 以Async管理callback

套疊callback逐漸堆高的毀滅金字塔。解決這個問題的一個常見方案之一是**Async模組**。它以更線性與可管理的模式替換典型的callback模式。Async支援的非同步模式有：

- waterfall

    依序呼叫函式，所有的結果以陣列傳遞給最後的callback(也有人稱作series或sequence)

- series

    依序呼叫函式，選擇性的將結果以陣列傳遞給最後的callback

- parallel

    平行執行函式，完成時將結果傳給最後一個callback

- whilst

    重複呼叫一個函式，只在前面的測試回傳false或發生錯誤時呼叫最後一個callback

- queue

    在限制數量下平行呼叫函式，新函式排隊等待其中一個函式完成

- until

    重複呼叫一個函式，只在後處理測試回傳false或發生錯誤時呼叫最後一個callback

- auto

    根據需求呼叫函式，每個函式收到前一個callback的結果

- iterator

    每個函式呼叫下一個，能夠個別存取下一個迭代

- apply

    持續的函式，其參數已經結合其他流程控制函式

- nextTick

    在事件迴圈的下一輪根據`process.nextTick`呼叫callback
    
Async模組還提供管理集合的功能，像是它自己的`forEach`、`map`與`filter`，以及其他功能性函式，包括memoization。這裡感興趣的是它的流程控制處理功能。

```
npm install async
```

如前述，Async提供各種非同步模式的流程控制功能，包括serial、parallel，與waterfall。

範例：使用`async.waterfall`以`fs.readFile`開啟並讀取資料檔案，執行同步字串替換，然後以`fs.writeFile`輸出字串回檔案。

```
var fs = require('fs'),
    async = require('async');

async.waterfall([
    function readData(callback) {
        fs.readFile('./data/data1.txt', 'utf8', function(err, data) {
            callback(err, data);
        });
    },
    function modify(text, callback) {
        var adjdata = text.replace(/somecompany\.com/g, 'burningbird.net');
        callback(null, adjdata);
    },
    function writeData(text, callback) {
        fs.writeFile('./data/data1.txt', text, function(err) {
            callback(err, text);
        })
    }
], function(err, result) {
    if (err) {
        console.error(err.message);
    } else {
        console.log(result);
    }
});
```

async.waterfall有兩個參數：

- 工作陣列
- 選擇性的最終callback函式

每個非同步任務函式是`async.waterfall`陣列的一個元素，每個函式需要一個callback作為最後一個參數。此callback函式讓我們能鏈接非同步callback結果而不需實際上套疊程式。如你所見，每個函式的callback如同使用套疊callback一樣的處理一無需在每個函式中檢查錯誤。Async在每個callback中檢視第一個參數是否為錯誤物件。如果我們在callback中傳遞錯誤物件，行程會在此結束並呼叫最終的callback。然後最終的callback處理錯誤或最後的結果。

※ 使用具名函式，可簡化除錯與錯誤處理。

更複雜的套疊callback：

從目錄取得物件、檢查檔案、讀取檔案測試、修改、並寫回紀錄結果

```
var fs = require('fs'),
    async = require('async'),
    _dir = './data/';

var writeStream = fs.createWriteStream('./log.txt', {
    'flags': 'a',
    'encoding': 'utf8',
    'mode': 0666
});

async.waterfall([
    function readDir(callback) {
        fs.readdir(_dir, function(err, files) {
            callback(err, files);
        });
    },
    function loopFiles(files, callback) {
        files.forEach(function(name) {
            callback(null, name);
        });
    },
    function checkFile(file, callback) {
        fs.stat(_dir + file, function(err, stats) {
            callback(err, stats, file);
        });
    },
    function readData(stats, file, callback) {
        if (stats.isFile()) {
            fs.readFile(_dir + file, 'utf8', function(err, data) {
                callback(err, file, data);
            });
        }
    },
    function modify(file, text, callback) {
        var adjdata = text.replace(/somecompany\.com/g, 'burningbird.net');
        callback(null, file, adjdata);
    },
    function writeDate(file, text, callback) {
        fs.writeFile(_dir + file, text, function(err) {
            callback(err, file);
        });
    },
    function logChange(file, callback) {
        writeStream.write('changed ' + file + '\n', 'utf8', function(err) {
            callback(err);
        })
    }
], function(err){
    if (err) {
        console.error(err.message);
    } else {
        console.log('modified files');
    }
});
```

注意有更多的資料傳遞給callback。大部分函式需要檔名與文字，因此會在最後幾個方法中傳遞。任何數量的資料可在方法中傳遞，只要第一個參數是錯誤文件(無錯誤則null)且每個函式最後一個參數是callback函式。

我們不須對每個非同步的任務函式檢查錯誤，因為Async在每個callback中檢查錯誤，如果發現錯誤則停止處理並呼叫最終callback函式。

其他Async流程控制方法：async.parallel與async.serial，以類似方式執行，以第一個方法參數為任務陣列以及選擇性的callback做為第二個參數，但它們處理非同步方式如你預期不同。