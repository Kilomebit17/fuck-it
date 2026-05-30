import { Controller, Get, UseGuards, Inject } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/auth.guard";
import { CurrentUser, AuthUser } from "../auth/auth.decorator";

@Controller("user")
export class UsersController {
  constructor(
    @Inject(UsersService) private readonly usersService: UsersService,
  ) {}

  @Get("interests")
  @UseGuards(JwtAuthGuard)
  getInterests(@CurrentUser() user: AuthUser) {
    return this.usersService.getInterests(user.userId);
  }
}
