import { Injectable, Inject, CanActivate, ExecutionContext } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthUser } from "./auth.decorator";

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization;

    if (header && header.startsWith("Bearer ")) {
      try {
        request.user = this.jwtService.verify<AuthUser>(header.slice(7));
      } catch {
        // ignore invalid token for optional auth
      }
    }

    return true;
  }
}
