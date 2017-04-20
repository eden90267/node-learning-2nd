# Node 與 ES6

## Strict模式

它會影響ES6功能運用。

```
"use strict";
```

有其他方式可強制應用程式相依模組使用strict模式，例如：--strict_mode旗標，但不建議。強制模組使用strict會產生錯誤或預期外的結果。只要使用在你所控制的應用程式或模組程式就好。

strict模式：

- 沒先定義的變數會錯誤
- 函式參數只能宣告一次
- 不能在eval表達式中使用與eval呼叫同層級的變數

等等。

這節特別關注是strict模式不能用**八進位實字**。

前一章設定檔案權限，不能使用八進位實字設定權限(`0666`)。

你可將前綴的零以0o取代，strict模式可以執行。

```
fs.open('./new.txt', 'a+', 0o666, function(err, fd) {
```

fs.open()函式也可以接受八進位值作為字串：

```
fs.open('./new.txt', 'a+', '0666', function(err, fd) {
```

但此語法不好，還是要改用前述的格式。

strict模式使用在某些ES6擴充功能是必要的。例如：類別、let。

## let與const

let：區塊中宣告變數

```
"use strict"

if (true) {
    let sum = 100;
}
console.log(sum); // ReferenceError: sum is not defined
```

應用程式必須在strict模式中才可用let。(測試後不用)

var宣告的變數會hosting，let則不會。

```
console.log(test); // undefined
var test;
```

```
"use strict";

console.log(test); // ReferenceError: test is not defined
let test;
```

var用於需要應用程式或函式層級範圍，讓let只用於區塊層級。

唯讀值參考const陳述。如果值是原始型別，它是不可變的。如果值為物件，則無法指派新物件或原始型別，但可改變物件屬性。

以下程式指派會安靜的失敗(新版會直接報錯)

```
const MY_VAL = 10;

MY_VAL = 100; // TypeError: Assignment to constant variable.

console.log(MY_VAL);
```

注意const是值參考。如果指派陣列或物件給const，可改變物件/陣列的成員。

```
const test = ['one', 'two', 'three'];

const test2 = {apples: 1, peaches: 2};

test = test2; // TypeError: Assignment to constant variable.

test[0] = test2.peaches;

test2.apples = test[2];

console.log(test);
console.log(test2);
```

很多關於const的誤解來自於原始型別與物件值的行為差異，且名稱本身似乎暗示常數(靜態)指派。若想要的是不可變性且指派物件給const，可對物件使用`Object.freeze()`來提供**淺不可變性**。

Node文件顯示在匯入模組時使用const。雖不能防止修改其屬性，但可暗示其他程式設計師此項目之後不會重新指派新值。

如同let，const也有區塊層級範圍。與let不同，它不需要strict模式。

## 箭頭函式

箭頭函式提供兩個作用，首先它提供簡化語法。

```
const http = require('http');

http.createServer((req, res) => {
    res.writeHead(200);
    res.write('Hello');
    res.end();
}).listen(8124);
```

還可簡化(大括弧、return陳述)：

```
var decArray = [23, 255, 122, 5, 16, 99];
var hexArray = decArray.map((element) => element.toString(16));

console.log(hexArray); // [ '17', 'ff', '7a', '5', '10', '63' ]
```

箭頭函式不只簡化語法，它還重新定義this。

```
function NewObj(name) {
    this.name = name;
}

NewObj.prototype.doLater = function() {
    setTimeout(function() {
        console.log(this.name);
    }, 1000);
};

var obj = new NewObj('shelley');
obj.doLater(); // undefined
```

原因是this在物件建構元中定義該物件，但setTimeout函式是在後面的實例中。我們可在環境中加上另一個變數，通常是self，來解決這個問題。

```
function NewObj(name) {
    this.name = name;
}

NewObj.prototype.doLater = function() {
    var self = this;
    setTimeout(function() {
        console.log(self.name);
    }, 1000);
};

var obj = new NewObj('shelley');
obj.doLater(); // shelley
```

在箭頭函式中，this總是設定成**所在背景應有的值**；此例為new物件：

```
function NewObj(name) {
    this.name = name;
}

NewObj.prototype.doLater = function() {
    setTimeout(() => console.log(this.name), 1000);
};

var obj = new NewObj('shelley');
obj.doLater(); // shelley
```

※ 箭頭函式有些問題，像是如何回傳空物件或參數的存取。

## 類別

