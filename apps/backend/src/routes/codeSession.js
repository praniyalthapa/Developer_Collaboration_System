const express = require("express");
const { userAuth } = require("../middlewares/auth");
const CodeSession = require("../models/codeSession");
const crypto = require("crypto");

const router = express.Router();

// Create code session between two users
router.post("/code-session/create", userAuth, async (req, res) => {
	try {
		const { targetUserId } = req.body;
		const userId = req.user._id;

		if (!targetUserId) {
			return res.status(400).json({ message: "Target user ID required" });
		}

		const sessionId = crypto
			.createHash("sha256")
			.update([userId.toString(), targetUserId].sort().join("$"))
			.digest("hex");

		let session = await CodeSession.findOne({ sessionId });

		if (!session) {
			session = new CodeSession({
				sessionId,
				participants: [userId, targetUserId],
				createdBy: userId,
			});
			await session.save();
		}

		res.json({
			message: "Code session created",
			sessionId,
			session,
		});
	} catch (err) {
		console.error("Error creating code session:", err);
		res.status(500).json({ message: "Failed to create code session" });
	}
});

// Get session details
router.get("/code-session/:sessionId", userAuth, async (req, res) => {
	try {
		const { sessionId } = req.params;
		const userId = req.user._id;

		const session = await CodeSession.findOne({ sessionId })
			.populate("participants", "firstName lastName photoUrl")
			.populate("createdBy", "firstName lastName");

		if (!session) {
			return res.status(404).json({ message: "Session not found" });
		}

		const isParticipant = session.participants.some(
			(p) => p._id.toString() === userId.toString()
		);

		if (!isParticipant) {
			return res.status(403).json({ message: "Not authorized" });
		}

		res.json({ session });
	} catch (err) {
		console.error("Error fetching session:", err);
		res.status(500).json({ message: "Failed to fetch session" });
	}
});

// Get all active sessions for current user
router.get("/code-session", userAuth, async (req, res) => {
	try {
		const userId = req.user._id;

		const sessions = await CodeSession.find({
			participants: userId,
			isActive: true,
		})
			.populate("participants", "firstName lastName photoUrl")
			.populate("createdBy", "firstName lastName")
			.sort({ lastActivity: -1 });

		res.json({ sessions });
	} catch (err) {
		console.error("Error fetching sessions:", err);
		res.status(500).json({ message: "Failed to fetch sessions" });
	}
});

// Delete session
router.delete("/code-session/:sessionId", userAuth, async (req, res) => {
	try {
		const { sessionId } = req.params;
		const userId = req.user._id;

		const session = await CodeSession.findOne({ sessionId });

		if (!session) {
			return res.status(404).json({ message: "Session not found" });
		}

		if (session.createdBy.toString() !== userId.toString()) {
			return res.status(403).json({ message: "Not authorized" });
		}

		session.isActive = false;
		await session.save();

		res.json({ message: "Session deactivated" });
	} catch (err) {
		console.error("Error deleting session:", err);
		res.status(500).json({ message: "Failed to delete session" });
	}
});

module.exports = router;