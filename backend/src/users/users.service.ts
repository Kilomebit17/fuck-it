import { Injectable, Inject } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async getInterests(userId: string): Promise<{ interests: string[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { interests: true },
    });

    return { interests: user?.interests ?? [] };
  }

  async updateInterests(userId: string): Promise<void> {
    const userPosts = await this.prisma.post.findMany({
      where: { userId },
      select: { hashtags: true },
    });

    const postTags = userPosts.flatMap((p) => p.hashtags);

    const reactedPostTags = await this.prisma.reaction.findMany({
      where: { userId, targetType: "post" },
      select: { targetId: true },
    });

    const postIds = reactedPostTags.map((r) => r.targetId);

    const reactedTags: string[] = [];
    if (postIds.length > 0) {
      const posts = await this.prisma.post.findMany({
        where: { id: { in: postIds } },
        select: { hashtags: true },
      });
      reactedTags.push(...posts.flatMap((p) => p.hashtags));
    }

    const allTags = [...new Set([...postTags, ...reactedTags])];

    await this.prisma.user.update({
      where: { id: userId },
      data: { interests: allTags },
    });
  }
}
