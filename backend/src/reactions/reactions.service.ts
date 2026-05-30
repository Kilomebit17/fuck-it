import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class ReactionsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(UsersService) private readonly usersService: UsersService,
  ) {}

  async react(
    userId: string,
    targetType: string,
    targetId: string,
    type: string,
  ): Promise<{ likesCount: number; dislikesCount: number }> {
    if (targetType === "post") {
      const post = await this.prisma.post.findUnique({ where: { id: targetId }, select: { id: true } });
      if (!post) throw new NotFoundException("Post not found");
    } else {
      const comment = await this.prisma.comment.findUnique({ where: { id: targetId }, select: { id: true } });
      if (!comment) throw new NotFoundException("Comment not found");
    }

    const existing = await this.prisma.reaction.findUnique({
      where: {
        userId_targetType_targetId: { userId, targetType, targetId },
      },
    });

    const countField = type === "like" ? "likesCount" : "dislikesCount";
    const oppositeField = type === "like" ? "dislikesCount" : "likesCount";
    const isPost = targetType === "post";

    await this.prisma.$transaction(async (tx) => {
      if (existing) {
        if (existing.type === type) {
          await tx.reaction.delete({ where: { id: existing.id } });

          if (isPost) {
            await tx.post.update({
              where: { id: targetId },
              data: { [countField]: { decrement: 1 } },
            });
          } else {
            await tx.comment.update({
              where: { id: targetId },
              data: { [countField]: { decrement: 1 } },
            });
          }
        } else {
          await tx.reaction.update({
            where: { id: existing.id },
            data: { type },
          });

          if (isPost) {
            await tx.post.update({
              where: { id: targetId },
              data: {
                [oppositeField]: { decrement: 1 },
                [countField]: { increment: 1 },
              },
            });
          } else {
            await tx.comment.update({
              where: { id: targetId },
              data: {
                [oppositeField]: { decrement: 1 },
                [countField]: { increment: 1 },
              },
            });
          }
        }
      } else {
        await tx.reaction.create({
          data: { userId, targetType, targetId, type },
        });

        if (isPost) {
          await tx.post.update({
            where: { id: targetId },
            data: { [countField]: { increment: 1 } },
          });
        } else {
          await tx.comment.update({
            where: { id: targetId },
            data: { [countField]: { increment: 1 } },
          });
        }
      }
    });

    if (targetType === "post") {
      await this.usersService.updateInterests(userId);
    }

    const updated = isPost
      ? await this.prisma.post.findUnique({
          where: { id: targetId },
          select: { likesCount: true, dislikesCount: true },
        })
      : await this.prisma.comment.findUnique({
          where: { id: targetId },
          select: { likesCount: true, dislikesCount: true },
        });

    return { likesCount: updated!.likesCount, dislikesCount: updated!.dislikesCount };
  }

  async getUserReactions(userId: string, targetType: string, targetIds: string[]): Promise<Record<string, string | null>> {
    if (targetIds.length === 0) return {};

    const reactions = await this.prisma.reaction.findMany({
      where: {
        userId,
        targetType,
        targetId: { in: targetIds },
      },
      select: { targetId: true, type: true },
    });

    const result: Record<string, string | null> = {};
    for (const id of targetIds) result[id] = null;
    for (const r of reactions) result[r.targetId] = r.type;

    return result;
  }
}
