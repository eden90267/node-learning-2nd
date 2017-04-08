'use strict';

let a = [1,2,3];

let b = Buffer.from(a);

console.log(b);          // <Buffer 01 02 03>

let a2 = new Uint8Array([1,2,3]);

let b2 = Buffer.from(a2);

console.log(b2);         // <Buffer 01 02 03>

let b3 = Buffer.alloc(10);

console.log(b3);         // <Buffer 00 00 00 00 00 00 00 00 00 00>

let b4 = Buffer.allocUnsafe(10);

console.log(b4);         // <Buffer 00 00 00 00 00 00 00 00 00 00>