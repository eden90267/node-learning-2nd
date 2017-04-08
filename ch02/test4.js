'use strict'

let buf = new Buffer("This is my pretty example");
let json = JSON.stringify(buf);

console.log(json);

let buf2 = new Buffer(JSON.parse(json));
console.log(buf2.toString()); // This is my pretty example


console.log(buf2.toString('ascii'));