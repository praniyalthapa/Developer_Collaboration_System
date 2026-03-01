import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import io from "socket.io-client";
import CodeEditor from "../Components/CodeEditor";
import axios from "axios";
import { BASE_URL } from "../utils/constants";

const CodeSession = () => {
	const { sessionId } = useParams();
	const navigate = useNavigate();
	const user = useSelector((state) => state.user);

	const [socket, setSocket] = useState(null);
	const [code, setCode] = useState("// Start coding together!\nconsole.log('Hello World');\n");
	const [participants, setParticipants] = useState([]);
	const [isConnected, setIsConnected] = useState(false);
	const [typingUser, setTypingUser] = useState(null);
	const [output, setOutput] = useState("");
	const [isRunning, setIsRunning] = useState(false);

	const codeUpdateTimeoutRef = useRef(null);
	const typingTimeoutRef = useRef(null);

	// Fetch session details
	useEffect(() => {
		const fetchSession = async () => {
			try {
				const response = await axios.get(
					`${BASE_URL}/code-session/${sessionId}`,
					{ withCredentials: true }
				);
				console.log("Session loaded:", response.data);
			} catch (error) {
				console.error("Error fetching session:", error);
				alert("Session not found or you don't have access");
				navigate("/feed");
			}
		};

		if (sessionId && user) {
			fetchSession();
		}
	}, [sessionId, user, navigate]);

	// Initialize Socket.IO
	useEffect(() => {
		if (!user || !sessionId) return;

		const backendUrl = BASE_URL.replace('/api', '');
		const newSocket = io(backendUrl, {
			withCredentials: true,
		});

		setSocket(newSocket);

		newSocket.on("connect", () => {
			console.log("Connected to socket server");
			setIsConnected(true);

			newSocket.emit("joinCodeSession", {
				sessionId,
				userId: user._id,
				userName: `${user.firstName} ${user.lastName}`,
			});
		});

		newSocket.on("disconnect", () => {
			console.log("Disconnected from socket server");
			setIsConnected(false);
		});

		newSocket.on("codeUpdate", ({ code: newCode }) => {
			console.log("Received code update");
			setCode(newCode);
		});

		newSocket.on("participantJoined", ({ userName, participants: newParticipants }) => {
			console.log(`${userName} joined`);
			setParticipants(newParticipants);
		});

		newSocket.on("participantLeft", ({ userName, participants: newParticipants }) => {
			console.log(`${userName} left`);
			setParticipants(newParticipants);
		});

		newSocket.on("userTyping", ({ userName }) => {
			setTypingUser(userName);
			if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
			typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
		});

		newSocket.on("userStoppedTyping", () => {
			setTypingUser(null);
		});

		newSocket.on("codeSessionError", ({ message }) => {
			alert(message);
		});

		return () => {
			newSocket.emit("leaveCodeSession", {
				sessionId,
				userName: `${user.firstName} ${user.lastName}`,
			});
			newSocket.close();
		};
	}, [sessionId, user]);

	// Handle code changes with debouncing
	const handleCodeChange = (newCode) => {
		setCode(newCode);

		if (codeUpdateTimeoutRef.current) {
			clearTimeout(codeUpdateTimeoutRef.current);
		}

		if (socket && isConnected) {
			socket.emit("userTyping", {
				sessionId,
				userName: `${user.firstName} ${user.lastName}`,
			});

			codeUpdateTimeoutRef.current = setTimeout(() => {
				socket.emit("codeChange", {
					sessionId,
					code: newCode,
				});

				socket.emit("userStoppedTyping", {
					sessionId,
				});
			}, 300);
		}
	};

	// Run JavaScript code in browser
	const runCode = () => {
		setIsRunning(true);
		setOutput("");

		try {
			const logs = [];
			const originalLog = console.log;
			const originalError = console.error;
			const originalWarn = console.warn;

			console.log = (...args) => logs.push(args.map(arg => 
				typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
			).join(' '));
			console.error = (...args) => logs.push('Error: ' + args.join(' '));
			console.warn = (...args) => logs.push('Warning: ' + args.join(' '));

			eval(code);

			console.log = originalLog;
			console.error = originalError;
			console.warn = originalWarn;

			setOutput(logs.join('\n') || "Code executed successfully (no output)");
		} catch (error) {
			setOutput(`Error: ${error.message}\n\nStack trace:\n${error.stack}`);
		} finally {
			setIsRunning(false);
		}
	};

	// Keyboard shortcut for running code
	useEffect(() => {
		const handleKeyPress = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
				e.preventDefault();
				runCode();
			}
		};

		window.addEventListener('keydown', handleKeyPress);
		return () => window.removeEventListener('keydown', handleKeyPress);
	}, [code]);

	// Handle leave session
	const handleLeave = () => {
		if (window.confirm("Are you sure you want to leave this session?")) {
			navigate("/feed");
		}
	};

	if (!user) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-base-200">
				<div className="card bg-base-100 shadow-xl p-8">
					<p className="text-lg">Please log in to access this session</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-base-200">
			{/* Header */}
			<div className="navbar bg-base-100 shadow-lg sticky top-0 z-10">
				<div className="flex-1">
					<h1 className="text-xl sm:text-2xl font-bold ml-2 sm:ml-4">
						🚀 Collaborative Coding
					</h1>
					{isConnected ? (
						<div className="badge badge-success ml-2 sm:ml-3">Connected</div>
					) : (
						<div className="badge badge-error ml-2 sm:ml-3">Disconnected</div>
					)}
				</div>
				<div className="flex-none gap-2 mr-2 sm:mr-4">
					<div className="text-xs sm:text-sm">
						<span className="font-semibold">{participants.length}</span> Online
					</div>
					<button className="btn btn-sm btn-error" onClick={handleLeave}>
						Leave
					</button>
				</div>
			</div>

			{/* Main Content */}
			<div className="p-2 sm:p-4">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-2 sm:gap-4">
					{/* Code Editor - 3 columns */}
					<div className="lg:col-span-3">
						<div className="card bg-base-100 shadow-xl h-[calc(100vh-10rem)]">
							<div className="card-body p-0 h-full flex flex-col">
								{/* Editor Header */}
								<div className="bg-gray-800 p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 flex-shrink-0">
									<h2 className="text-white font-semibold text-sm sm:text-base">
										JavaScript Code Editor
									</h2>
									<div className="flex gap-2 w-full sm:w-auto">
										<button
											className={`btn btn-success btn-sm flex-1 sm:flex-initial ${isRunning ? "loading" : ""}`}
											onClick={runCode}
											disabled={isRunning}
										>
											{isRunning ? "Running..." : "▶ Run (Ctrl+Enter)"}
										</button>
									</div>
								</div>

								{/* Typing Indicator */}
								{typingUser && (
									<div className="bg-yellow-100 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-800 flex-shrink-0">
										<span className="font-semibold">{typingUser}</span> is typing
										<span className="inline-block ml-1 animate-pulse">...</span>
									</div>
								)}

								{/* Monaco Editor */}
								<div className="flex-1 overflow-hidden">
									<CodeEditor
										code={code}
										onChange={handleCodeChange}
									/>
								</div>

								{/* Output Console */}
								<div className="bg-gray-900 text-white p-3 sm:p-4 max-h-48 overflow-auto border-t border-gray-700 flex-shrink-0">
									<div className="text-xs sm:text-sm font-bold mb-2 text-green-400">
										Output Console:
									</div>
									<pre className="text-green-300 text-xs sm:text-sm whitespace-pre-wrap font-mono">
										{output || "Run your code to see output here... (Ctrl+Enter or click Run button)"}
									</pre>
								</div>
							</div>
						</div>
					</div>

					{/* Sidebar - Participants */}
					<div className="lg:col-span-1">
						<div className="card bg-base-100 shadow-xl">
							<div className="card-body p-3 sm:p-6">
								<h2 className="card-title text-base sm:text-lg">👥 Participants</h2>
								<div className="divider my-1"></div>
								
								<div className="space-y-2">
									{participants.length === 0 && (
										<p className="text-gray-500 text-xs sm:text-sm">
											Waiting for others to join...
										</p>
									)}
									{participants.map((participant, index) => (
										<div
											key={index}
											className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-base-200 rounded-lg hover:bg-base-300 transition"
										>
											<div className="avatar placeholder">
												<div className="bg-primary text-primary-content rounded-full w-8 sm:w-10">
													<span className="text-sm sm:text-lg">
														{participant.userName.charAt(0)}
													</span>
												</div>
											</div>
											<div className="flex-1 min-w-0">
												<p className="font-semibold text-xs sm:text-sm truncate">
													{participant.userName}
												</p>
												<p className="text-xs text-success flex items-center gap-1">
													<span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
													Active
												</p>
											</div>
										</div>
									))}
								</div>

								{/* Session Info */}
								<div className="mt-4 sm:mt-6">
									<h3 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
										📋 Session Info
									</h3>
									<div className="bg-base-200 p-2 sm:p-3 rounded-lg space-y-2 text-xs sm:text-sm">
										<div>
											<span className="font-medium text-gray-600">Language:</span>
											<span className="ml-2 badge badge-primary badge-sm">JavaScript</span>
										</div>
										<div>
											<span className="font-medium text-gray-600">Session ID:</span>
											<div className="mt-1">
												<code className="text-xs bg-base-300 px-2 py-1 rounded block break-all">
													{sessionId?.substring(0, 20)}...
												</code>
											</div>
										</div>
									</div>
								</div>

								{/* Quick Tips */}
								<div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-info bg-opacity-10 rounded-lg border border-info border-opacity-20">
									<h3 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-2">
										💡 Quick Tips
									</h3>
									<ul className="text-xs space-y-1 sm:space-y-2">
										<li className="flex items-start gap-2">
											<span className="text-info mt-0.5">•</span>
											<span>Code syncs in real-time</span>
										</li>
										<li className="flex items-start gap-2">
											<span className="text-info mt-0.5">•</span>
											<span>Press Ctrl+Enter to run</span>
										</li>
										<li className="flex items-start gap-2">
											<span className="text-info mt-0.5">•</span>
											<span>Use console.log() for output</span>
										</li>
										<li className="flex items-start gap-2">
											<span className="text-info mt-0.5">•</span>
											<span>JavaScript only supported</span>
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CodeSession;