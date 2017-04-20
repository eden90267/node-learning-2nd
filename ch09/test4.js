const test = ['one', 'two', 'three'];

const test2 = {apples: 1, peaches: 2};

// test = test2; // TypeError: Assignment to constant variable.

test[0] = test2.peaches;

test2.apples = test[2];

console.log(test);
console.log(test2);
