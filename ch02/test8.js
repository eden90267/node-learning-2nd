var buf1 = new Buffer('this is the way we build our buffer');
var lnth = buf1.length;

// 以舊段落建構新buffer
var buf2 = buf1.slice(19, lnth);
console.log(buf2.toString());  // build our buffer

buf2.fill('*', 0, 5);
console.log(buf2.toString());  // ***** our buffer

// 顯示第一個buffer的影響
console.log(buf1.toString());  // this is the way we ***** our buffer