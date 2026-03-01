const express = require("express");
const authRouter = express.Router();
const sendAccountCreatedEmail = require("../utils/sendEmail");

const { validateSignUpData } = require("../utils/validation");
const User = require("../models/user");
const bcrypt = require("bcrypt");

authRouter.post("/signup", async (req, res) => {
	try {
		// Validation of data
		validateSignUpData(req);

		const { firstName, lastName, emailId, password } = req.body;

		// Encrypt the password
		const passwordHash = await bcrypt.hash(password, 10);
		console.log(passwordHash);

		//   Creating a new instance of the User model
		const user = new User({
			firstName,
			lastName,
			emailId,
			password: passwordHash,
			isSeed: false, // Explicitly mark as real user
		});

		const savedUser = await user.save();
		const token = await savedUser.getJWT();
       //sending automated email after successful signup
	    sendAccountCreatedEmail(savedUser);
		const isProduction = process.env.NODE_ENV === "production";
		res.cookie("token", token, {
			expires: new Date(Date.now() + 8 * 3600000),
			httpOnly: true,
			sameSite: isProduction ? "none" : "lax",
			secure: isProduction,
		});

		res.json({ message: "User Added successfully!", data: savedUser });
	} catch (err) {
		res.status(400).send("ERROR : " + err.message);
	}
});

authRouter.post("/login", async (req, res) => {
	try {
		const { emailId, password } = req.body;

		const user = await User.findOne({ emailId: emailId });
		if (!user) {
			throw new Error("Invalid credentials");
		}
		const isPasswordValid = await user.validatePassword(password);

		if (isPasswordValid) {
			const token = await user.getJWT();

			const isProduction = process.env.NODE_ENV === "production";
			// res.cookie("token", token, {
			// 	expires: new Date(Date.now() + 8 * 3600000),
			// 	httpOnly: true,
			// 	sameSite: isProduction ? "none" : "lax",
			// 	secure: isProduction,
			// });
		// 	  res.cookie("token", token, {
	    //       httpOnly: true,
	    //       sameSite: "none",   // MUST be "none" for Postman or cross-origin
	    //       secure: false,      // MUST be false for localhost
        //    });
		res.cookie("token", token, {
          httpOnly: true,             // ✅ client cannot access
          secure: isProduction,       // ✅ HTTPS only in production
          sameSite: isProduction ? "none" : "lax", // ✅ cross-site handling
          path: "/",                  // ✅ send cookie for all endpoints
          maxAge: 8 * 3600000,        // ✅ 8 hours
         });

		res.send(user);
		} else {
			throw new Error("Invalid credentials");
		}
	} catch (err) {
		res.status(400).send("ERROR : " + err.message);
	}
});

authRouter.post("/logout", async (req, res) => {
	const isProduction = process.env.NODE_ENV === "production";
	res.cookie("token", "", {
		expires: new Date(0),
		httpOnly: true,
		sameSite: isProduction ? "none" : "lax",
		secure: isProduction,
	});
	res.send("Logout Successful!!");
});

module.exports = authRouter;