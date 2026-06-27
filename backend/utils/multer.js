import multer from "multer";
import multerS3 from "multer-s3";
import s3Client from "../config/spaces.js"; 
import path from "path";

const storage = multerS3({
  s3: s3Client, 
  bucket: "dtr-file-storage",
  acl: "public-read", 
  key: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9]/g, "_");
    
    cb(null, `dtaxrail_documents/${Date.now()}-${cleanName}${ext}`);
  },
});

const upload = multer({ storage });

export default upload;