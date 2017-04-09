const fs = require('fs');

try {
    let data = fs.readFileSync('./apples.txt', 'utf8');
    console.log(data);
    var adjData = data.replace(/[A|a]pple/g, 'orange');
    fs.writeFileSync('./oranges.txt', adjData);
} catch (error) {
    console.error(error);
}