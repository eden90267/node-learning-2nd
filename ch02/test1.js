process.stdin.on('readable', function() {
    var input = process.stdin.read();

    if (input != null) {
        // 輸出文字
        process.stdout.write(input);
    }
})