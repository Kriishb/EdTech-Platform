const cloudinary = require("cloudinary").v2;

exports.uploadImageToCloudinary = async(file, folder, height, qaulity) => {
    try{

        const options = {folder};
        if(height){
            opsitons.height = height;
        }
        if(qaulity){
            options.qaulity = qaulity;
        }

        return await cloudinary.uploader.upload(file.tempFilePath, options);
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Error while image upload",
            error:error.message
        })
    }
}