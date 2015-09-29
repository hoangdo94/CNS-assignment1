$('#btn-generate-keypair').click(function(e) {
    e.preventDefault();
    var size = $('#key-size').val();
    $('#private-key').text('Generating...');
    $('#public-key').text('Generating...');
    $.get('/generate-keypair?size=' + size, function(data) {
        $('#keypair-result').show();
        $('#private-key').text(data.privateKey);
        $('#public-key').text(data.publicKey);
    })
});
$('#btn-download-private').click(function() {
    var key = $('#private-key').text();
    if (!key || key === 'Generating...') return;
    var blob = new Blob([key], {
        type: "application/x-x509-ca-cert"
    });
    saveAs(blob, 'private.pem');
});
$('#btn-download-public').click(function() {
    var key = $('#public-key').text();
    if (!key || key === 'Generating...') return;
    var blob = new Blob([key], {
        type: "application/x-x509-ca-cert"
    });
    saveAs(blob, 'public.pem');
});
$('#btn-task-info').click(function() {
    var taskId = $('#task-id').val().trim();
    if (!taskId) return;
    $.get('/information/' + taskId, function(data) {
        $('#task-id').val('');
        if (data !== null) {
            $('#task-information')
            .empty()
            .append('<hr>')
            .append('<b>Task ID:</b> ' + data._id + '<br>')
            .append('<b>Action:</b> ' + data.task + '<br>')
            .append('<b>Algorithm:</b> ' + data.algorithm + '<br>')
            .append('<b>Use Compression:</b> ' + data.compress + '<br>')
            .append('<b>File Size:</b> ' + data.size + ' bytes<br>')
            .append('<b>Start At:</b> ' + (new Date(data.timeStart)) + '<br>')
            .append('<b>Duration:</b> ' + data.duration + ' ms<br>')
            .show();
        } else {
            sweetAlert('Error', 'Cannot get Information of task ' + taskId + '. Please recheck your Task Id', 'error');
        }
    })
});