"use strict";

const util = require('util');
const { EventEmitter } = require('events');
const fs = require('fs');

function InputChecker(name, file) {
    this.name = name;
    this.writeStream = fs.createWriteStream('./' + file + '.txt',
        {
            'flags': 'a',
            'encoding': 'utf8',
            'mode': 0o666 // 使用ES6樣式實字的記號法
        });
}

util.inherits(InputChecker, EventEmitter);

InputChecker.prototype.check = function check(input) {
    let command = input.trim().substr(0, 3);
    if (command === 'wr:') {
        this.emit('write', input.substr(3, input.length));
    } else if (command === 'en:') {
        this.emit('end');
    } else {
        this.emit('echo', input);
    }
}

// 測試
let ic = new InputChecker('Shelley', 'output');

ic.on('write', function (data) {
    this.writeStream.write(data, 'utf8');
});

ic.on('echo', function (data) {
    process.stdout.write(ic.name + ' wrote ' + data);
});

ic.on('end', function () {
    process.exit();
});

// 設定編碼後擷取輸入
process.stdin.setEncoding('utf8');
process.stdin.on('readable', function() {
    let input = process.stdin.read();
    if (input !== null)
        ic.check(input);
})