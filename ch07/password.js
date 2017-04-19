var mysql = require('mysql'),
    crypto = require('crypto');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234'
});

connection.connect();

connection.query('USE nodedatabase');

var username = process.argv[2];
var password = process.argv[3];
var salt = Math.random((Date.now() * Math.random())) + '';

var hashpassword = crypto.createHash('sha512')
    .update(salt + password, 'utf8')
    .digest('hex');

// 建立使用者紀錄
connection.query('INSERT INTO user ' +
    'SET username = ?, passwordhash = ?, salt = ?',
    [username, hashpassword, salt], function (err, result) {
        if (err) console.error(err);
        connection.end();
    });
