var dns = require('dns');

dns.lookup('oreilly.com',function(err, address, family) {
    if (err) return console.log(err);

    console.log(address); // 回傳的IP位址
    console.log(family);  // 值是4或6，視位址為IPv4或IPv6-6而定。
});