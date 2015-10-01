$(document).ready(function() {
    $('#query-compare').prop('checked', false);
});
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
$('#query-compare').change(function(e) {
    $('#query-algorithm').prop('disabled', $(this).prop('checked'));
});
$('#query-form').submit(function(e) {
    e.preventDefault();
    var query = $(this).serialize();
    console.log(query);
    var compare = $('#query-compare').prop('checked');
    var chartOptions = {
        tooltipTemplate: "<%if (datasetLabel){%><%=datasetLabel%>: <%}%><%=argLabel%> bytes - <%=valueLabel%> ms",
        multiTooltipTemplate: "<%=argLabel%> bytes - <%=valueLabel%> ms",
    }
    if (!compare) {
        $.get('/analytic', query, function(response) {
            var ctx = document.getElementById('ana-chart').getContext('2d');
            if ($('#query-algorithm').val() == 'des') {
                var data = [{
                    label: 'DES',
                    strokeColor: '#007ACC',
                    pointColor: '#007ACC',
                    pointStrokeColor: '#fff',
                    data: response,
                }];
            } else {
                var data = [{
                    label: 'AES-256',
                    strokeColor: '#F16220',
                    pointColor: '#F16220',
                    pointStrokeColor: '#fff',
                    data: response,
                }];
            }

            new Chart(ctx).Scatter(data,chartOptions);
        });
    } else {
        var query1 = 'algorithm=aes-256-cbc&' + query;
        var query2 = 'algorithm=des&' + query;
        $.get('/analytic', query1, function(r1) {
            $.get('/analytic', query2, function(r2) {
                var ctx = document.getElementById('ana-chart').getContext('2d');
                var data = [{
                    label: 'AES-256',
                    strokeColor: '#F16220',
                    pointColor: '#F16220',
                    pointStrokeColor: '#fff',
                    data: r1,
                }, {
                    label: 'DES',
                    strokeColor: '#007ACC',
                    pointColor: '#007ACC',
                    pointStrokeColor: '#fff',
                    data: r2,
                }];
                new Chart(ctx).Scatter(data,chartOptions);
            });
        });
    }
});