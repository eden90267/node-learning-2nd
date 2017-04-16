var dns = require('dns');

dns.lookup('oreilly.com', {all: true}, function(err, family) {
    if (err) return console.log(err);

    console.log(family);
});