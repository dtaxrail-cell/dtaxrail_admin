import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const s3Client = new S3Client({
  endpoint: "https://dtr-file-storage.sgp1.digitaloceanspaces.com", 
  region: "sgp1", // Locked into Singapore as selected
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
});

console.log("DigitalOcean Spaces Client Initialized (Singapore)");

export default s3Client;