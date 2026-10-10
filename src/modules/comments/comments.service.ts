import { Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentsRepository } from './comments.repository';
import { safeJsonParse } from 'src/common/utils/json.util';

@Injectable()
export class CommentsService {
    constructor(private readonly commentsRepository: CommentsRepository) { }
    async create(body: CreateCommentDto, user: { id: number, email: string }) {
        const { content, product: productId, rating } = body;
        const userId = user.id;
        await this.commentsRepository.create({ userId, content, productId, rating });

        return ({ success: true, message: 'Comment added successfully' });

    }

    async findAll() {
        const data = await this.commentsRepository.findPendingComments();

        if (data.length > 0) {
            data.forEach((comment: any) => {
                comment.user = safeJsonParse(comment.user, {});
                comment.product = safeJsonParse(comment.product, {});
                if (comment.product) {
                    comment.product.images = safeJsonParse(comment.product.images, []);
                    const slug = "irf-" + (comment.product.slug ? comment.product.slug.toString().padStart(4, "0") : "");
                    comment.product.slug = slug;
                }
                comment.rating = Number(comment.rating);
            });
            return ({ success: true, message: 'Comments got successfully', data });
        }else
            return ({ success: true, message: 'Not found any pending comment' });
    }

    async update(id: number, body: UpdateCommentDto) {
        const result = body.result;
        if (result == 1) {
            await this.commentsRepository.updatePendingComments(id, "approved");
        } else if (result == 0) {
            await this.commentsRepository.updatePendingComments(id, "rejected");
        }

        return ({ success: true, message: 'Result added successfully' });
    }

}
