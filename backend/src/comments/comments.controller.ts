import { Controller, Post, Get, Body, Param, UseGuards, Inject } from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { JwtAuthGuard } from "../auth/auth.guard";
import { OptionalAuthGuard } from "../auth/optional-auth.guard";
import { CurrentUser, AuthUser } from "../auth/auth.decorator";

@Controller("posts/:postId/comments")
export class CommentsController {
  constructor(
    @Inject(CommentsService) private readonly commentsService: CommentsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param("postId") postId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(postId, user.userId, dto.content, dto.parentCommentId);
  }

  @Get()
  @UseGuards(OptionalAuthGuard)
  getByPostId(@Param("postId") postId: string) {
    return { comments: this.commentsService.getByPostId(postId) };
  }
}
