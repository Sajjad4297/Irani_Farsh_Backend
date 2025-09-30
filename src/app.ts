// src/app.ts
import express from 'express';
import cors from 'cors';
import categoriesRouter from './modules/category/category.route.js'
import userRouter from './modules/user/user.route.js'
import productsRouter from './modules/product/product.route.js'
import commentsRouter from "./modules/comments/comments.route.js";
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));
// Routes
app.get("/", (req, res) => {
    res.send("hello from back");
})
app.use("/api/users", userRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);
app.use("/api/comments", commentsRouter);

export default app;
