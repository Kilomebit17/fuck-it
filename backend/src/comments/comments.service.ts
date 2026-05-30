import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CommentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async create(postId: string, userId: string, content: string, parentCommentId?: string): Promise<any> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    if (parentCommentId) {
      const parent = await this.prisma.comment.findFirst({
        where: { id: parentCommentId, postId },
        select: { id: true },
      });

      if (!parent) {
        throw new NotFoundException("Parent comment not found");
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        parentCommentId: parentCommentId || null,
        userId,
        content: content.trim(),
      },
    });

    await this.prisma.post.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } },
    });

    return comment;
  }

  async getByPostId(postId: string): Promise<any[]> {
    const comments = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { anonymousId: true } },
      },
    });

    return comments.map((c) => ({
      id: c.id,
      postId: c.postId,
      parentCommentId: c.parentCommentId,
      userId: c.userId,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      likesCount: c.likesCount,
      dislikesCount: c.dislikesCount,
      authorAnonymousId: c.user.anonymousId,
    }));
  }
}
