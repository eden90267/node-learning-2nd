const fs = require('fs');
fs.readFile('./apples.txt', 'utf8', function(err, data) {
    if (err) {
        console.error(err);
    } else {
        let adjData = data.replace(/[A\a]pple/g, 'orange');
        fs.writeFile('./oranges.txt', adjData, function(err) {
            if (err) console.error(err);
        });
    }
});