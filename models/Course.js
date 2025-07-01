const mongoose = require("mongoose");

const courseSchema = mongoose.Schema({
    courseNameL: {
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
        type:mongoose.Schema.Types.ObjectId,
        ref:"Tag",
    },
    studentEnrolled: [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        }
    ]
});

module.exports = mongoose.model("Course",courseSchema);