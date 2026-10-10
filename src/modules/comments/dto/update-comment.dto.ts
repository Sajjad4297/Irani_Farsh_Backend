import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional } from 'class-validator';
import { CreateCommentDto } from './create-comment.dto';

export class UpdateCommentDto extends PartialType(CreateCommentDto) {
    @IsOptional()
    @IsIn([0, 1])
    result : 0 | 1;
}
