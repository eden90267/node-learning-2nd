var timer = setTimeout(function() {
    console.log(`Hello ${name}`);
}, 30000, 'Shelley');

timer.unref();

console.log(`waiting on timer...`);