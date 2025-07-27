const Section = require("../models/Section");
const Course = require("../models/Course");

//create Section
exports.createSection = async(req, res) => {
    try{
        //get details from req body
        const {sectionName, courseId} = req.body;

        //Validation
        if( !sectionName || !courseId ){
            return res.status(400).json({
                success:false,
                message: "Please provide all fields"
            })
        }

        //create section
        const newSection = await Section.create({sectionName});

        //update course with section ID
        const updatedCourseDetails = await Course.findByIdAndUpdate(courseId, 
            { 
                $push:{ 
                    courseContent: newSection._id,
                }
            },
            {new: true },
        ).populate({
            path:"courseContent",
            populate: {
                path: "subSection",
            } 
        }).exec();

        return res.status(200).json({
            success:true,
            message:"Section created successfully",
            updatedCourseDetails
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Error while creating section",
            error: error.messgae
        })
    }
}

//update Section
exports.updateSection = async (req,res) => {
    try{
        //get section id from req body
        const {sectionId, sectionName, courseId} = req.body;

        //update section 
        const updatedSection = await Section.findByIdAndUpdate(sectionId,
            { sectionName },
            { new:true }
        )


    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Error while updating section",
            error:error.message
        })
    }
}

exports.deleteSection = async (req, res) => {
	try {
		const { sectionId,courseId } = req.body;
		await Section.findByIdAndDelete(sectionId);
		const updatedCourse = await Course.findById(courseId).populate({ path: "courseContent", populate: { path: "subSection" } }).exec();
		res.status(200).json({
			success: true,
			message: "Section deleted",
			updatedCourse,
		});
	} catch (error) {
		console.error("Error deleting section:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};