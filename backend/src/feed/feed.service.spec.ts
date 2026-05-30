import { Test, TestingModule } from "@nestjs/testing";
import { FeedService } from "./feed.service";
import { PrismaService } from "../prisma/prisma.service";

function makePost(overrides: Record<string, any> = {}): any {
  return {
    id: overrides.id ?? "post-1",
    userId: overrides.userId ?? "author-1",
    content: "test content",
    hashtags: overrides.hashtags ?? [],
    createdAt: overrides.createdAt ?? new Date(),
    likesCount: overrides.likesCount ?? 0,
    dislikesCount: overrides.dislikesCount ?? 0,
    commentsCount: overrides.commentsCount ?? 0,
    viewsCount: overrides.viewsCount ?? 0,
    shownToUsersCount: overrides.shownToUsersCount ?? 0,
  };
}

describe("FeedService", () => {
  let service: FeedService;
  let prisma: any;

  const mockUserFindUnique = jest.fn();
  const mockUserCount = jest.fn();
  const mockUserPostViewFindMany = jest.fn();
  const mockPostFindMany = jest.fn();
  const mockUserPostViewUpsert = jest.fn();
  const mockPostUpdate = jest.fn();
  const mockUserFindMany = jest.fn();
  const mockReactionFindMany = jest.fn();
  const mockCommentFindFirst = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: mockUserFindUnique,
              count: mockUserCount,
              findMany: mockUserFindMany,
            },
            userPostView: {
              findMany: mockUserPostViewFindMany,
              upsert: mockUserPostViewUpsert,
            },
            post: {
              findMany: mockPostFindMany,
              update: mockPostUpdate,
            },
            reaction: {
              findMany: mockReactionFindMany,
            },
            comment: {
              findFirst: mockCommentFindFirst,
            },
          },
        },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);
    prisma = module.get(PrismaService);

    // Default mocks that work for most tests
    mockUserFindUnique.mockResolvedValue({ interests: [] });
    mockUserCount.mockResolvedValue(2);
    mockUserPostViewFindMany.mockResolvedValue([]);
    mockUserPostViewUpsert.mockResolvedValue({});
    mockPostUpdate.mockResolvedValue({});
    mockUserFindMany.mockResolvedValue([
      { id: "author-1", anonymousId: "111111" },
    ]);
    mockReactionFindMany.mockResolvedValue([]);
    mockCommentFindFirst.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("shouldShowPostToUser (via getFeed)", () => {
    it("shows author's own posts regardless of user count", async () => {
      const post = makePost({ userId: "author-1" });
      mockPostFindMany.mockResolvedValue([post]);
      mockUserCount.mockResolvedValue(100);

      const result = await service.getFeed("author-1", 50);

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].id).toBe("post-1");
    });

    it("shows all posts to all users in small communities (≤20 total users)", async () => {
      const post = makePost({ userId: "author-1" });
      mockPostFindMany.mockResolvedValue([post]);
      mockUserCount.mockResolvedValue(20);

      const result = await service.getFeed("user-b", 50);

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].id).toBe("post-1");
    });

    it("shows all posts to all users when only 2 total users exist (regression test for the bug)", async () => {
      // This is the exact scenario from the bug report:
      // User A creates a post, User B (new account) should see it
      const post = makePost({ userId: "author-a", shownToUsersCount: 0 });
      mockPostFindMany.mockResolvedValue([post]);
      mockUserCount.mockResolvedValue(2);
      mockUserFindMany.mockResolvedValue([
        { id: "author-a", anonymousId: "666666" },
      ]);

      const result = await service.getFeed("user-b", 50);

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].id).toBe("post-1");
      expect(result.posts[0].authorAnonymousId).toBe("666666");
    });

    it("shows all posts when there is exactly 1 user", async () => {
      const post = makePost({ userId: "author-1" });
      mockPostFindMany.mockResolvedValue([post]);
      mockUserCount.mockResolvedValue(1);

      const result = await service.getFeed("author-1", 50);

      expect(result.posts).toHaveLength(1);
    });
  });

  describe("staged distribution for large communities", () => {
    it("applies staged distribution when totalUsers > 20, fallback ensures posts are shown", async () => {
      // With 100 users and shownToUsersCount=0, the post enters 5% bracket.
      // The fallback mechanism guarantees the post is shown even if hash doesn't match.
      const post = makePost({ userId: "author-1", shownToUsersCount: 0 });
      mockPostFindMany.mockResolvedValue([post]);
      mockUserCount.mockResolvedValue(100);

      const result = await service.getFeed("user-b", 50);

      // Fallback ensures at least one post is returned
      expect(result.posts.length).toBeGreaterThanOrEqual(1);
    });

    it("shows posts that have reached >50% shownToUsersCount to everyone", async () => {
      const post = makePost({ userId: "author-1", shownToUsersCount: 60 });
      mockPostFindMany.mockResolvedValue([post]);
      mockUserCount.mockResolvedValue(100);

      const result = await service.getFeed("user-b", 50);

      expect(result.posts).toHaveLength(1);
    });
  });

  describe("score-based sorting (no filtering)", () => {
    it("shows posts regardless of negative score, sorted with SEEN_PENALTY affecting order", async () => {
      // SEEN_PENALTY deprioritizes seen posts but doesn't hide them.
      // Post is very old with heavy dislikes, but still appears.
      const oldDate = new Date(Date.now() - 100 * 60 * 60 * 1000);
      const post = makePost({
        userId: "author-1",
        createdAt: oldDate,
        dislikesCount: 100,
      });
      mockPostFindMany.mockResolvedValue([post]);
      mockUserCount.mockResolvedValue(20);

      const result = await service.getFeed("user-b", 50);

      expect(result.posts).toHaveLength(1);
    });

    it("shows posts that user has already seen (SEEN_PENALTY regression test)", async () => {
      // Previously seen posts were hidden by SEEN_PENALTY=-10000 + score≤0 filter.
      // Now they should appear but sorted below unseen posts.
      const post = makePost({ userId: "author-1", shownToUsersCount: 0 });
      mockPostFindMany.mockResolvedValue([post]);
      mockUserCount.mockResolvedValue(20);
      // Simulate user has already seen this post
      mockUserPostViewFindMany.mockResolvedValue([{ postId: "post-1" }]);

      const result = await service.getFeed("user-b", 50);

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].id).toBe("post-1");
    });
  });

  describe("fallback mechanism", () => {
    it("falls back to full candidate set when staged distribution yields too few results", async () => {
      // Create 10 posts, all from other authors, with staged distribution
      // likely filtering most out (shownToUsersCount=0, 100 users = 5% bracket)
      const posts = Array.from({ length: 10 }, (_, i) =>
        makePost({ id: `post-${i}`, userId: `author-${i}`, shownToUsersCount: 0 })
      );
      mockPostFindMany.mockResolvedValue(posts);
      mockUserCount.mockResolvedValue(100);
      // Return all authors for enrichment
      mockUserFindMany.mockResolvedValue(
        posts.map((p, i) => ({ id: `author-${i}`, anonymousId: String(100000 + i) }))
      );

      const result = await service.getFeed("user-b", 50);

      // Fallback should kick in: all 10 posts should be shown
      expect(result.posts).toHaveLength(10);
    });
  });

  describe("view tracking", () => {
    it("does not track views for the author's own posts", async () => {
      const post = makePost({ userId: "author-1" });
      mockPostFindMany.mockResolvedValue([post]);

      await service.getFeed("author-1", 50);

      expect(mockUserPostViewUpsert).not.toHaveBeenCalled();
      // post.update for shownToUsersCount should not be called either
      const updateCalls = mockPostUpdate.mock.calls.filter(
        (call: any[]) => call[0]?.data?.shownToUsersCount
      );
      expect(updateCalls).toHaveLength(0);
    });

    it("tracks views for other users' posts", async () => {
      const post = makePost({ userId: "author-1" });
      mockPostFindMany.mockResolvedValue([post]);
      mockUserCount.mockResolvedValue(20);

      await service.getFeed("user-b", 50);

      expect(mockUserPostViewUpsert).toHaveBeenCalled();
      expect(mockPostUpdate).toHaveBeenCalled();
    });
  });
});
