# Backend

## Setup

```bash
# 1. Start PostgreSQL (Docker or local)
docker compose up -d

# 2. Push schema to database
npx prisma db push

# 3. Install and start
npm install
npm run dev
```

Runs on `http://localhost:3001`.

## Database

PostgreSQL 16 via Prisma ORM 5.

### Connection

`DATABASE_URL` in `.env`:
```
DATABASE_URL="postgresql://fuckit:fuckit@localhost:5432/fuckit?schema=public"
```

### Schema

5 models with Prisma relations:

- **User** — id (uuid), anonymousId (unique 6-digit), passwordHash, interests (string[]), createdAt
- **Post** — id, userId (FK → User), content, hashtags (string[]), createdAt, likesCount, dislikesCount, commentsCount, viewsCount, shownToUsersCount. Has `user` relation and `views[]` relation.
- **Comment** — id, postId (FK → Post), parentCommentId (self-referencing FK), userId (FK → User), content, createdAt, likesCount, dislikesCount. Has `parent`/`replies` for infinite nesting.
- **Reaction** — id, userId (FK → User), targetType ("post"|"comment"), targetId, type ("like"|"dislike"). Unique constraint on `(userId, targetType, targetId)`. Index on `(targetType, targetId)` for query performance.
- **UserPostView** — id, userId (FK → User), postId (FK → Post), createdAt. Unique constraint on `(userId, postId)`. Tracks which posts a user has seen (for recommendation seen-penalty).

### Relations Summary

```
User 1→N Post
User 1→N Comment
User 1→N Reaction
User 1→N UserPostView
Post 1→N Comment
Post 1→N UserPostView
Comment 1→N Comment (self-referencing tree)
```

*Note: Reaction uses polymorphic `targetId` (references either Post or Comment), so it doesn't have a direct FK to Post/Comment in Prisma. Lookups use indexes on `(targetType, targetId)`.*

## NestJS Architecture

The backend is organized into 7 modules:

### PrismaModule (`src/prisma/`)
- Global module, provides `PrismaService` to all other modules
- `PrismaService` extends `PrismaClient` with `OnModuleInit`/`OnModuleDestroy` lifecycle hooks
- Replaces the old SQLite `DatabaseModule`

### AuthModule (`src/auth/`)
- Controller: `POST /auth/login`, `GET /auth/check-id/:id`, `GET /auth/random-id`
- Service: Login flow with auto-registration (if ID doesn't exist, creates account via Prisma)
- Guards: `JwtAuthGuard` (required), `OptionalAuthGuard` (optional)
- Uses `@nestjs/jwt` + `@nestjs/passport` for JWT token management

### UsersModule (`src/users/`)
- Controller: `GET /user/interests`
- Service: Tracks user interests derived from their posts and reactions
- `updateInterests()` queries posts and reacted posts via Prisma to build interest array

### PostsModule (`src/posts/`)
- Controller: `POST /posts`, `GET /posts/:id`
- Service: Create posts (hashtags auto-extracted from `#tag` syntax), retrieve with comments and user reactions
- `GET /posts/:id` returns post + flat comment list with `userReaction` per comment
- Uses Prisma `include` for author enrichment

### CommentsModule (`src/comments/`)
- Controller: `POST /posts/:postId/comments`, `GET /posts/:postId/comments`
- Service: Create comments with optional `parentCommentId` for nesting
- Self-referencing relation: `parent` ↔ `replies`

### ReactionsModule (`src/reactions/`)
- Controller: `POST /reactions`, `GET /reactions?targetType=&targetIds=`
- Service: Toggle like/dislike using Prisma transactions (`$transaction`)
- Reaction toggle: creates → switches type → deletes on re-click

### FeedModule (`src/feed/`)
- Controller: `GET /feed?limit=50`
- Service: Complete recommendation system using Prisma queries
  - **Candidate Selection**: `prisma.post.findMany({ where: { createdAt: { gte: since } }, take: 500 })`
  - **Scoring**: engagement + interest match + freshness + velocity - seen penalty
  - **Staged Distribution**: 5% → 10% → 50% → 100% phases
  - **Enrichment**: Batch queries for authors, reactions, top comments

## DI Note

`tsx` (esbuild-based) does not support `emitDecoratorMetadata`. All constructors use explicit `@Inject()` decorators for DI.
