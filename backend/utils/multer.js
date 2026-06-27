import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import path from "path";

// Initialize DigitalOcean Spaces S3 Client
const s3 = new S3Client({
  endpoint: "https://sgp1.digitaloceanspaces.com",
  region: "sgp1",
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
});

const storage = multerS3({
  s3: s3,
  bucket: "dtr-file-storage",
  acl: "public-read", // Ensures files are publicly downloadable via link
  key: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9]/g, "_");
    
    // Generates a clean, unique filename inside a "dtaxrail_documents" folder
    cb(null, `dtaxrail_documents/${Date.now()}-${cleanName}${ext}`);
  },
});

const upload = multer({ storage });

export default upload;