import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectdb = async () => {
    try{
    const dbinstance = await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
    console.log(`Database connected to ${dbinstance.connection.host}`);
    }catch(err){
        console.error(`Error connecting to database: ${err.message}`);
        process.exit(1);
    }
}
export default connectdb;

