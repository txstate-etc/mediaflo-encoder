module.exports = (preset,element,req) => {
	element.ele('Created').text(preset.created);
	element.ele('Description').text(preset.name);
	element.ele('Extension').text('mp4');
	element.ele('Id').text(preset.id);
	element.ele('Modified').text(preset.created);
	element.ele('Name').text(preset.name);
	element.ele('Published').text('true');
	element.ele('Uri').text(req.protocol+'://'+req.hostname+'/api/presets/info/'+preset.id);
	element.ele('Workflow').text('TXState/Mediaflo/ABR');
};
