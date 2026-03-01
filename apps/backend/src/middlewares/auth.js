
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
	try {
		const token = req.cookies.token;  //  only cookie-based

		if (!token) {
			console.log(" No token found");
			return res.status(401).send("Please Login!");
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findById(decoded._id);

		if (!user) return res.status(401).send("User not found");

		req.user = user;
		next();
	} catch (err) {
		console.log("JWT ERROR:", err.message);
		return res.status(401).send("Please Login!");
	}
};

module.exports = { userAuth };
