var lengthStrict = [];
lengthStrict['des'] = {
    key: 16,
    iv: 16,
};
lengthStrict['aes-256-cbc'] = {
    key: 64,
    iv: 32,
};

function uploadFile(file, progressCallback, doneCallback) {
    var formData = new FormData();
    formData.append('inputFile', file);

    var xhr = new XMLHttpRequest();

    xhr.open('post', '/upload', true);

    xhr.upload.onprogress = function(e) {
        var percentage = Math.round((e.loaded / e.total) * 100);
        if (progressCallback && e.lengthComputable) {
            progressCallback(percentage);
        } else {
            console.log('Uploaded ', percentage, '%');
        }
    };

    xhr.onerror = function(e) {
        alert('An error occurred while uploading file, maybe the file is too big');
        location.reload();
    };

    xhr.onload = function() {
        if (doneCallback) {
            var data = JSON.parse(this.response);
            doneCallback(this.statusText, data);
        } else {
            console.log('Uploaded');
        }
    };

    xhr.send(formData);
};

function progressUpdate(taskId, timeout, progressCallback, doneCallback) {
    var itv = setInterval(function() {
        $.get('/progress/' + taskId, function(data) {
            if (data) {
                if (progressCallback) {
                    progressCallback(data.progress);
                } else {
                    console.log(data.progress);
                }
                if (data.progress === 100) {
                    clearInterval(itv);
                    if (doneCallback) {
                        doneCallback();
                    } else {
                        console.log('done');
                    }
                }
            }
        })
    }, timeout);
};

function randomString(len, charSet) {
    charSet = charSet || 'abcdef0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++) {
        var randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomString;
};

function keyValidate(options) {
    var algo = options.algorithm;
    if (!algo) return false;
    if (!options.key || options.key.length !== lengthStrict[algo].key) {
        alert('Invalid key length');
        return false;
    }
    if (!options.iv || options.iv.length !== lengthStrict[algo].iv) {
        alert('Invalid iv length');
        return false;
    }
    return true;
};

function readFile(f, callback) {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        var r = new FileReader();
        r.onload = function(e) {
            var contents = e.target.result;
            callback(contents);
        }
        r.readAsText(f);
    } else {
        alert('The File APIs are not fully supported by your browser.');
        callback(null);
    }
};