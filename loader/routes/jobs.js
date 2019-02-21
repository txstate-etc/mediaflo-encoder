const express = require('express');
const presets = require('../presets.json');
const xmlbuilder = require('xmlbuilder');
const bodyparser = require('body-parser');
const xmlparsestring = require('../lib/xml-parsepromise.js');

var router = express.Router();




router.use('/?$',bodyparser.text({ type: 'application/xml' }));
router.post('/?$', async (req, res) => {
	var jobdetails = await xmlparsestring(req.body);

	var data = {
		name: jobdetails.JobCreateInfo.Name[0],
		presetid: jobdetails.JobCreateInfo.JobMediaInfo[0].CompressionPresetList[0].CompressionPreset[0].PresetId[0],
		source: jobdetails.JobCreateInfo.JobMediaInfo[0].SourceMediaList[0].SourceMediaInfo[0].FileUri[0],
		destination: jobdetails.JobCreateInfo.JobMediaInfo[0].DestinationList[0].DestinationInfo[0].FileUri[0]
	};
	var preset = presets.filter( (preset) => preset.id == data.presetid );
	data.preset = preset[0];

	console.log(JSON.stringify(data,null,4));

	res.status(404).send("FAIL");
});




module.exports = router;
