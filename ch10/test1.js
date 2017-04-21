var MongoClient = require('mongodb').MongoClient;

// 連結資料庫
MongoClient.connect("mongodb://localhost:27017/exampleDb", function (err, db) {
    if (err) return console.error(err);

    // 存取widgets集合
    db.collection('widgets', function (err, collection) {
        if (err) return console.error(err);

        // 刪除所有文件
        collection.remove(null, { safe: true }, function (err, result) {
            if (err) return console.error(err);
            console.log(`result of remove ${result.result}`);
        });

        //建構兩筆紀錄
        var widget1 = {
            title: 'First Great widget',
            desc: 'greatest widget of all',
            price: 14.99
        };
        var widget2 = {
            title: 'Second Great widget',
            desc: 'second greatest widget of all',
            price: 29.99
        };
        collection.insertOne(widget1, { w: 1 }, function (err, result) {
            if (err) return console.error(err);
            console.log(result.insertedId);

            collection.insertOne(widget2, { w: 1 }, function (err, result) {
                if (err) return console.error(err);
                console.log(result.insertedId);

                collection.find({}).toArray(function (err, docs) {
                    console.log(`found documents`);
                    // console.dir(docs);
                    docs.forEach(function(doc) {
                        console.log(`ID: ${doc._id.toHexString()}`);
                        console.log(`desc: ${doc.desc}`);
                        console.log(`title: ${doc.title}`);
                        console.log(`price: ${doc.price}`);
                    });

                    // 關閉資料庫
                    db.close();
                });
            });
        });
    });
});