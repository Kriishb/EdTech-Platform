const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

//resetPassword Token
exports.resetPasswordToken = async (req, res) => {
	try {
        //get rmail form req body
		const email = req.body.email;

        //check User exist or not
		const user = await User.findOne({ email: email });

		if (!user) {
			return res.json({
				success: false,
				message: `This Email: ${email} is not Registered With Us, Enter a Valid Email `,
			});
		}

        //generate a token for reset Password
		const token = crypto.randomBytes(20).toString("hex");

        //enter token to user's DB
		const updatedDetails = await User.findOneAndUpdate(
			{ email: email },
			{
				token: token,
				resetPasswordExpires: Date.now() + 3600000,
			},
			{ new: true }
		);
		console.log("DETAILS", updatedDetails);

        //create a front end link for reset password
		const url = `https://studynotion.fun/update-password/${token}`;

        //send a mail to user
		await mailSender(
			email,
			"Password Reset",
			`Your Link for email verification is ${url}. Please click this url to reset your password.`
		);

		res.json({
			success:true,
			message:"Email Sent Successfully, Please Check Your Email to Continue Further",
		});

	} catch (error) {
		return res.json({
			error: error.message,
			success: false,
			message: `Some Error in Sending the Reset Message`,
		});
	}
};

//resetPassword
exports.resetPassword = async (req, res) => {
	try {
        //get password and confirm password and token from req body
		const { password, confirmPassword, token } = req.body;

        //match password
		if (confirmPassword !== password) {
			return res.json({
				success: false,
				message: "Password and Confirm Password Does not Match",
			});
		}

        //get user's details
		const userDetails = await User.findOne({ token: token });

		if (!userDetails) {
			return res.json({
				success: false,
				message: "Token is Invalid",
			});
		}

        //check for token expiry
		if (!(userDetails.resetPasswordExpires > Date.now())) {
			return res.status(403).json({
				success: false,
				message: `Token is Expired, Please Regenerate Your Token`,
			});
		}

        //store new password in DB
		const encryptedPassword = await bcrypt.hash(password, 10);
		await User.findOneAndUpdate(
			{ token: token },
			{ password: encryptedPassword },
			{ new: true }
		);

		res.json({
			success: true,
			message: `Password Reset Successful`,
		});
	} catch (error) {
		return res.json({
			error: error.message,
			success: false,
			message: `Some Error in Updating the Password`,
		});
	}
};