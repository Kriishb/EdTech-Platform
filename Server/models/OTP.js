const mongoose = require("mongoose");
const mailsender = require("../utils/mailSender");
const emailVerificationTemplate  = require("../mail/templates/emailVerificationTemplate");

const otpSchema = mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
    otp:{
        type:String,
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now(),
        expires:5*60,
    }
});

async function sendVerificationEmail(email, otp) {
	// Create a transporter to send emails

	// Define the email options

	// Send the email
	try {
		const mailResponse = await mailsender(
			email,
			"Verification Email",
			emailVerificationTemplate(otp),
		);
		console.log("Email sent successfully: ", mailResponse);
	} catch (error) {
		console.log("Error occurred while sending email: ", error);
		throw error;
	}
}

otpSchema.pre("save", async function(next){
    await sendVerificationEmail(this.email,this.otp);
})

module.exports = mongoose.model("OTP",otpSchema);