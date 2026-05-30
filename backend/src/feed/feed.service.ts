import { Injectable, Inject, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Post, Comment } from "@prisma/client";

interface ScoredPost extends Post {
  score: number;
  hourAge: number;
}

const FRESHNESS_DECAY = 6;
const FRESHNESS_WEIGHT = 40;
const VELOCITY_WEIGHT = 20;
const INTEREST_MATCH_BOOST = 30;
const SEEN_PENALTY = -10000;

const SMALL_COMMUNITY_THRESHOLD = 20;

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  // -------------------------------------------------------
  // CANDIDATE GENERATION
  // -------------------------------------------------------

  private async getCandidates(search?: string): Promise<Post[]> {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const where: any = { createdAt: { gte: since } };
    if (search) {
      where.content = { contains: search, mode: "insensitive" };
    }
    return this.prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  }

  // -------------------------------------------------------
  // SCORING
  // -------------------------------------------------------

  private calculateScore(
    post: Post,
    userInterests: string[],
    seenPostIds: Set<string>
  ): ScoredPost {
    const now = Date.now();
    const postDate = new Date(post.createdAt).getTime();
    const hourAge = (now - postDate) / (1000 * 60 * 60);

    const baseEngagement =
      post.likesCount + post.commentsCount * 2 - post.dislikesCount;

    const matchingInterests = post.hashtags.filter((h) => userInterests.includes(h));
    const interestMatch = matchingInterests.length > 0 ? INTEREST_MATCH_BOOST : 0;

    const freshnessBoost = Math.exp(-hourAge / FRESHNESS_DECAY) * FRESHNESS_WEIGHT;

    const engagementVelocity =
      hourAge > 0
        ? (post.likesCount + post.commentsCount) / Math.max(hourAge, 0.1)
        : post.likesCount + post.commentsCount;
    const velocityBoost = engagementVelocity * VELOCITY_WEIGHT;

    const seenPenalty = seenPostIds.has(post.id) ? SEEN_PENALTY : 0;

    const score =
      baseEngagement + interestMatch + freshnessBoost + velocityBoost + seenPenalty;

    return { ...post, score, hourAge };
  }

  // -------------------------------------------------------
  // STAGED DISTRIBUTION
  // -------------------------------------------------------

  private simpleHash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33 + str.charCodeAt(i)) & 0xffffffff;
    }
    return hash >>> 0;
  }

  private deterministicInSample(userId: string, postId: string, fraction: number): boolean {
    const hash = this.simpleHash(userId + ":" + postId);
    return hash % 10000 < fraction * 10000;
  }

  private async getTotalUsers(): Promise<number> {
    return this.prisma.user.count();
  }

  private shouldShowPostToUser(post: Post, userId: string, totalUsers: number): boolean {
    if (post.userId === userId) return true;

    if (totalUsers <= SMALL_COMMUNITY_THRESHOLD) return true;

    const shownFraction = post.shownToUsersCount / totalUsers;

    if (shownFraction < 0.05) {
      return this.deterministicInSample(userId, post.id, 0.05);
    } else if (shownFraction < 0.10) {
      return this.deterministicInSample(userId, post.id, 0.10);
    } else if (shownFraction < 0.50) {
      return this.deterministicInSample(userId, post.id, 0.50);
    }

    return true;
  }

  private async getUserInterests(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { interests: true },
    });
    return user?.interests ?? [];
  }

  // -------------------------------------------------------
  // MAIN FEED
  // -------------------------------------------------------

  async getFeed(
    userId: string,
    limit: number = 50,
    search?: string
  ): Promise<any> {
    const debug = {
      userId: userId.slice(0, 8),
      totalUsers: 0,
      interests: 0,
      candidates: 0,
      afterScoreFilter: 0,
      afterStagedFilter: 0,
      ownPosts: 0,
      ownPostsInCandidates: 0,
      stagedRejects: 0,
      finalResult: 0,
      fallbackTriggered: false,
      sampleScores: [] as { id: string; score: number; authorId: string; isOwn: boolean; shownToUsers: number }[],
    };

    const userInterests = await this.getUserInterests(userId);
    const totalUsers = await this.getTotalUsers();

    debug.totalUsers = totalUsers;
    debug.interests = userInterests.length;

    this.logger.log(
      `Feed request | userId=${userId.slice(0, 8)}... ` +
      `totalUsers=${totalUsers} interests=${userInterests.length} limit=${limit}` +
      (search ? ` search="${search}"` : "")
    );

    const viewed = await this.prisma.userPostView.findMany({
      where: { userId },
      select: { postId: true },
    });
    const seenPostIds = new Set(viewed.map((v) => v.postId));

    const candidates = await this.getCandidates(search);
    debug.candidates = candidates.length;
    debug.ownPostsInCandidates = candidates.filter((p) => p.userId === userId).length;

    this.logger.log(`Candidates | count=${candidates.length} seen=${seenPostIds.size}`);

    const scoredPosts = candidates.map((post) =>
      this.calculateScore(post, userInterests, seenPostIds)
    );

    // Capture sample scores for first 5 posts
    debug.sampleScores = scoredPosts.slice(0, 5).map((p) => ({
      id: p.id.slice(0, 8),
      score: Math.round(p.score * 100) / 100,
      authorId: p.userId.slice(0, 8),
      isOwn: p.userId === userId,
      shownToUsers: p.shownToUsersCount,
    }));

    const filtered = scoredPosts.filter((post) => {
      if (post.userId === userId) return true;
      return this.shouldShowPostToUser(post, userId, totalUsers);
    });

    debug.afterStagedFilter = filtered.length;
    debug.ownPosts = filtered.filter((p) => p.userId === userId).length;
    debug.stagedRejects = scoredPosts.length - filtered.length;

    // Count posts that pass staged distribution (for debug)
    debug.afterScoreFilter = scoredPosts.length;

    this.logger.log(
      `Filtered | afterFilters=${filtered.length} ownPosts=${
        filtered.filter((p) => p.userId === userId).length
      } stagedRejects=${scoredPosts.length - filtered.length}`
    );

    filtered.sort((a, b) => b.score - a.score);

    let result = filtered.slice(0, limit);

    // Fallback: if staged distribution filtered too aggressively,
    // relax to show all candidates (still sorted by score).
    if (result.length < limit && candidates.length > result.length && totalUsers > SMALL_COMMUNITY_THRESHOLD) {
      const relaxed = scoredPosts.filter((post) => {
        if (post.userId === userId) return true;
        return true;
      });
      relaxed.sort((a, b) => b.score - a.score);
      result = relaxed.slice(0, limit);
      debug.fallbackTriggered = true;
      this.logger.warn(
        `Fallback triggered | relaxedResults=${result.length} ` +
        `(staged filtered down to ${filtered.length} with ${candidates.length} candidates)`
      );
    }

    debug.finalResult = result.length;

    this.logger.log(`Result | posts=${result.length} limit=${limit}`);

    // Track views for shown posts (exclude own posts)
    for (const post of result) {
      if (post.userId === userId) continue;

      await this.prisma.userPostView.upsert({
        where: {
          userId_postId: { userId, postId: post.id },
        },
        create: {
          userId,
          postId: post.id,
        },
        update: {},
      });

      await this.prisma.post.update({
        where: { id: post.id },
        data: { shownToUsersCount: { increment: 1 } },
      });
    }

    const posts = await this.enrichPosts(result, userId);

    return { posts, _debug: debug };
  }

  // -------------------------------------------------------
  // ENRICHMENT
  // -------------------------------------------------------

  private async enrichPosts(posts: ScoredPost[], userId: string): Promise<any[]> {
    const postIds = posts.map((p) => p.id);
    const authorIds = [...new Set(posts.map((p) => p.userId))];

    const authors = await this.prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, anonymousId: true },
    });
    const authorMap: Record<string, string> = {};
    for (const a of authors) authorMap[a.id] = a.anonymousId;

    let userReactions: Record<string, string> = {};
    if (postIds.length > 0) {
      const reactions = await this.prisma.reaction.findMany({
        where: {
          userId,
          targetType: "post",
          targetId: { in: postIds },
        },
        select: { targetId: true, type: true },
      });
      userReactions = Object.fromEntries(reactions.map((r) => [r.targetId, r.type]));
    }

    const topCommentMap: Record<string, any | null> = {};
    for (const postId of postIds) {
      const topComment = await this.prisma.comment.findFirst({
        where: { postId, parentCommentId: null },
        orderBy: { likesCount: "desc" },
        include: { user: { select: { anonymousId: true } } },
      });

      topCommentMap[postId] = topComment
        ? {
            id: topComment.id,
            content: topComment.content,
            authorAnonymousId: topComment.user.anonymousId,
            likesCount: topComment.likesCount,
            dislikesCount: topComment.dislikesCount,
            createdAt: topComment.createdAt.toISOString(),
          }
        : null;
    }

    return posts.map((p) => ({
      id: p.id,
      content: p.content,
      hashtags: p.hashtags,
      createdAt: p.createdAt.toISOString(),
      likesCount: p.likesCount,
      dislikesCount: p.dislikesCount,
      commentsCount: p.commentsCount,
      viewsCount: p.viewsCount,
      authorAnonymousId: authorMap[p.userId] || "Unknown",
      userReaction: userReactions[p.id] || null,
      topComment: topCommentMap[p.id] || null,
    }));
  }
}
