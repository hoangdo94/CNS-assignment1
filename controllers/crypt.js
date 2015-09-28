var crypto = require('crypto');
var zlib = require('zlib');
var NodeRSA = require('node-rsa');
var fs = require('fs');
var db = require('./db');

function encrypt(options, callback) {
    var fileSize = fs.statSync(options.input).size;
    var readSize = 0;
    db.tmp.insert({
        progress: 0,
    }, function(err, doc) {
        var id = doc._id;
        var timeStart = Date.now();

        var key = new Buffer(options.key,'hex');
        var iv = new Buffer(options.iv,'hex');
        var cipher = crypto.createCipheriv(options.algorithm, key, iv);
        var r = fs.createReadStream(options.input);
        var w = fs.createWriteStream(options.output);

        if (options.compress && options.compress=='true') {
            var zip = zlib.createGzip();
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

function decrypt(options, callback) {
    var fileSize = fs.statSync(options.input).size;
    var readSize = 0;
    db.tmp.insert({
        progress: 0,
    }, function(err, doc) {
        var id = doc._id;
        var timeStart = Date.now();

        var key = new Buffer(options.key,'hex');
        var iv = new Buffer(options.iv,'hex');
        var decipher = crypto.createDecipheriv(options.algorithm, key, iv);
        var r = fs.createReadStream(options.input);
        var w = fs.createWriteStream(options.output);

        if (options.compress && options.compress=='true') {
            var unzip = zlib.createGunzip();
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

};

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
};

function generateKeypair(callback) {
    var key = new NodeRSA({b: 512});
    var public = key.exportKey('pkcs1-public');
    var private = key.exportKey('pkcs1');
    callback({
        privateKey: private,
        publicKey: public,
    });
};

function privateEncrypt(options, callback) {
    var key = new NodeRSA();
    key.importKey(options.privateKey, 'pkcs1');
    callback({
        encryptedKey: key.encryptPrivate(options.key).toString(),
        encryptedIv: key.encryptPrivate(options.iv).toString(),
    });
};

function publicDecrypt(options, callback) {
    var key = new NodeRSA();
    console.log(options.publicKey);
    key.importKey(options.publicKey, 'pkcs1');
    console.log(key);
    callback({
        decryptedKey: key.decryptPublic(options.key).toString(),
        decryptedIv: key.decryptPublic(options.iv).toString(),
    });
};

module.exports = {
    encrypt: encrypt,
    decrypt: decrypt,
    generateHash: generateHash,
    generateKeypair: generateKeypair,
    privateEncrypt: privateEncrypt,
    publicDecrypt: publicDecrypt,
}