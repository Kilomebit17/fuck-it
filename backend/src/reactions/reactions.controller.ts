import { Controller, Post, Get, Body, Query, UseGuards, Inject } from "@nestjs/common";
import { ReactionsService } from "./reactions.service";
import { CreateReactionDto } from "./dto/create-reaction.dto";
import { JwtAuthGuard } from "../auth/auth.guard";
import { CurrentUser, AuthUser } from "../auth/auth.decorator";

@Controller("reactions")
export class ReactionsController {
  constructor(
    @Inject(ReactionsService) private readonly reactionsService: ReactionsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  react(@CurrentUser() user: AuthUser, @Body() dto: CreateReactionDto) {
    return this.reactionsService.react(user.userId, dto.targetType, dto.targetId, dto.type);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getUserReactions(
    @CurrentUser() user: AuthUser,
    @Query("targetType") targetType: string,
    @Query("targetIds") targetIds: string,
  ) {
    const ids = targetIds ? targetIds.split(",") : [];
    return { reactions: this.reactionsService.getUserReactions(user.userId, targetType, ids) };
  }
}
