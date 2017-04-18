var zlib = require('zlib');
var fs = require('fs');

var gzip = zlib.createGzip();

var inp = fs.createReadStream('./phoenix5a.png');
var out = fs.createWriteStream('./phoenix5a.png.gz');

inp.pipe(gzip).pipe(out);