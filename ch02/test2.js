process.stdin.setEncoding('utf8')

process.stdin.on('readable', function() {
    var input = process.stdin.read();

    if (input != null) {
        // 輸出文字
        process.stdout.write(input);

        if (input.trim() == 'exit')
            process.exit(0);
    }
})