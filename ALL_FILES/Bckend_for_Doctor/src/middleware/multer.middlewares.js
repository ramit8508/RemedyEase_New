import multer from "multer";

// Configure multer to store files in memory as buffers instead of saving to disk.
// This is essential for platforms with ephemeral/read-only filesystems like Render.
const storage = multer.memoryStorage();

export const upload = multer({ 
    storage, 
});
