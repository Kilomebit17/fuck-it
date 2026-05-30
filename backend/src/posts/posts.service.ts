import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class PostsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(UsersService) private readonly usersService: UsersService,
  ) {}

  async create(userId: string, content: string): Promise<any> {
    const plainText = content.replace(/<[^>]*>/g, "").trim();

    const hashtags = [
      ...new Set(
        (plainText.match(/#(\w+)/g) || []).map((t: string) => t.slice(1).toLowerCase())
      ),
    ];

    const post = await this.prisma.post.create({
      data: {
        userId,
        content: content.trim(),
        hashtags,
      },
    });

    await this.usersService.updateInterests(userId);

    return post;
  }

  async getPublicIds(): Promise<{ id: string; createdAt: string }[]> {
    const posts = await this.prisma.post.findMany({
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    return posts.map((p) => ({
      id: p.id,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async getById(postId: string, currentUserId?: string): Promise<any> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: { select: { anonymousId: true } },
      },
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    if (currentUserId) {
      const existing = await this.prisma.postDetailView.findUnique({
        where: { userId_postId: { userId: currentUserId, postId } },
      });

      if (!existing) {
        await this.prisma.$transaction([
          this.prisma.postDetailView.create({
            data: { userId: currentUserId, postId },
          }),
          this.prisma.post.update({
            where: { id: postId },
            data: { viewsCount: { increment: 1 } },
          }),
        ]);
      }
    } else {
      await this.prisma.post.update({
        where: { id: postId },
        data: { viewsCount: { increment: 1 } },
      });
    }

    const comments = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { anonymousId: true } },
      },
    });

    const commentIds = comments.map((c) => c.id);

    let postUserReaction: string | null = null;
    const commentReactions: Record<string, string | null> = {};

    if (currentUserId) {
      const postReaction = await this.prisma.reaction.findUnique({
        where: {
          userId_targetType_targetId: {
            userId: currentUserId,
            targetType: "post",
            targetId: postId,
          },
        },
        select: { type: true },
      });
      postUserReaction = postReaction?.type || null;

      if (commentIds.length > 0) {
        const reactions = await this.prisma.reaction.findMany({
          where: {
            userId: currentUserId,
            targetType: "comment",
            targetId: { in: commentIds },
          },
          select: { targetId: true, type: true },
        });
        for (const c of commentIds) commentReactions[c] = null;
        for (const r of reactions) commentReactions[r.targetId] = r.type;
      }
    }

    return {
      post: {
        id: post.id,
        userId: post.userId,
        content: post.content,
        hashtags: post.hashtags,
        createdAt: post.createdAt.toISOString(),
        likesCount: post.likesCount,
        dislikesCount: post.dislikesCount,
        commentsCount: post.commentsCount,
        viewsCount: post.viewsCount,
        shownToUsersCount: post.shownToUsersCount,
        authorAnonymousId: post.user.anonymousId,
        userReaction: postUserReaction,
      },
      comments: comments.map((c) => ({
        id: c.id,
        postId: c.postId,
        parentCommentId: c.parentCommentId,
        userId: c.userId,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        likesCount: c.likesCount,
        dislikesCount: c.dislikesCount,
        authorAnonymousId: c.user.anonymousId,
        userReaction: commentReactions[c.id] || null,
      })),
    };
  }
}
