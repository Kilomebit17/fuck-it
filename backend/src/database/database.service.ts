import Database from "better-sqlite3";
import path from "path";
import { Injectable } from "@nestjs/common";

@Injectable()
export class DatabaseService {
  readonly db: Database.Database;
  private idCounter = 0;

  constructor() {
    const dbPath = path.join(__dirname, "..", "..", "data.db");
    this.db = new Database(dbPath);

    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        anonymousId TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        interests TEXT NOT NULL DEFAULT '[]',
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        content TEXT NOT NULL,
        hashtags TEXT NOT NULL DEFAULT '[]',
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        likesCount INTEGER NOT NULL DEFAULT 0,
        dislikesCount INTEGER NOT NULL DEFAULT 0,
        commentsCount INTEGER NOT NULL DEFAULT 0,
        viewsCount INTEGER NOT NULL DEFAULT 0,
        shownToUsersCount INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        postId TEXT NOT NULL,
        parentCommentId TEXT,
        userId TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        likesCount INTEGER NOT NULL DEFAULT 0,
        dislikesCount INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (postId) REFERENCES posts(id),
        FOREIGN KEY (parentCommentId) REFERENCES comments(id),
        FOREIGN KEY (userId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS reactions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        targetType TEXT NOT NULL CHECK(targetType IN ('post', 'comment')),
        targetId TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('like', 'dislike')),
        FOREIGN KEY (userId) REFERENCES users(id),
        UNIQUE(userId, targetType, targetId)
      );

      CREATE TABLE IF NOT EXISTS user_post_views (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        postId TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (postId) REFERENCES posts(id),
        UNIQUE(userId, postId)
      );

      CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON posts(createdAt);
      CREATE INDEX IF NOT EXISTS idx_posts_userId ON posts(userId);
      CREATE INDEX IF NOT EXISTS idx_comments_postId ON comments(postId);
      CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parentCommentId);
      CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(targetType, targetId);
      CREATE INDEX IF NOT EXISTS idx_user_post_views_user ON user_post_views(userId);
    `);
  }

  generateId(): string {
    this.idCounter++;
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    const counter = this.idCounter.toString(36);
    return `${timestamp}-${random}-${counter}`;
  }
}
