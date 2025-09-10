import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectdb = async () => {
    try{
        const dbinstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log(`Database connected to ${dbinstance.connection.host}`);
    }catch(error){
        console.error(`Error connecting to database: ${error.message}`);
        process.exit(1);
    }
}

export default connectdb;
