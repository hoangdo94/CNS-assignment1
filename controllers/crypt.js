var crypto = require('crypto');
var zlib = require('zlib');
var fs = require('fs');
var db = require('./db');

var zip = zlib.createGzip();
var unzip = zlib.createGunzip();

var encrypt = function(options, callback) {
    var fileSize = fs.statSync(options.input).size;
    var readSize = 0;
    db.tmp.insert({
        progress: 0,
    }, function(err, doc) {
        var id = doc._id;
        var timeStart = Date.now();

        var cipher = crypto.createCipheriv(options.algorithm, options.key, options.iv);
        var r = fs.createReadStream(options.input);
        var w = fs.createWriteStream(options.output);

        if (options.compress) {
            r.pipe(zip).pipe(cipher).pipe(w);
        } else {
            r.pipe(cipher).pipe(w);
        }

        r.on('data', function(chunk) {
            readSize += chunk.length;
            var progress = Math.round(readSize * 10000 / fileSize)/100;
            db.tmp.update({_id: id}, {$set: {progress: progress}});
        });
        w.on('finish', function() {
            db.per.insert({
            	_id: id,
            	task: 'encrypt',
                algorithm: options.algorithm,
                compress: options.compress || false,
                size: fileSize,
                input: options.input,
                output: options.output,
                timeStart: timeStart,
                duration: Date.now() - timeStart,
            }, function() {
                setTimeout(function() {
                    db.tmp.remove({_id: id})
                }, 30000);
            });
        });

        callback(id, fileSize);
    });
};
var decrypt = function(options, callback) {
    var fileSize = fs.statSync(options.input).size;
    var readSize = 0;
    db.tmp.insert({
        progress: 0,
    }, function(err, doc) {
        var id = doc._id;
        var timeStart = Date.now();

        var decipher = crypto.createDecipheriv(options.algorithm, options.key, options.iv);
        var r = fs.createReadStream(options.input);
        var w = fs.createWriteStream(options.output);

        if (options.compress) {
            r.pipe(decipher).pipe(unzip).pipe(w);
        } else {
            r.pipe(decipher).pipe(w);
        }

        r.on('data', function(chunk) {
            readSize += chunk.length;
            var progress = Math.round(readSize * 10000 / fileSize)/100;
            db.tmp.update({_id: id}, {$set: {progress: progress}});
        });
        w.on('finish', function() {
            db.per.insert({
            	_id: id,
            	task: 'decrypt',
                algorithm: options.algorithm,
                compress: options.compress || false,
                size: fileSize,
                input: options.input,
                output: options.output,
                timeStart: timeStart,
                duration: Date.now() - timeStart,
            }, function() {
                setTimeout(function() {
                    db.tmp.remove({_id: id})
                }, 30000);
            });
        });

        callback(id, fileSize);
    });

}

function generateHash(path, alg, callback) {
    var hash = crypto.createHash(alg);
    var r = fs.createReadStream(path);
    r.on('data', function(chunk) {
        hash.update(chunk);
    });
    r.on('end', function() {
        return callback(null, hash.digest('hex'));
    });
    r.on('error', function(err) {
        return callback(err, null);
    });
}

module.exports = {
    encrypt: encrypt,
    decrypt: decrypt,
    generateHash: generateHash,
}