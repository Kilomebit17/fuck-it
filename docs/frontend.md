# Frontend

## Setup

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:3000`.

## .env.local

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

## Tech Stack

- Next.js 14 (App Router) with SSR
- React 18 + TypeScript
- SCSS Modules for component styling
- CSS custom properties for dark/light theming
- No Redux, no component libraries

## Project Structure

```
src/
  app/
    layout.tsx               # Root layout (ThemeProvider + ToastProvider + flash-prevention script)
    page.tsx                 # Redirect (/ → /feed or /login)
    login/page.tsx           # Login page
    feed/page.tsx            # Feed with recommendation-driven posts
    post/[id]/page.tsx       # Post detail with threaded comments
  styles/
    global.scss              # Reset, typography, CSS custom properties (light/dark)
  services/
    api.ts                   # API client (fetch wrapper with auth token injection)
  types/
    index.ts                 # TypeScript interfaces (Post, Comment, User, etc.)
  hooks/
    useTheme.tsx             # Theme context + useTheme hook
  components/
    UI/
      Toast.tsx + .module.scss         # Toast notification system (context-based)
      ThemeToggle.tsx + .module.scss   # Dark/light toggle
      Shared.module.scss               # Reusable classes (btnPrimary, input, card, etc.)
      ReactionButton/
        ReactionButton.tsx + .module.scss  # SVG icon reaction button (heart / thumbs-down)
    Auth/
      LoginForm.tsx + .module.scss     # Login/auto-register form
    Post/
      PostCard.tsx + .module.scss      # Post card for feed display
      CreatePostForm.tsx + .module.scss # Post composer (avatar + auto-resize textarea + #tag extraction)
      PostDetail.module.scss            # Post detail view styles
    Comment/
      CommentItem.tsx + .module.scss    # Single comment (reactions, reply, collapse/expand)
      CommentList.tsx                   # Recursive tree renderer + buildTree() Map builder
      CommentInput.tsx + .module.scss   # Expandable comment form (compact → textarea on click)
    Layout/
      Header.tsx + .module.scss        # App header + Container utility
```

## Pages

| Route | Components | Description |
|-------|-----------|-------------|
| `/login` | `LoginForm` | ID input + password + debounced check + random ID button |
| `/feed` | `Header`, `CreatePostForm`, `PostCard` | Recommendation-driven feed with post composer |
| `/post/[id]` | `Header`, `CommentList`, `CommentItem` | Full threaded discussion, collapse/expand, reactions |

## Styling Rules

- Every component has its own `.module.scss`
- `global.scss` contains only reset, typography, and CSS custom properties
- `Shared.module.scss` for reusable utility classes
- No inline styles (except one `marginLeft: "auto"` in CommentItem)

## Theme

- CSS custom properties with `[data-theme="light"]` / `[data-theme="dark"]`
- Blocking inline `<script>` in `<head>` reads `localStorage` before paint (no flash)
- System preference detection as fallback

## State Management

- React Context for theme and toast notifications
- `localStorage` for auth token and user data
- Component-level `useState` for page state

## CommentInput

`components/Comment/CommentInput.tsx` — expandable comment form.

**Interaction flow:**
1. Initially shows a compact placeholder button ("Write a comment...")
2. On click: expands into a full textarea with auto-focus
3. On blur if empty: collapses back to compact state (`collapseOnBlur` prop)
4. `Cmd+Enter` or `Ctrl+Enter` to submit; `Esc` to cancel/collapse
5. For replies: `autoFocus` + `collapseOnBlur={false}` + `onCancel` for inline reply form

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSubmit` | `(content: string) => Promise<void>` | required | Called on submit |
| `onCancel` | `() => void` | optional | Called on Esc or Cancel button |
| `placeholder` | `string` | `"Write a comment..."` | Placeholder text |
| `autoFocus` | `boolean` | `false` | Start expanded on mount |
| `collapseOnBlur` | `boolean` | `true` | Collapse when empty on blur |

## ReactionButton

`components/UI/ReactionButton/ReactionButton.tsx` — SVG icon reaction button.

**Behavior:**
- Like: heart SVG (outline or filled)
- Dislike: thumbs-down SVG (outline or filled, vertically flipped thumbs-up icon)
- Active state: SVG fills with `var(--like)` or `var(--dislike)`
- Inactive state: outline only, `var(--text-secondary)` color
- Hover: subtle background highlight
- Theme-aware: respects CSS custom properties (light/dark)

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `type` | `"like" \| "dislike"` | Icon type |
| `active` | `boolean` | Whether user has reacted |
| `count` | `number` | Count display |
| `onClick` | `(e: React.MouseEvent) => void` | Click handler |
| `disabled` | `boolean` | Disabled state |

## API Client

`services/api.ts` — wraps `fetch` with:
- Automatic token injection from `localStorage`
- Base URL from `NEXT_PUBLIC_API_BASE_URL`
- JSON parsing and error throwing
