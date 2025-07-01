const mongoose = require("mongoose");
const mailsender = require("../utils/mailSender")

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

async function sendVerificationEmail(email, otp){
    try{
        const mailResponse = await mailsender(email, "Verification email OTP", otp);
        console.log("Email sent Successfully: ", mailResponse);
    }
    catch(error){
        console.log("Error ouccured while sending mail:",error)
        throw error;
    }
}

otpSchema.pre("save", async function(next){
    await sendVerificationEmail(this.email,this.otp);
})

module.exports = mongoose.model("OTP",otpSchema);