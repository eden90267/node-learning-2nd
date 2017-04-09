var vm = require('vm');

var sanbox = {
    process: 'this baby',
    require: 'that',
    console
};

vm.runInNewContext('console.log(process);console.log(require)', sanbox);