import mongoose from "mongoose";
import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcryptjs";

const doctorSchema = new mongoose.Schema({
    fullname : {
        type : String,
        required : [true,"Required Doctor Name"],
        trim : true,
    },
    degree : {
        type : String,
        required : [true,"Required Doctor Degree"],
        trim : true,
    },
    specialization : {
        type : String,
        required : [true,"Required Doctor Specialization"],
        trim : true,
    },
    email : {
        type: String,
        required: [true,"Required Doctor Email"],
        lowercase: true,
        unique: true,
        match : [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,"Please fill a valid email address"],
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    avartar :{
        type: String,
        required: true, // cloudinary url
    },
    password : {
        type: String,   
        required: [true,"Required Doctor Password"],
        minlength: [6,"Password must be at least 6 characters"],
        select: false,      
    },
    confirmPassword : {
        type: String,   
        required: [true,"Required Doctor Confirm Password"],
        minlength: [6,"Confirm Password must be at least 6 characters"],
        validate : {    
            validator : function(value){
                return value === this.password;
            },
            message: "Passwords do not match"
        },},
        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

// Hash password before saving
doctorSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        return next();
    }
    this.password = await bcrypt.hash(this.password,10);
    next();
})
// check password is correct or not
doctorSchema.methods.ispasswordCorrect = async function(password){
     await bcrypt.compare(password,this.password);
}

const Doctor = mongoose.model("Doctor", doctorSchema);