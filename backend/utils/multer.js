import multer from "multer";

import { CloudinaryStorage }
from "multer-storage-cloudinary";

import cloudinary from "./cloudinary.js";

import path from "path";

const storage = new CloudinaryStorage({

  cloudinary,

  params: async (req, file) => {

    const ext =
      path.extname(file.originalname)
          .toLowerCase();

    let resourceType = "auto";

    // FORCE PDF AS RAW
    if (ext === ".pdf") {

      resourceType = "raw";
    }

    return {

      folder: "dtaxrail_documents",

      resource_type: resourceType,

      public_id:
        `${Date.now()}-${path.parse(file.originalname).name}`,
    };
  },
});

const upload = multer({ storage });

export default upload;