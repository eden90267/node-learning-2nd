var http = require('http');
var querystring = require('querystring');

var postData = querystring.stringify({
    'msg': 'Hello World!'
});

var options = {
    hostname: 'localhost',
    port: 8124,
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
    }
};

var req = http.request(options, function(res) {
    console.log(`STATUS: ` + res.statusCode);
    console.log(`HEADERS: ` + JSON.stringify(res.headers));
    res.setEncoding('utf8');

    // 取得區塊資料
    res.on('data', function(chunk) {
        console.log(`BODY: ` + chunk);
    });

    // 結束回應
    res.on('end', function() {
        console.log(`No more data in response.`);
    });
});

req.on('error', function(e) {
    console.log(`problem with request: ` + e.message);
});

// 輸出資料到請求內容
req.write(postData);
req.end();