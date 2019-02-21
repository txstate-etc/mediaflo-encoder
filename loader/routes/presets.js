const express = require('express');
const presets = require('../presets.json');
const xmlbuilder = require('xmlbuilder');
const populatePresetXML = require('../lib/preset-generatexml.js');

var router = express.Router();


router.get('/info/?$', (req, res) => {
	var root = xmlbuilder.create('PresetInfoList');
	root.att('xmlns:i','http://www.w3.org/2001/XMLSchema-instance');

	for ( var preset of presets ) {
		var presetelement = root.ele('PresetInfo');
		populatePresetXML(preset,presetelement,req);
	}

	res.status(200).contentType('application/xml').send(root.end({pretty: true}));
});

router.get('/info/:id', (req, res) => {
	var root = xmlbuilder.create('PresetInfo');
	root.att('xmlns:i','http://www.w3.org/2001/XMLSchema-instance');

	var preset = presets.filter( (preset) => preset.id == req.params.id );
	populatePresetXML(preset[0],root,req);

	res.status(200).contentType('application/xml').send(root.end({pretty: true}));
});







module.exports = router;
