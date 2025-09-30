import express, { Router } from "express";
import { addComment,getPendingComments,submitPendingComments } from "./comments.controller.js"
import { authMiddleware } from "../../middlewares/userAuth.js"
const router: Router = express.Router();


router.post("/", authMiddleware, addComment)

router.get('/' , getPendingComments)

router.put('/:id' , submitPendingComments)

export default router;
