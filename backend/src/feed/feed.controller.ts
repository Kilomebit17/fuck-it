import { Controller, Get, Query, UseGuards, Inject } from "@nestjs/common";
import { FeedService } from "./feed.service";
import { JwtAuthGuard } from "../auth/auth.guard";
import { CurrentUser, AuthUser } from "../auth/auth.decorator";

@Controller("feed")
export class FeedController {
  constructor(
    @Inject(FeedService) private readonly feedService: FeedService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getFeed(
    @CurrentUser() user: AuthUser,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("debug") debug?: string,
  ) {
    const parsedLimit = Math.min(parseInt(limit || "50", 10) || 50, 100);
    const result = await this.feedService.getFeed(user.userId, parsedLimit, search?.trim() || undefined);
    if (debug === "1") {
      return result; // includes debug info
    }
    return { posts: result.posts ?? result };
  }
}
