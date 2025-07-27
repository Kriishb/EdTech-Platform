const mongoose = require("mongoose");

const courseSchema = mongoose.Schema({
    courseName: {
        type: String,
    },
    courseDescritpion: {
        type: String,
        trim:true,
    },
    instructor:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:true,
    },
    whatYouWillLearn:{
        type:String,
        trim:true,
    },
    courseContent:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Section",
        }
    ],
    ratingAndReviews: [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"RatingAndReviews",
        }
    ],
    prices:{
        type:Number,
    },
    thumbnail:{
        type:String,
    },
    tag:{
        type:[String],
    },
    category:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Category"
    },
    studentEnrolled: [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        }
    ],
    instructions:{
        type:String,
    },
    status:{
        type:String,
        enum:["Draft", "Published"]
    },
    createdAt: {
		type:Date,
		default:Date.now(),
	}
});

module.exports = mongoose.model("Course",courseSchema);