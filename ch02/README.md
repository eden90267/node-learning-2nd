# Node元件：全域物件、事件及非同步本質

瀏覽器上的應用程式與Node.js之間一個基本的差別是二進位資料**緩衝區**。Node現在可存取ES6的ArrayBuffer與具型別的陣列，但Node大部分的二進位資料是以`Buffer`類別實作。

`buffer`是Node的全域物件之一，另一個全域物件是`global`本身。`process`提供Node應用程式與其環境間的橋樑。

事件驅動非同步本質。Node不同處在於我們**等待檔案開啟**，而非使用者點擊按鈕。

事件驅動也意味著timer函式這些老朋友也存在Node中。

## global與process物件

Node兩個基本物件：global與process。

- global類似瀏覽器的全域物件，但有很大不同
- process物件純粹Node專有

### global物件

瀏覽器中，頂層宣告一個變數，它是全域的。Node非如此。當你在Node模組或應用程式宣告一個變數，該變數非全域可用；它受限於該模組或應用程式。可在一個模組中宣告str的“全域”變數並同樣在使用該模組的應用程式中做同樣的宣告，他們不會有衝突。

```
var base = 2;

function addtwo(input) {
    return parseInt(input) + base;
}
```

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>add2</title>
    <script src="add2.js"></script>
</head>
<body>
    <script>
        var base = 10;
        console.log(addtwo(10)); // 20
    </script>
</body>
</html>
```

原因是瀏覽器中所有在JavaScript**函式外**宣告的變數會被加入到同一個全域物件內。

現在使用Node應用程式的addtwo模組：

```
var base = 2;

exports.addtwo = function(input) {
    return parseInt(input) + base;
}
```

```
var addtwo = require('./addtwo').addtwo;

var base = 10;

console.log(addtwo(10));  // 12
```

在Node應用程式中宣告新的base變數不會影響模組中base的值，因為它們存在不同的全域命名空間。

global在環境中共用的是所有全域可用的Node物件與函式的存取，包括`process`物件。可用下列程式執行，它會輸出所有全域可用的物件與函式：

```
console.log(global);
```