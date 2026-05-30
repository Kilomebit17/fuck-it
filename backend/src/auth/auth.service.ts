import { Injectable, Inject, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  async login(anonymousId: string, password: string): Promise<{ token: string; user: { id: string; anonymousId: string } }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { anonymousId },
      select: { id: true, passwordHash: true },
    });

    if (existingUser) {
      const valid = bcrypt.compareSync(password, existingUser.passwordHash);
      if (!valid) {
        throw new BadRequestException("Invalid password");
      }

      const token = this.jwtService.sign({ userId: existingUser.id, anonymousId });
      return { token, user: { id: existingUser.id, anonymousId } };
    }

    const user = await this.prisma.user.create({
      data: {
        anonymousId,
        passwordHash: bcrypt.hashSync(password, 10),
      },
    });

    const token = this.jwtService.sign({ userId: user.id, anonymousId });
    return { token, user: { id: user.id, anonymousId } };
  }

  async checkId(anonymousId: string): Promise<{ exists: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { anonymousId },
      select: { id: true },
    });
    return { exists: !!user };
  }

  async getRandomId(): Promise<{ anonymousId: string }> {
    let id: string;
    do {
      id = String(Math.floor(100000 + Math.random() * 900000));
    } while (
      await this.prisma.user.findUnique({ where: { anonymousId: id }, select: { id: true } })
    );
    return { anonymousId: id };
  }
}
