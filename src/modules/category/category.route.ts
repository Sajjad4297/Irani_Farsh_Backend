import express, { Router } from "express";
import { testController } from "./category.controller.js"
const router: Router = express.Router();


router.get("/", testController)

export default router;
