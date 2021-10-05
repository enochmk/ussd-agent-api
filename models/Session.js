const mongoose = require('mongoose');

const SessionSchema = mongoose.Schema({
	sessionID: String,
	msisdn: {
		type: String,
		required: true,
	},
	option: {
		type: String,
		required: false,
	},
	key: {
		type: String,
		required: null,
	},
	page: String,
	question: {
		type: String,
		required: true,
	},
	answer: {
		type: String,
		required: false,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model('Sessions', SessionSchema);
