import { Controller, Post, Get, Body, Param, Inject } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
  ) {}

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.anonymousId, dto.password);
  }

  @Get("check-id/:anonymousId")
  checkId(@Param("anonymousId") anonymousId: string) {
    return this.authService.checkId(anonymousId);
  }

  @Get("random-id")
  randomId() {
    return this.authService.getRandomId();
  }
}
