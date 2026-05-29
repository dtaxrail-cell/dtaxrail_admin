import dotenv from "dotenv";
dotenv.config();

import admin from "firebase-admin";

console.log("project_id =", process.env.project_id);
console.log("client_email =", process.env.client_email);
console.log("private_key exists =", !!process.env.private_key);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.project_id,
clientEmail: process.env.client_email,
privateKey: process.env.private_key?.replace(/\\n/g, "\n"),
    }),
  });
}

export default admin;