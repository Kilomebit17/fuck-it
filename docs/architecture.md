# Architecture

## Overview

Fuck It is a minimal anonymous social platform with a recommendation-driven feed. Users are identified by 6-digit anonymous IDs.

## Architecture Diagram

```
┌─────────────┐     HTTP/REST      ┌──────────────────────────────┐     Prisma       ┌────────────┐
│  Next.js     │ ◄───────────────► │  NestJS Backend              │ ◄─────────────► │ PostgreSQL │
│  Frontend    │     JSON API       │  (Modular Architecture)      │   ORM            │  16        │
│  (SSR)       │                    │                              │                  │            │
└─────────────┘                    └──────────────────────────────┘                  └────────────┘
```

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, SCSS Modules for styling
- **Backend**: NestJS, TypeScript, Prisma ORM, PostgreSQL 16, Passport JWT
- **Auth**: JWT tokens (7-day expiry), bcrypt password hashing
- **Storage**: PostgreSQL via Prisma, Docker for local dev

## Backend Module Structure

```
src/
├── main.ts                    # Bootstrap
├── app.module.ts              # Root module
├── prisma/
│   ├── prisma.module.ts       # Global Prisma provider (OnModuleInit/OnModuleDestroy)
│   └── prisma.service.ts      # PrismaClient wrapper
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts     # POST /auth/login, GET /auth/check-id, GET /auth/random-id
│   ├── auth.service.ts        # Auth logic + auto-registration
│   ├── auth.guard.ts          # JWT guard (required auth)
│   ├── optional-auth.guard.ts # JWT guard (optional auth)
│   ├── auth.decorator.ts      # @CurrentUser() param decorator
│   └── dto/login.dto.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts    # GET /user/interests
│   └── users.service.ts       # Interest tracking + updates
├── posts/
│   ├── posts.module.ts
│   ├── posts.controller.ts    # POST /posts, GET /posts/:id
│   ├── posts.service.ts       # Post CRUD
│   └── dto/create-post.dto.ts
├── comments/
│   ├── comments.module.ts
│   ├── comments.controller.ts # POST /posts/:id/comments, GET /posts/:id/comments
│   ├── comments.service.ts    # Comment CRUD with nesting
│   └── dto/create-comment.dto.ts
├── reactions/
│   ├── reactions.module.ts
│   ├── reactions.controller.ts # POST /reactions, GET /reactions
│   ├── reactions.service.ts    # Like/dislike toggle logic
│   └── dto/create-reaction.dto.ts
└── feed/
    ├── feed.module.ts
    ├── feed.controller.ts     # GET /feed
    └── feed.service.ts        # Recommendation engine (candidate gen, scoring, staged distribution)
```

## Frontend Component Structure

```
src/
├── app/
│   ├── layout.tsx             # Root layout (ThemeProvider + ToastProvider + flash-prevention script)
│   ├── page.tsx               # Redirect
│   ├── login/page.tsx         # Login page
│   ├── feed/page.tsx          # Feed page
│   └── post/[id]/page.tsx     # Post detail with threaded comments
├── styles/
│   └── global.scss            # Reset + typography + CSS custom properties (theme)
├── services/
│   └── api.ts                 # API client (fetch + token injection)
├── types/
│   └── index.ts               # TypeScript interfaces
├── hooks/
│   └── useTheme.tsx           # ThemeContext + useTheme hook
└── components/
    ├── UI/
    │   ├── Toast.tsx + .module.scss
    │   ├── ThemeToggle.tsx + .module.scss
    │   └── Shared.module.scss
    ├── Auth/
    │   └── LoginForm.tsx + .module.scss
    ├── Post/
    │   ├── PostCard.tsx + .module.scss
    │   ├── PostDetail.module.scss
    │   └── CreatePostForm.tsx + .module.scss
    ├── Comment/
    │   ├── CommentItem.tsx + .module.scss
    │   └── CommentList.tsx
    └── Layout/
        └── Header.tsx + .module.scss
```

## Feed Module (Recommendation System)

All recommendation logic isolated in `FeedModule`:

1. **Candidate Generation** (`getCandidates`): `prisma.post.findMany({ where: { createdAt: { gte: 48h_ago } }, take: 500 })`
2. **Scoring** (`calculateScore`): engagement + interest match + freshness + velocity - seen penalty
3. **Staged Distribution** (`shouldShowPostToUser`): 5% → 10% → 50% → 100% phases via deterministic hash. Author always sees own posts.
4. **Enrichment**: Batch Prisma queries for author names, user reactions, top 2 comments per post
5. **View Tracking**: `upsert` into `UserPostView` + increment `shownToUsersCount` for each shown post

## Data Flow

### Post Detail Page
```
Client → GET /api/posts/:id → PostsService.getById()
  → prisma.post.findUnique({ include: { user } })
  → prisma.comment.findMany({ include: { user } })
  → prisma.reaction queries for user reactions
  → Return { post, comments[] }
  → Frontend builds comment tree via buildCommentTree() (Map<parentId, Comment[]>)
```

### Reactions
```
Client → POST /api/reactions → ReactionsService.react()
  → prisma.$transaction: findUnique → delete/create/update reaction + increment/decrement counts
  → Return { likesCount, dislikesCount }
  → Frontend updates local state
```
