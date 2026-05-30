<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Fuck IT frontend. A PostHog provider was added to the Next.js 14 app (using a `PHProvider` client component wrapping the root layout), a reverse proxy was configured in `next.config.js` to route events through `/ingest`, and 9 distinct events were instrumented across 3 files covering user authentication, content creation, and engagement actions. Users are identified by their anonymous 6-digit ID at login/signup.

| Event | Description | File |
|---|---|---|
| `user_signed_up` | New anonymous account created | `src/components/Auth/LoginForm.tsx` |
| `user_logged_in` | Existing user logs in | `src/components/Auth/LoginForm.tsx` |
| `random_id_generated` | User clicks dice to generate a random ID | `src/components/Auth/LoginForm.tsx` |
| `post_created` | User submits a new post to the feed | `src/app/feed/page.tsx` |
| `post_reacted` | User likes or dislikes a post in the feed | `src/app/feed/page.tsx` |
| `post_viewed` | User opens a post detail page | `src/app/post/[id]/page.tsx` |
| `post_reacted` | User likes or dislikes a post on the detail page | `src/app/post/[id]/page.tsx` |
| `comment_created` | User submits a top-level comment | `src/app/post/[id]/page.tsx` |
| `comment_replied` | User replies to an existing comment | `src/app/post/[id]/page.tsx` |
| `comment_reacted` | User likes or dislikes a comment | `src/app/post/[id]/page.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1641812)
- [New signups & logins over time](/insights/J5uIZ5kt)
- [Sign-up to first post funnel](/insights/JMDhQNQQ)
- [Post engagement activity](/insights/SE2N3MvO)
- [Post view to comment conversion funnel](/insights/Le8EXc44)
- [Daily active users](/insights/tKmtY5r0)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
