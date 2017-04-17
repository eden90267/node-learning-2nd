# Node與本機系統

這一章提供File System更正規介紹。此外，還會更深入檢視OS特定功能與差異。最後，會討論ReadLine與ZLib兩個模組，他們提供互動的命令列通訊與壓縮功能。

## 探索作業系統

某些技術嘗試隱藏作業系統的差異，而其他技術需大量工作來管理特定OS的特質。Node介於其中。通常你可以建構應用程式並在各處執行，但有時會出現OS差別。Node有時成功，有時需要第三方模組幫助。

直接存取作業系統資訊，可透過OS核心模組。它是實用的工具，幫助我們建構跨平台應用程式。它還能提供目前環境的資源使用量與容量資訊。

OS模組的功能只是提供資訊。舉例來說，如果想確保跨平台功能，你可檢查系統的行結束字元、檢查系統是big-endian(BE)或little-endian(LE)、並直接存取暫存目錄與home目錄：

```
var os = require('os');

console.log(`Using end of line` + os.EOL + 'to insert a new line');
console.log(os.endianness());
console.log(os.tmpdir());
console.log(os.homedir());
```

ubuntu與windows 10機器為LE，EOL字元：行的第二個部分從新行開始。兩系統差異在於暫存目錄與home目錄。

OS模組還提供檢查可用資源的方法：

```
var os = require('os');

console.log(os.freemem());
console.log(os.loadavg());
console.log(os.totalmem());
```

`os.loadavg()`函式為Unix專用：它是1、5與15分鐘負載平均值，反應系統的活動。要取得百分比，將這三個數字乘以100。

`os.freemen()`與`os.totalmen()`函式回傳以位元組計量的記憶體。

`os.cpus()`函式回傳機器的CPU資訊。它回傳CPU花在user、nice、sys、idle與irq的毫秒數。

- user：CPU花在執行使用者行程的時間量
- idle：CPU閒置量
- sys：CPU花在執行系統行程(核心)的時間量
- nice：反映有多少使用者行程被nice：調整優先權以讓行程不要經常執行
- irq：硬體層級的插斷請求

可加總所有值然後找出每個百分比。也可使用提供百分比以及其他資訊的第三方模組。

## 串流與管道

Node核心運用串流技術提供HTTP與其他形式的網路功能，它也提供File System功能。因此我們在深入File System前先討論它。

串流物件是抽象介面，這表示你不會直接建構串流，相對的，你會使用實作串流的物件：例如HTTP請求、File System讀取與寫入串流、ZLib壓縮、或process.stdout。唯一需要實作串流API時機是建構自訂串流。

由於Node有很多物件實作串流介面，Node所有串流都有共同基本功能：

- 可使用setEncoding改變串流資料的編碼
- 可檢查串流是否可讀可寫
- 擷取串流物件，像是**接收資料**或是**連線關閉**，還可加上callback函式
- 可暫停與恢復串流
- 可串聯可讀串流與可寫串流資料

注意可讀與可寫或可讀寫的項目，後者稱為**雙工**串流。