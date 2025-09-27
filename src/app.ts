// src/app.ts
import express from 'express';
import categoriesRouter from './modules/category/category.route.js'
import userRouter from './modules/user/user.route.js'
import productsRouter from './modules/product/product.route.js'
const app = express();

// Middleware
app.use(express.json());

// Routes
app.get("/", (req, res) => {
    res.send("hello from back");
})
app.use("/api/users", userRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);

export default app;
