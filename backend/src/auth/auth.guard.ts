import { Injectable, Inject, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthUser } from "./auth.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedException("No token provided");
    }

    try {
      request.user = this.jwtService.verify<AuthUser>(header.slice(7));
      return true;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
