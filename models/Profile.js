const mongoose = require("mongoose");

const profileSchema = mongoose.Schema({
    gender:{
        type:String,
    },
    dateOfBirth:{
        type:Date,
    },
    about:{
        type:String,
    },
    contactNumber:{
        type:String,
    }
});

module.exports = mongoose.model("Profile",profileSchema);