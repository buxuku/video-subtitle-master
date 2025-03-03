const { whisper } = require('./addons/addon.node.node')
const { promisify } = require('util');

const whisperAsync = promisify(whisper);

module.exports = {
	whisperAsync
};
