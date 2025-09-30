import express, { Router } from "express";
import { addCategory, getCategories, putCategory, removeCategory } from "./category.controller.js"
import { upload } from "../../middlewares/multerConfig.js"
const router: Router = express.Router();


router.post("/", upload.single('image'), addCategory)

router.get("/", getCategories);

router.put("/:id", upload.single('image'), putCategory)

router.delete("/:id", removeCategory);

export default router;
