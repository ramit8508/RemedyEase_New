import connectdb from "./db/Db.js";
import dotenv from "dotenv";
dotenv.config({
    path: "./.env"
});

connectdb();