import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.models.js";
import { uploadOnCloudinary} from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req,res)=>{
    // data from user
    //validation 
    //store in db
    //send response
    //error handling
    //token


    //data from user
    const {fullname,email,password,confirmPassword,avatar} = req.body;
    //validation
    if(fullname === "" || email === "" || password === "" || confirmPassword === "" || avatar === ""){
        throw new ApiError(400,"All fields are required")
    }
    if(email === null || !email.includes("@")){
        throw new ApiError(400,"Invalid email address")
    }
    if(password.length < 6){
        throw new ApiError(400,"Password must be at least 6 characters long")
    }
    if(password !== confirmPassword){
        throw new ApiError(400,"Password and Confirm Password do not match")
    }
    //already registered or not
    const AlreadyUser = await User.findOne({email})
    if(AlreadyUser){
        throw new ApiError(409,"User already registered with this email")
    }
    // check avatar file
    const avatarLocalPath = req.files?.avatar[0].path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }
    //upload to cloudinary
    const uploadResponse = await uploadOnCloudinary(avatarLocalPath)
    if(!uploadResponse){
        throw new ApiError(500,"File upload failed, please try again later")
    }
    //make an object and store in db
    const user = await User.create({
        fullname,
        email,
        password,
        confirmPassword,
        avatar: uploadResponse.url,
    })
    const createduser = await User.findById(user._id).select("-password -confirmPassword -refreshToken -createdAt -updatedAt")
    if(!createduser){
        throw new ApiError(500,"User registration failed, please try again later")
    }
    //return response
    return res.status(201).json(
        new ApiResponse(200,  createduser, "User registered successfully")
    )
})
export {registerUser}