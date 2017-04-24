var assert = require('assert');

try {
    var val = 3;
    assert.fail(val, 3, 'Fails Not Equal', '==');
} catch (e) {
    console.log(e);
}
