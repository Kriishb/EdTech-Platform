const User = require("../models/User");
const OTP = require("../models/OTP");
const Profile = require("../models/Profile");
const otpgenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

//sendOTP
exports.sendOTP = async ( req, res) => {

    try{
        //fetch email from req body
        const { email } = req.body;

        //check if user already exists
        const checkUserPresent = await User.findOne({email});

        if(checkUserPresent){
            return res.status(401).json({
                success:false,
                message:"User already registered",
            })
        }

        //generate OTP
        var otp = otpgenerator.generate(6,{
            upperCaseAlphabets : false,
            lowerCaseAlphabets : false,
            specialChars: false,
        })
        console.log("Otp generated : ",otp);

        //check unique OTP or not
        const result = await OTP.findOne({otp: otp});

        while(result){
            otp = otpgenerator.generate(6,{
                    upperCase: false,
                    lowerCase : false,
                    specialChars: false,
                });
                result = await OTP.findOne({otp: otp});
        }

        //create OTP in DB
        const otpPayload = { email, otp };

        const otpBody = await OTP.create(otpPayload);
        console.log("otpBody : ",otpBody);

        //return response
        res.status(200).json({
            success: true,
            message:"OTP sent Successfully",
            otp
        })
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

//signup
exports.signup = async (req, res) => {
    try{
        //fetch every detail from req body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;

        //validate data
        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp ){
            return res.status(403).json({
                success: false, 
                message: "All fields are required",
            })
        }

        //match password and confirmpassword
        if(password !== confirmPassword){
            return res.status(403).json({
                success: false,
                message: "Password and confirm password are not equal ,"
            })
        }

        //check user already exist or not
        
        const checkUser = await User.findOne({email});

        if(checkUser){
            return res.status(400).json({
                success: false,
                message:"User already registered",
            })
        }

        //find most recent OTP for user
        const recentOTP = await OTP.findOne({email}).sort({createdAt:-1}).limit(1);
        console.log(recentOTP);

        //validate OTP
        if(recentOTP.length == 0){
            //OTP not found
            return res.status(400).json({
                success: false,
                message:"OTP not valid",
            })
        }
        else if( otp !== recentOTP.otp ){
            return res.status(400).json({
                success: false, 
                message:"OTP not match",
            })
        }

        //hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        let approved = "";
		approved === "Instructor" ? (approved = false) : (approved = true);

        //create entry in DB
        const profileDetails = await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null,
        });
        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password: hashedPassword,
            accountType,
            approved: approved,
            additionalDetails:profileDetails._id,
            image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        })

        //return response
        return res.status(200).json({
            success: true,
            user,
            message:"User registered successfully",
        })
    }
    catch(error){
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

//login
exports.login = async (req, res) => {
    try{
        //get data from req body
        const {email, password} = req.body;

        //validate data
        if(!email || !password){
            return res.status(400).json({
                success: false,
                message: "Please enter email and password",
            })
        }

        //user exists or not
        const user = await User.findOne({email:email}).populate('additionalDetails');

        if(!user){
            return res.status(400).json({
                success: false,
                message: "User not found",
            })
        }

        //match password
        if( await bcrypt.compare(password, user.password) ){
            const payload = {
                email : user.email,
                id: user._id,
                accountType: user.accountType,
            }

            //generate JWT
            const token = await jwt.sign( payload, process.env.JWT_SECRET, {
                expiresIn: '2h',
            } )

            user.token = token;
            user.password = undefined;

            //create cookie send response
            const options = {
                expires : new Date(Date.now() + 3*24*60*60*1000),
                httpOnly: true,
            }
            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: "login successfully",
            })
        }
        else{
            return res.status(401).json({
                success: false,
                message: "Invalid password",
            })
        }
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Log in failure, Try again",
            error: error.message
        })
    }
}

//change Password
exports.changePassword = async (req, res) => {
    try{
        //get data from req body
        const userDetails = await User.findById(req.user.id)
        //get oldpass , new pass, confir new pass
        const { oldPassword, newPassword, confirmNewPassword } = req.body;
        //validate
        if(isPasswordMatch = await bcrypt.compare( oldPassword, userDetails.password)){
            //update pass in DB
            const encryptedPassword = await bcrypt.hash(newPassword, 10)
            const updatedUserDetails = await User.findByIdAndUpdate( req.user.id,
                { password: encryptedPassword },
                { new: true }
            )
            //send mail - password updated
            const emailResponse = await mailSender(
                updatedUserDetails.email,
                "Password for your account has been updated",
                `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
            )
            console.log("Email sent successfully:", emailResponse.response)
            //return response
            return res.status(200).json({
                success: true,
                message: "Password updated successfully",
            })
        }
        else{
            return res.status(401).json({
                success: false,
                message: "Invalid old password",
            })
        }
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "change password failure",
            error:error.message,
        })
    }
}