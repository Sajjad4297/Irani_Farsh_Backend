import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { UserAuthGuard } from 'src/common/guards/user-auth.guard';
import { User } from 'src/common/decorators/user.decorator';

@Controller('comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @Post()
    @UseGuards(UserAuthGuard)
    create(@Body() createCommentDto: CreateCommentDto, @User() user) {
        return this.commentsService.create(createCommentDto, user);
    }

    @Get()
    findAll() {
        return this.commentsService.findAll();
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
        return this.commentsService.update(+id, updateCommentDto);
    }
}
