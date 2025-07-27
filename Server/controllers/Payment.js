const { instance } = require("../config/Razorpay");
const Course  = require("../models/Course");
const User = require("../models/User");
const mailSender  = require("../utils/mailSender");
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail");
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");
const { default: mongoose } = require("mongoose");
const crypto = require("crypto");

//capture the payment and initiate the Razorpay order
exports.capturePayment = async (req, res) => {
    //get courseId and userId
    const { courseId } = req.body;
    const userId = req.user.id;

    //validation  
    if( !courseId ){
        return res.json({
            success: false,
            message: "Please provide valid course ID"
        })
    };
    
    let course;

    try{
        course = await Course.findById(courseId);

        if(!course){
            return res.json({
                success: false,
                message: "Could find course",
            })
        }

        const uid = new mongoose.Types.ObjectId(userId);

        if(course.studentsEnrolled.includes(uid)){
            return res.status(200).json({
                success:false,
                message:"Student is already enrolled"
            })
        }
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }

    //order create
    const amount = course.price;
    const currency = "INR";

    const options = {
        amount: amount*100,
        currency,
        receipt : Math.random(Date.now().toString()),
        notes:{
            courseId,
            userId,
        }
    }

    try{
        //initiate the payment using razorpay
        const paymentResponse = await instance.orders.create(options);
        console.log(paymentResponse);

        return res.status(200).json({
            success: true,
            courseName: course.courseName,
            courseDescription : course.courseDescription,
            thumbnail: course.thumbnail,
            orderId: paymentResponse.id,
            amount: paymentResponse.amount,
            currency: paymentResponse.currency
        })
    }
    catch(error){
        console.log(error);
        return res.json({
            success: false,
            message: "Could not initiate your order",
            error: error.message
        })
    }
}

//verify signature
exports.verifySignature = async (req, res) => {
    const webhookSecret = "12345678";

    const signature = req.headers("x-razorpay-sgnature");

    const shasum = crypto.createHmac("shasum",webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if( signature === digest ){
        console.log("Payment is authorized");

        const { courseId, userId } = req.body.payload.payment.entity.notes;

        try{
            //fulfill the action
            //find the course and enrolled the student in course
            const enrolledCourse = await Course.findeOneAndUpdate( 
                                                                { _id: courseId },
                                                                { $push:{
                                                                    studentsEnrolled: userId
                                                                }},
                                                                { new: true }
            );

            if(!enrolledCourse){
                return res.status(500).json({
                    success: false,
                    message: "Could not enroll the student in course"
                })
            }

            console.log(enrolledCourse);

            //find the student and add course
            const student = await Student.findOneAndUpdate(
                                                            { _id: userId},
                                                            {
                                                                $push : {
                                                                    courses: courseId
                                                                }
                                                            },
                                                            { new: true }
            )

            console.log(student);

            //send mail
            const emailResponse = await mailSender(
                                            student.email,
                                            "Congratualtion",
                                            "Congratulation, you are onboarded into new Course",
            )

            console.log(emailResponse);
            return res.status(200).json({
                success: true,
                message: "Student enrolled in course successfully",
            })
        }
        catch(error){
            console.log(error);
            return res.status(500).json({
                success: false,
                message: "Could not verify payment",
                error: error.message
            })
        }
    }
    else{
        return res.status(400).json({
            success: false,
            message: "could not verify signature",
        })
    }
}
 
exports.sendPaymentSuccessEmail = async (req, res) => {
    const {amount,paymentId,orderId} = req.body;
    const userId = req.user.id;
    if(!amount || !paymentId) {
        return res.status(400).json({
            success:false,
            message:'Please provide valid payment details',
        });
    }
    try{
        const enrolledStudent =  await User.findById(userId);
        await mailSender(
            enrolledStudent.email,
            `Study Notion Payment successful`,
            paymentSuccessEmail(amount/100, paymentId, orderId, enrolledStudent.firstName, enrolledStudent.lastName),
        );
}
    catch(error) {
        console.error(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        });
    }
}