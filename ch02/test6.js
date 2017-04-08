let buf = new Buffer(3);
buf.write('€', 'utf8');

console.log(buf.length);  // 3