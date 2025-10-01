import { Router } from 'express'
import { registerUser, loginUser, putUserProfileImage, getUsers, addCartItem, putCartItem } from './user.controller.js'
import { authMiddleware } from "../../middlewares/userAuth.js"
import { upload } from '../../middlewares/multerConfig.js';
const router = Router();

router.post('/register', registerUser);

router.post('/login', loginUser);

router.put('/profileImage', authMiddleware, upload.single('image'), putUserProfileImage);

router.get('/', getUsers);

router.post('/cart', authMiddleware, addCartItem);

router.put('/cart', authMiddleware, putCartItem)
export default router;
