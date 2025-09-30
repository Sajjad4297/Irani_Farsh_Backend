import { createComment, readPendingComments, setPendingComments } from "./comments.model.js";
import type { Request, Response } from 'express'
export const addComment = async (req: Request, res: Response) => {
    try {
        const { id: userId } = (req as any).user;
        const { content, product: productId } = req.body;
        if (!content || !productId)
            res.status(400).json({ status: 'error', message: 'Fields required' })

        await createComment({ userId, content, productId });

        res.status(201).json({ status: 'success', message: 'Comment added successfully' });

    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 'error', message: 'Failed to add comment' });

    }
}
export const getPendingComments = async (req: Request, res: Response) => {
    try {
        const data = await readPendingComments();

        if (data) {
            data.forEach((comment: any) => {
                const slug = "irf-" + comment.product.slug?.toString()?.padStart(4, "0");
                comment.product.slug = slug;
            });

            const sluggedData = { ...data, product: { ...data.product } }

            res.status(200).json({ status: 'success', message: 'Comments got successfully', data: sluggedData });
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 'error', message: 'Failed to get comments' });

    }
}
export const submitPendingComments = async (req: Request, res: Response) => {
    try {
        const id = req.params.id
        if (!id)
            res.status(400).json({ status: 'error', message: 'Id required' })

        const result = req.body.result;
        if (!result) {
            res.status(400).json({ status: 'error', message: 'Fields required' })
        } else if (result == 1) {
            await setPendingComments(id, "approved");
        } else if (result == 0) {
            await setPendingComments(id, "rejected");
        }

        res.status(200).json({ status: 'success', message: 'Result added successfully' });

    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 'error', message: 'Failed to add result' });

    }
}
