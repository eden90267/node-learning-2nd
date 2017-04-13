var fs = require('fs');
var Console = require('console').Console;

var output = fs.createWriteStream('./stdout.log');
var errorOutput = fs.createWriteStream('./stderr.log');

// 自訂簡單紀錄工具
var logger = new Console(output, errorOutput);

// 使用方式如同console
var count = 5;
logger.log(`count: %d`, count);

// stdout.log檔案：count: 5