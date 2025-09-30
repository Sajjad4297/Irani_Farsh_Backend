import multer from "multer";
import path from "path";
import crypto from "crypto";

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    let uploadPath = "uploads/others";

    if (req.baseUrl.includes("product")) {
      uploadPath = "uploads/product";
    } else if (req.baseUrl.includes("user")) {
      uploadPath = "uploads/user";
    }else if (req.baseUrl.includes("cate")) {
      uploadPath = "uploads/category";
    }
        cb(null, uploadPath);
    },
  filename: (req, file, cb) => {
      const uniqueSuffix = crypto.randomBytes(5).toString("hex");
    cb(null, "img-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images allowed"));
  }
};

export const upload = multer({ storage, fileFilter });
