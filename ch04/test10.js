var util = require('util');

var today = new Date();

var test = {
    a: {
        b: {
            c: {
                d: 'test'
            },
            c2: 3.50
        },
        b2: true
    },
    a2: today
};

util.inspect.styles.boolean = 'blue';

// 以util.inspect直接格式化
var str = util.inspect(test, { depth: 4, colors: true });
console.log(str);

// 使用console.dir與選項輸出
console.dir(test, { depth: 4, colors: true });

// 使用基本的console.log輸出
console.log(test);

// 和JSON.stringify
console.log(JSON.stringify(test, null, 4));