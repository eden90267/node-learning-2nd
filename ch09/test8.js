function NewObj(name) {
    this.name = name;
}

NewObj.prototype.doLater = function() {
    setTimeout(() => console.log(this.name), 1000);
};

var obj = new NewObj('shelley');
obj.doLater(); // shelley