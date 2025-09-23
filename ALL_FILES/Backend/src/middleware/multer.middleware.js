import multer from "multer";

// Configure multer for file uploads
// Using disk storage for temporary file handling before cloudinary upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Store files temporarily in public/temp directory
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        // Keep original filename for easier debugging
        // In production, you might want to add timestamps or UUIDs
        cb(null, file.originalname)
    }
})

// Export the configured multer instance
export const upload = multer({ 
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true)
        } else {
            cb(new Error('Only image files are allowed'), false)
        }
    }
})