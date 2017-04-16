var dns = require('dns');

dns.resolve('oreilly.com', 'MX', function(err, addresses) {
    if (err) return err;
    console.log(addresses);
});