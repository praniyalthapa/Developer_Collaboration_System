const mongoose = require("mongoose");

const codeSessionSchema = new mongoose.Schema(
	{
		sessionId: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		participants: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		code: {
			type: String,
			default: "// Start coding together!\nconsole.log('Hello World');\n",
		},
		language: {
			type: String,
			default: "javascript",
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		lastActivity: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
	}
);

codeSessionSchema.index(
	{ lastActivity: 1 },
	{ expireAfterSeconds: 86400 }
);

const CodeSession = mongoose.model("CodeSession", codeSessionSchema);

module.exports = CodeSession;