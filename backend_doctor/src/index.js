import connectdb from "./db/Db.js";
import dotenv from "dotenv";
dotenv.config({
    path: "./.env"
});

connectdb()
.then(() => {
    app.on('error', (err) => {
        console.log("Server error", err);
        throw err;
    });
    app.listen(process.env.PORT || 3000, () => {
        console.log(`Server is running on port ${process.env.PORT || 3000}`);
    });
})
.catch((err) => {
    console.log("Database connection failed", err);
});
