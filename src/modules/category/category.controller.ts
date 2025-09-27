import { test } from "./category.model.js"
import type { Request, Response } from 'express'
export const testController = async (req: Request, res: Response) => {
    const testValue = await test();
    console.log(testValue);
    res.json({ testValue });
}