```
var util = require('util');
var eventEmitter = require('events').EventEmitter;
var fs = require('fs');

exports.InputChecker = InputChecker;

function InputChecker(name, file) {
    this.name = name;
    this.writeStream = fs.createWriteStream(`./${file}.txt`, {
        'flags': 'a',
        'encoding': 'utf8',
        'mode': 0666
    });
};

util.inherits(InputChecker, eventEmitter);
InputChecker.prototype.check = function check(input) {
    var command = input.toString().trim().substr(0, 3);
    if (command == 'wr:') {
        this.emit('write', input.substr(3, input.length));
    } else if (command == 'en:') {
        this.emit('end');
    } else {
        this.emit('echo', input);
    }
}
```

```
'use strict';

const util = require('util');
const eventEmitter = require('events').EventEmitter;
const fs = require('fs');

class InputChecker extends eventEmitter {

    constructor(name, file) {
        super(); // 呼叫父類別以叫用父類別的函式
        this.name = name;
        this.writeStream = fs.createWriteStream(`./${file}.txt`, {
            'flags': 'a',
            'encoding': 'utf8',
            'mode': 0o666
        });
    }

    check(input) {
        let command = input.toString().trim().substr(0, 3);
        if (command == 'wr:') {
            this.emit('write', input.substr(3, input.length));
        } else if (command == 'en:') {
            this.emit('end');
        } else {
            this.emit('echo', input);
        }
    }

}

exports.InputChecker = InputChecker;
```

使用**新類別化**模組的應用程式維持不變：

```
var InputChecker = require('./class').InputChecker;

// 測試新物件與事件處理程序
var ic = new InputChecker('Shelley', 'output');

ic.on('write', function (data) {
    this.writeStream.write(data, 'utf8');
});
ic.addListener('echo', function (data) {
    console.log(`${this.name} wrote ${data}`);
});

ic.on('end', () => process.exit());

process.stdin.setEncoding('utf8');
process.stdin.on('data', function (input) {
    ic.check(input);
});
```

## promise與Bluebird

Node早期開發階段，callback或promise有過爭論，結果callback贏了。

promise現在是ES6一部分，你可在你的Node應用程式使用它們。但若要對Node核心功能使用promise，需自行實作或使用提供支援的模組。

這一節檢視一個非常受歡迎的promise模組：Bluebird。

※ 另一個使用Bluebird的理由是效能。

相較於套疊的callback，ES6的promise功能使用分支，成功由一個分支處理，失敗由另一分支處理。最佳示範是將Node檔案系統應用程式promise化一改callback結構為promise。

```
var fs = require('fs');
fs.readFile('./apples.txt', 'utf8', function(err, data) {
    if (err) {
        console.error(err.stack);
    } else {
        var adjData = data.replace(/apple/g, 'orange');

        fs.writeFile('./oranges.txt', adjData, function(err) {
            if (err) console.error(err);
        });
    }
});
```

現在使用Bluebird將此範例bromise化。

Bluebird的`promisifyAll()`函式用於promise化所有的File System函式。相較於`readFile()`，我們使用`readFileAsync()`，它是該函式的promise版本。

```
var promise = require('bluebird');
var fs = promise.promisifyAll(require('fs'));

fs.readFileAsync('./apples.txt', 'utf8')
    .then(function (data) {
        var adjData = data.replace(/apple/g, 'orange');
        return fs.writeFileAsync('./oranges.txt', adjData);
    })
    .catch(function (error) {
        console.error(error);
    });
```

可看出promise版本的程式比較清楚。特別是任何數量的呼叫只需要一個錯誤處理程序。

更複雜的範例：

```
var promise = require('bluebird');
var fs = promise.promisifyAll(require('fs'));

fs.readFileAsync('./apples.txt', 'utf8')
  .then(function(data) {
      var adjData = data.replace(/apple/g, 'orange');
      return fs.mkdirAsync('./fruit/');
  })
  .then(function(adjData) {
      return fs.writeFileAsync('./fruit/oranges.txt', adjData); // undefined
  })
  .catch(function(error) {
      console.error(error);
  });
```

處理回傳陣列的實例，例如使用File System的readdir()函式來取得目錄內容?

這要靠`map()`等陣列處理函式。

```
var promise = require('bluebird');
var fs = promise.promisifyAll(require('fs'));

fs.readdirAsync('./apples/').map(filename => {
    fs.readFileAsync('./apples/' + filename, 'utf8')
        .then(function(data) {
            var adjData = data.replace(/apple/g, 'orange');
            return fs.writeFileAsync('./oranges/' + filename, adjData);
        })
        .catch(function(error) {
            console.error(error);
        })
})
.catch(function(error) {
    console.error(error);
});
```