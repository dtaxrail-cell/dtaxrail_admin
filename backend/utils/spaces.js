import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const s3Client = new S3Client({
  // FIX: Remove the bucket name from the endpoint string!
  endpoint: "https://sgp1.digitaloceanspaces.com", 
  region: "sgp1", 
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
});

console.log("DigitalOcean Spaces Client Initialized (Singapore)");

export default s3Client;