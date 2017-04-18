var readline = require('readline');

// 建構新的介面
var rl = readline.createInterface(process.stdin, process.stdout);

// 問問題
rl.question(">>What is the meaning of life? ", function(answer) {
    console.log(`About the meaning of life, you said ` + answer);
    rl.setPrompt(">> ");
    rl.prompt();
});

// 關閉介面的函式
function closeInterface() {
    rl.close();
    console.log(`Leaving Readline`);
}

// 傾聽.leave
rl.on('line', function(cmd) {
    if (cmd.trim() == '.leave') {
        closeInterface();
        return;
    }
    console.log(`repeating command: ` + cmd);
    rl.prompt();
});

rl.on('close', function() {
    closeInterface();
});