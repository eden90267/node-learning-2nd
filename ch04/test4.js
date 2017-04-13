var test = {
    a:{
        b:{
            c:{
                d: 'test'
            }
        }
    }
};

// 只輸出兩層
console.log(test);

// 輸出三層
var str = JSON.stringify(test, null, 3);
console.log(str);