import { Controller, Post, Get, Body, Param, UseGuards, Req, Inject } from "@nestjs/common";
import { PostsService } from "./posts.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { JwtAuthGuard } from "../auth/auth.guard";
import { OptionalAuthGuard } from "../auth/optional-auth.guard";
import { CurrentUser, AuthUser } from "../auth/auth.decorator";

@Controller("posts")
export class PostsController {
  constructor(
    @Inject(PostsService) private readonly postsService: PostsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePostDto) {
    return this.postsService.create(user.userId, dto.content);
  }

  @Get()
  async getPublicIds() {
    return this.postsService.getPublicIds();
  }

  @Get(":id")
  @UseGuards(OptionalAuthGuard)
  getById(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.userId;
    return this.postsService.getById(id, userId);
  }
}
