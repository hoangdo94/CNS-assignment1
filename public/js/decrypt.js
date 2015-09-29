//Variables
var taskId;
var desiredMd5;
var isInfoEncrypted;
//Events
$(window).load(function() {
    $('#decryptForm')[0].reset();
    $('#input-encrypted-information').prop('checked', false);
});
$('#btn-import-info').click(function(e) {
    e.preventDefault();
});
$('#input-algorithm').change(function(e) {
    $('#input-key').val('');
    $('#input-iv').val('');
});
$('#input-encrypted-information').change(function() {
    isInfoEncrypted = $(this).prop('checked');
    if (isInfoEncrypted) {
        $('#privatekey-container').show();
    } else {
        $('#privatekey-container').hide();
    }
});
$('#btn-import-info').click(function() {
    var infoFile = document.getElementById('file-info').files[0];
    if (!infoFile) {
        sweetAlert('Warning', 'Please select Information file!', 'warning');
        return;
    }

    readFile(infoFile, function(content) {
        var data = JSON.parse(content);
        // console.log(data);
        if (data.md5) desiredMd5 = data.md5;
        if (isInfoEncrypted) {
            var f = document.getElementById('file-privatekey').files[0];
            if (!f) {
                sweetAlert('Warning', 'Please select your Private key!', 'warning');
                return;
            }
            readFile(f, function(pkey) {
                var ops = {
                    privateKey: pkey,
                    key: data.key,
                    iv: data.iv,
                };
                $.post('/decrypt-infomation', ops, function(result) {
                    $('#input-algorithm').val(data.algorithm);
                    $('#input-key').val(result.decryptedKey);
                    $('#input-iv').val(result.decryptedIv);
                    $('#input-compress').prop('checked', data.compress);
                });
            });
        } else {
            $('#input-algorithm').val(data.algorithm);
            $('#input-key').val(data.key);
            $('#input-iv').val(data.iv);
            $('#input-compress').prop('checked', data.compress);
        }
    });
});
$('#decryptForm').submit(function(e) {
    e.preventDefault();
    var file = document.getElementById('file-input').files[0];
    if (!file) {
        sweetAlert('Warning', 'Please select a file to Decrypt!', 'warning');
        return;
    }
    var options = {
        algorithm: $('#input-algorithm').val(),
        key: $('#input-key').val(),
        iv: $('#input-iv').val(),
        compress: $('#input-compress').prop('checked'),
    };
    if (!keyValidate(options)) return;
    $('#decryptForm').hide();
    $('#progress').show();
    uploadFile(file, function(percent) {
        $('#upload-progress .progress-bar').css('width', percent + '%').find('span').text(percent + '%');
    }, function(status, r) {
        if (status !== 'OK') {
            sweetAlert('Error', 'Something went wrong when uploading file', 'error');
            return;
        }
        options.originalname = r.originalname;
        options.path = r.path;
        $.post('/decrypt', options, function(data) {
            taskId = data.taskId;
            $('#ufc').html('Uploaded [<b>File Size: </b> ' + data.fileSize + ' bytes]');
            progressUpdate(data.taskId, 500, function(percent) {
                $('#decrypt-progress .progress-bar').css('width', percent + '%').find('span').text(percent + '%');
            }, function() {
                $('#dfc').html('Encrypted [<b>TaskID: </b> ' + data.taskId + ']');
                $('#btn-download').attr('href', '/download/' + data.taskId);
                if (desiredMd5) {
                    $('#btn-checksum').show();
                }
                $('#result').show();
            });
        });
    });
});
$('#btn-checksum').click(function(e) {
    e.preventDefault();
    $.get('/hash/' + taskId, function(data) {
        if (data.hash == desiredMd5) {
            sweetAlert({
                title: 'Md5 checksum',
                text: 'Desired Md5: ' + desiredMd5 + '\nOutput Md5: ' + data.hash + '\nMatch!',
                type: 'success'
            });
        } else {
            sweetAlert({
                title: 'Md5 checksum',
                text: 'Desired Md5: ' + desiredMd5 + '\nOutput Md5: ' + data.hash + '\nMiss Match!',
                type: 'error'
            });
        }
    });
})
$('#btn-reload').click(function(e) {
    e.preventDefault();
    window.location.reload();
});