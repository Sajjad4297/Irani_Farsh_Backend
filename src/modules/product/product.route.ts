import { Router } from 'express'
import { addProduct,getProductById,getProductsOverView,removeProductsOverView } from './product.controller.js'
import { upload } from "../../middlewares/multerConfig.js";
const router = Router();

router.post('/', upload.array('images'), addProduct);

router.get('/:id' , getProductById);

router.get('/' , getProductsOverView);

router.delete('/:id' , removeProductsOverView);
export default router;
