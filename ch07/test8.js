var crypto = require('crypto');

var password = '1234';
var hashpassword = crypto.createHash('sha1').update(password).digest('hex');

console.log(hashpassword);