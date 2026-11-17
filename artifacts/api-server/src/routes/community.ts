import { desc, eq, inArray } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  AddCommunityCommentBody,
  AddCommunityCommentParams,
  AddCommunityCommentResponse,
  CreateCommunityPostBody,
  CreateCommunityPostResponse,
  ListCommunityPostsQueryParams,
  ListCommunityPostsResponse,
} from "@workspace/api-zod";
import {
  communityCommentsTable,
  communityPostsTable,
  db,
} from "@workspace/db";

const router: IRouter = Router();

router.get("/community/posts", async (req, res): Promise<void> => {
  const query = ListCommunityPostsQueryParams.safeParse(req.query);
  if (!query.success || !query.data.sessionId.trim() || query.data.sessionId.length > 100) {
    res.status(400).json({ error: "Invalid sessionId" });
    return;
  }

  const posts = await db
    .select()
    .from(communityPostsTable)
    .orderBy(desc(communityPostsTable.createdAt))
    .limit(40);

  if (posts.length === 0) {
    res.json([]);
    return;
  }

  const comments = await db
    .select()
    .from(communityCommentsTable)
    .where(inArray(communityCommentsTable.postId, posts.map((post) => post.id)))
    .orderBy(communityCommentsTable.createdAt);

  const commentsByPost = new Map<number, typeof comments>();
  for (const comment of comments) {
    const existing = commentsByPost.get(comment.postId) ?? [];
    existing.push(comment);
    commentsByPost.set(comment.postId, existing);
  }

  const response = posts.map((post) => ({
    id: post.id,
    nickname: post.nickname,
    category: post.category,
    content: post.content,
    createdAt: post.createdAt.toISOString(),
    isMine: post.sessionId === query.data.sessionId,
    comments: (commentsByPost.get(post.id) ?? []).map((comment) => ({
      id: comment.id,
      postId: comment.postId,
      nickname: comment.nickname,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      isMine: comment.sessionId === query.data.sessionId,
    })),
  }));

  res.json(ListCommunityPostsResponse.parse(response));
});

router.post("/community/posts", async (req, res): Promise<void> => {
  const parsed = CreateCommunityPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const sessionId = parsed.data.sessionId.trim();
  const nickname = parsed.data.nickname.trim().replace(/\s+/g, " ");
  const content = parsed.data.content.trim();
  if (!sessionId || sessionId.length > 100 || !nickname || !content) {
    res.status(400).json({ error: "Session, nickname, and post content are required" });
    return;
  }

  const [post] = await db
    .insert(communityPostsTable)
    .values({
      sessionId,
      nickname,
      category: parsed.data.category,
      content,
    })
    .returning();

  const response = {
    id: post.id,
    nickname: post.nickname,
    category: post.category,
    content: post.content,
    createdAt: post.createdAt.toISOString(),
    isMine: true,
    comments: [],
  };
  res.status(201).json(CreateCommunityPostResponse.parse(response));
});

router.post("/community/posts/:id/comments", async (req, res): Promise<void> => {
  const params = AddCommunityCommentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AddCommunityCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const sessionId = parsed.data.sessionId.trim();
  const nickname = parsed.data.nickname.trim().replace(/\s+/g, " ");
  const content = parsed.data.content.trim();
  if (!sessionId || sessionId.length > 100 || !nickname || !content) {
    res.status(400).json({ error: "Session, nickname, and comment are required" });
    return;
  }

  const [post] = await db
    .select({ id: communityPostsTable.id })
    .from(communityPostsTable)
    .where(eq(communityPostsTable.id, params.data.id))
    .limit(1);

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const [comment] = await db
    .insert(communityCommentsTable)
    .values({
      postId: post.id,
      sessionId,
      nickname,
      content,
    })
    .returning();

  const response = {
    id: comment.id,
    postId: comment.postId,
    nickname: comment.nickname,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    isMine: true,
  };
  res.status(201).json(AddCommunityCommentResponse.parse(response));
});

export default router;
