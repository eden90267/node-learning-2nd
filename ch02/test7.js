var buf = new Buffer(4);

buf.writeUInt8([0x63], 0);
buf.writeUInt8([0x61], 1);
buf.writeUInt8([0x74], 2);
buf.writeUInt8([0x73], 3);

console.log(buf.toString());  // cats
