var express = require('express');
var router = express.Router();
var crypt = require('../controllers/crypt');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('test');
});

router.get('/e', function(req, res, next) {
	var options = {
		input: './files/1.bin',
		output: './files/2.bin',
		algorithm: 'aes-256-cbc',
		key: 'mondaicamondaicamondaicamondaica',
		iv: 'mondaicamondaica',
	}

	crypt.encrypt(options, function(taskId, fileSize) {
		// res.send('<a href="http://localhost:3000/progress/' + data + '" target="_blank">view progress</a>');
		res.json({
			taskId: taskId,
			fileSize: fileSize,
		});
	});
})

router.get('/d', function(req, res, next) {
	var options = {
		output: './files/3.bin',
		input: './files/2.bin',
		algorithm: 'aes-256-cbc',
		key: 'mondaicamondaicamondaicamondaica',
		iv: 'mondaicamondaica',
	}

	crypt.decrypt(options, function(taskId, fileSize) {
		// res.send('<a href="http://localhost:3000/progress/' + data + '" target="_blank">view progress</a>');
		res.json({
			taskId: taskId,
			fileSize: fileSize,
		});
	});
});



module.exports = router;
