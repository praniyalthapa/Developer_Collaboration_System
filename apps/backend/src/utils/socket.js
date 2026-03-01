const socket = require("socket.io");
const crypto = require("crypto");
const { Chat } = require("../models/chat");
const CodeSession = require("../models/codeSession");

const getSecretRoomId = (userId, targetUserId) => {
	return crypto
		.createHash("sha256")
		.update([userId, targetUserId].sort().join("$"))
		.digest("hex");
};

const activeSessions = {};

const initializeSocket = (server) => {
	const io = socket(server, {
		cors: {
			origin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(","),
			methods: ["GET", "POST"],
			credentials: true,
		},
	});

	io.on("connection", (socket) => {
		console.log("User connected:", socket.id);

		// CHAT FUNCTIONALITY
		socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
			const roomId = getSecretRoomId(userId, targetUserId);
			console.log(firstName + " joined Chat Room: " + roomId);
			socket.join(roomId);
		});

		socket.on(
			"sendMessage",
			async ({ firstName, lastName, userId, targetUserId, text }) => {
				try {
					if (!text || !text.trim()) return;
					const roomId = getSecretRoomId(userId, targetUserId);

					let chat = await Chat.findOne({
						participants: { $all: [userId, targetUserId] },
					});
					if (!chat) {
						chat = new Chat({
							participants: [userId, targetUserId],
							messages: [],
						});
					}
					chat.messages.push({
						senderId: userId,
						text,
					});
					await chat.save();
					//io.to(roomId).emit("messageReceived", { firstName, lastName, text });
					io.to(roomId).emit("messageReceived", { firstName, lastName, text, senderId: userId, createdAt: new Date() });
				} catch (err) {
					console.log("Error sending message:", err);
				}
			}
		);

		// CODE COLLABORATION
		socket.on("joinCodeSession", async ({ sessionId, userId, userName }) => {
			try {
				console.log(`${userName} joining code session: ${sessionId}`);

				const session = await CodeSession.findOne({ sessionId });
				if (!session) {
					socket.emit("codeSessionError", { message: "Session not found" });
					return;
				}

				socket.join(sessionId);

				if (!activeSessions[sessionId]) {
					activeSessions[sessionId] = {
						code: session.code,
						language: session.language,
						participants: [],
					};
				}

				const participant = { socketId: socket.id, userId, userName };
				activeSessions[sessionId].participants.push(participant);

				socket.emit("codeUpdate", {
					code: activeSessions[sessionId].code,
					language: activeSessions[sessionId].language,
				});

				io.to(sessionId).emit("participantJoined", {
					userName,
					participants: activeSessions[sessionId].participants,
				});

				console.log(`${userName} joined session ${sessionId}`);
			} catch (err) {
				console.error("Error joining code session:", err);
				socket.emit("codeSessionError", { message: "Failed to join session" });
			}
		});

		socket.on("codeChange", async ({ sessionId, code }) => {
			try {
				if (!activeSessions[sessionId]) return;

				activeSessions[sessionId].code = code;
				socket.to(sessionId).emit("codeUpdate", { code });

				const session = await CodeSession.findOne({ sessionId });
				if (session) {
					session.code = code;
					session.lastActivity = new Date();
					await session.save();
				}
			} catch (err) {
				console.error("Error handling code change:", err);
			}
		});

		socket.on("languageChange", async ({ sessionId, language }) => {
			try {
				if (!activeSessions[sessionId]) return;

				activeSessions[sessionId].language = language;
				io.to(sessionId).emit("languageUpdate", { language });

				await CodeSession.findOneAndUpdate(
					{ sessionId },
					{ language, lastActivity: new Date() }
				);
			} catch (err) {
				console.error("Error changing language:", err);
			}
		});

		socket.on("userTyping", ({ sessionId, userName }) => {
			socket.to(sessionId).emit("userTyping", { userName });
		});

		socket.on("userStoppedTyping", ({ sessionId }) => {
			socket.to(sessionId).emit("userStoppedTyping");
		});

		socket.on("leaveCodeSession", ({ sessionId, userName }) => {
			try {
				if (activeSessions[sessionId]) {
					activeSessions[sessionId].participants = 
						activeSessions[sessionId].participants.filter(
							p => p.socketId !== socket.id
						);

					socket.to(sessionId).emit("participantLeft", {
						userName,
						participants: activeSessions[sessionId].participants,
					});

					socket.leave(sessionId);
				}
			} catch (err) {
				console.error("Error leaving session:", err);
			}
		});

		socket.on("disconnect", () => {
			console.log("User disconnected:", socket.id);

			for (const sessionId in activeSessions) {
				const session = activeSessions[sessionId];
				const participant = session.participants.find(
					p => p.socketId === socket.id
				);

				if (participant) {
					session.participants = session.participants.filter(
						p => p.socketId !== socket.id
					);

					io.to(sessionId).emit("participantLeft", {
						userName: participant.userName,
						participants: session.participants,
					});

					if (session.participants.length === 0) {
						delete activeSessions[sessionId];
					}
				}
			}
		});
	});

	return io;
};

module.exports = initializeSocket;