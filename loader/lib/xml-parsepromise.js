const xml2js = require('xml2js');

module.exports = (xml) => new Promise( (res,rej) => {
	xml2js.parseString(xml, (err,result) => {
		if ( err ) {
			rej(err);
		} else {
			res(result);
		}
	});
});
