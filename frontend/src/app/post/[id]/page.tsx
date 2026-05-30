import type { Metadata } from "next";
import type { PostDetail, Comment } from "@/types";
import { fetchPost } from "@/services/api-server";
import { stripHtml } from "@/lib/html";
import PostPageClient from "./PostPageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function generateDescription(htmlContent: string): string {
  const text = stripHtml(htmlContent).replace(/\s+/g, " ").trim();
  return text.length > 160 ? text.slice(0, 157) + "..." : text;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const data = await fetchPost(params.id);
    const { post } = data;
    const title = stripHtml(post.content).replace(/\s+/g, " ").trim();
    const seoTitle = title.length > 60 ? title.slice(0, 57) + "..." : title;
    const description = generateDescription(post.content);
    const postUrl = `${siteUrl}/post/${post.id}`;

    return {
      title: seoTitle,
      description,
      alternates: {
        canonical: postUrl,
      },
      openGraph: {
        title: seoTitle,
        description,
        url: postUrl,
        type: "article",
        publishedTime: post.createdAt,
        siteName: "Fuck IT",
        images: [
          {
            url: `${siteUrl}/api/og?title=${encodeURIComponent(seoTitle.slice(0, 60))}`,
            width: 1200,
            height: 630,
            alt: seoTitle,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: seoTitle,
        description,
        images: [`${siteUrl}/api/og?title=${encodeURIComponent(seoTitle.slice(0, 60))}`],
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch {
    return {
      title: "Post not found",
      robots: { index: false, follow: false },
    };
  }
}

export default async function PostPage({
  params,
}: {
  params: { id: string };
}) {
  let initialPost: PostDetail | null = null;
  let initialComments: Comment[] = [];
  let notFound = false;

  try {
    const data = await fetchPost(params.id);
    initialPost = data.post;
    initialComments = data.comments;
  } catch {
    notFound = true;
  }

  if (notFound || !initialPost) {
    return (
      <PostPageClient
        initialPost={null as any}
        initialComments={[]}
      />
    );
  }

  const plainContent = stripHtml(initialPost.content);
  const firstHeading = plainContent.split("\n")[0].trim();
  const description = generateDescription(initialPost.content);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    headline: firstHeading || "Anonymous Post",
    datePublished: initialPost.createdAt,
    dateModified: initialPost.createdAt,
    author: {
      "@type": "Person",
      name: `Anonymous ${initialPost.authorAnonymousId}`,
    },
    description,
    url: `${siteUrl}/post/${initialPost.id}`,
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: initialPost.likesCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: initialPost.commentsCount,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostPageClient initialPost={initialPost} initialComments={initialComments} />
    </>
  );
}
