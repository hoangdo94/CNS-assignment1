var Datastore = require('nedb');

//persistence database (for tasks information)
var per = new Datastore({ filename: './controllers/data.json', autoload: true });
per.persistence.setAutocompactionInterval(5000);

//temporary database (for tasks progress)
var tmp = new Datastore();

module.exports = {
	tmp: tmp,
	per: per,
};
