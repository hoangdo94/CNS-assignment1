var express = require('express');
var router = express.Router();
var crypt = require('../controllers/crypt');
var db = require('../controllers/db');
var multer = require('multer');
var upload = multer({
    dest: 'tmp/'
});

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index');
});

router.get('/encrypt', function(req, res, next) {
    res.render('encrypt');
});

router.get('/decrypt', function(req, res, next) {
    res.render('decrypt');
});

router.get('/analytic', function(req, res, next) {
	res.render('analytic');
});

router.post('/upload', upload.single('file'), function(req, res, next) {
	res.json({
		originalname: req.file.originalname,
		destination: req.file.destination,
		filename: req.file.filename,
		path: req.file.path,
	});
});

router.get('/progress/:id', function(req, res, next) {
    db.tmp.findOne({
        _id: req.params.id
    }, function(err, doc) {
        if (doc) {
            return res.json({
                progress: doc.progress
            });
        }
        return res.json(err);
    })
});

router.get('/information/:id', function(req, res, next) {
    db.per.findOne({
        _id: req.params.id
    }, function(err, doc) {
        if (doc) {
            delete(doc.input);
            delete(doc.output);
            return res.json(doc);
        }
        return res.json(err);
    })
});

router.get('/hash/:id', function(req, res, next) {
    var alg = req.query.algorithm || 'md5';
    db.per.findOne({
        _id: req.params.id
    }, function(err, doc) {
        if (doc) {
            var path = (doc.task == 'encrypt') ? doc.input : doc.output;
            crypt.generateHash(path, alg, function(err, hash) {
                if (err) {
                    return res.json({
                        error: err
                    });
                }
                return res.json({
                    algorithm: alg,
                    hash: hash
                });
            })
        } else {
            return res.json({
                error: 'Not found!'
            });
        }
    })
});

router.get('/download/:id', function(req, res, next) {
    db.per.findOne({
        _id: req.params.id
    }, function(err, doc) {
        if (doc) {
            return res.download(doc.output);
        }
        return res.json({
            error: 'Not found!'
        });
    })
});

module.exports = router;