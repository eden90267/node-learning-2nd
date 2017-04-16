var qs = require('querystring');

var q = {
    msg: 'Hello World!'
};

console.log(qs.stringify(q));