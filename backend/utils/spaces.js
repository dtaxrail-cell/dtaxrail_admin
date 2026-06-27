import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const s3Client = new S3Client({
  endpoint: "https://dtr-file-storage.nyc3.digitaloceanspaces.com", 
  region: "us-east-1", 
  credentials: {
    accessKeyId: "DO00GPC8T84MC",
    secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY,
  },
});

console.log("DigitalOcean Spaces Client Initialized");

export default s3Client;