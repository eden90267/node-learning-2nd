var qs = require('querystring');

var q = 'somedomain.com/?value1=valueone&value1=valueoneb&value2=valuetwo';

console.log(require('url').parse(q, true).query);

q = 'value1=valueone&value1=valueoneb&value2=valuetwo';

console.log(qs.parse(q));