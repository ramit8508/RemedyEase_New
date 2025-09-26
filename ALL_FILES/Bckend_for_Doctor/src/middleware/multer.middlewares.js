import multer from "multer";

// This configures multer to store uploaded files in memory as a buffer.
// This is the correct way to handle file uploads on platforms like Render.
const storage = multer.memoryStorage();

export const upload = multer({ 
    storage, 
});