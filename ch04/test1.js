var repl = require('repl');
var context = repl.start({
    prompt: '>> ',
    ignoreUndefined: true,
    replMode: repl.REPL_MODE_STRICT
}).context;

context.request = require('request');
context.underscore = require('underscore');
context.q = require('q');