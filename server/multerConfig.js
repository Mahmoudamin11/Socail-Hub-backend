import multer from 'multer';

// Define storage settings for Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Specifies the directory where uploaded files will be stored
    },
    filename: function (req, file, cb) {
        // Use a unique filename for the uploaded file (you may want to add more logic here)
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Create the multer instance with the defined storage settings
const upload = multer({ storage: storage });

// Export the upload variable to be used in other files
export { upload };
