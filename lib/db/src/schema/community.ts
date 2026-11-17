import { createInsertSchema } from "drizzle-zod";
import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const communityPostsTable = pgTable(
  "community_posts",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    nickname: text("nickname").notNull(),
    category: text("category").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("community_posts_created_at_idx").on(table.createdAt)],
);

export const communityCommentsTable = pgTable(
  "community_comments",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => communityPostsTable.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull(),
    nickname: text("nickname").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("community_comments_post_id_created_at_idx").on(table.postId, table.createdAt),
  ],
);

export const insertCommunityPostSchema = createInsertSchema(communityPostsTable).omit({
  id: true,
  createdAt: true,
});
export const insertCommunityCommentSchema = createInsertSchema(communityCommentsTable).omit({
  id: true,
  createdAt: true,
});

export type CommunityPost = typeof communityPostsTable.$inferSelect;
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type CommunityComment = typeof communityCommentsTable.$inferSelect;
export type InsertCommunityComment = z.infer<typeof insertCommunityCommentSchema>;
