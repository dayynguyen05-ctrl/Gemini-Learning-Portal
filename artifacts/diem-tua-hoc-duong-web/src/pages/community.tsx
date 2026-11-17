import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, MessageCircle, Send, ShieldCheck, Users, PenLine, RefreshCw } from "lucide-react";
import {
  getListCommunityPostsQueryKey,
  useAddCommunityComment,
  useCreateCommunityPost,
  useListCommunityPosts,
} from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";

const NICKNAME_KEY = "dthd_community_nickname";
const POST_LIMIT = 1000;
const COMMENT_LIMIT = 500;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function initials(name: string) {
  return name.trim().slice(0, 1).toLocaleUpperCase("vi-VN") || "B";
}

export default function Community() {
  const sessionId = getSessionId();
  const queryClient = useQueryClient();
  const queryKey = getListCommunityPostsQueryKey({ sessionId });
  const postsQuery = useListCommunityPosts(
    { sessionId },
    { query: { queryKey, refetchInterval: 30_000 } },
  );
  const createPost = useCreateCommunityPost();
  const addComment = useAddCommunityComment();

  const [nickname, setNickname] = useState(() => {
    try {
      return localStorage.getItem(NICKNAME_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [category, setCategory] = useState<"lesson" | "chat">("lesson");
  const [postContent, setPostContent] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [nicknameNotice, setNicknameNotice] = useState("");

  const saveNickname = (value: string) => {
    const clipped = value.slice(0, 24);
    setNickname(clipped);
    try {
      localStorage.setItem(NICKNAME_KEY, clipped);
    } catch {
      setNicknameNotice("Không thể lưu tên trên thiết bị này.");
    }
  };

  const handleCreatePost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = postContent.trim();
    const name = nickname.trim();
    if (!name) {
      setNicknameNotice("Hãy chọn một biệt danh trước khi chia sẻ nhé.");
      return;
    }
    if (!content) return;
    setNicknameNotice("");
    createPost.mutate(
      { data: { sessionId, nickname: name, category, content } },
      {
        onSuccess: () => {
          setPostContent("");
          void queryClient.invalidateQueries({ queryKey });
        },
      },
    );
  };

  const handleComment = (event: FormEvent<HTMLFormElement>, postId: number) => {
    event.preventDefault();
    const content = (commentDrafts[postId] ?? "").trim();
    const name = nickname.trim();
    if (!name) {
      setNicknameNotice("Hãy chọn một biệt danh trước khi trò chuyện nhé.");
      return;
    }
    if (!content) return;
    setNicknameNotice("");
    addComment.mutate(
      { id: postId, data: { sessionId, nickname: name, content } },
      {
        onSuccess: () => {
          setCommentDrafts((current) => ({ ...current, [postId]: "" }));
          void queryClient.invalidateQueries({ queryKey });
        },
      },
    );
  };

  return (
    <div className="community-page min-h-[100dvh] flex-1">
      <div className="community-wrap mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <header className="community-intro mb-8">
          <div className="community-eyebrow"><span className="community-spark" /> GÓC CỦA CHÚNG MÌNH</div>
          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="community-title">Học cùng nhau,<br /><em>nhẹ lòng hơn.</em></h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                Một góc nhỏ để kể lại điều mình vừa hiểu, hỏi một điều còn vướng, hay đơn giản là chào nhau.
              </p>
            </div>
            <div className="community-count-note">
              <span className="community-count-mark"><Users className="h-4 w-4" /></span>
              <span>Chia sẻ nhỏ, <strong>tiếp sức lớn</strong></span>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <main className="min-w-0">
            <section className="community-composer" aria-labelledby="composer-title">
              <div className="composer-heading">
                <div className="composer-icon"><PenLine className="h-5 w-5" /></div>
                <div>
                  <h2 id="composer-title">Bạn muốn chia sẻ điều gì?</h2>
                  <p>Một ý nhỏ của bạn cũng có thể giúp ai đó.</p>
                </div>
              </div>

              <form onSubmit={handleCreatePost} data-testid="form-create-post">
                <div className="composer-name-row">
                  <label htmlFor="community-nickname">Mình sẽ hiện lên với tên</label>
                  <div className="nickname-control">
                    <input
                      id="community-nickname"
                      data-testid="input-community-nickname"
                      value={nickname}
                      onChange={(event) => saveNickname(event.target.value)}
                      maxLength={24}
                      placeholder="Ví dụ: Mây nhỏ"
                      autoComplete="nickname"
                    />
                    <span>{nickname.length}/24</span>
                  </div>
                </div>
                <div className="category-picker" role="radiogroup" aria-label="Chọn loại bài viết">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={category === "lesson"}
                    data-testid="button-category-lesson"
                    className={category === "lesson" ? "category-option selected" : "category-option"}
                    onClick={() => setCategory("lesson")}
                  >
                    <BookOpen className="h-4 w-4" /> Bài học nhỏ
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={category === "chat"}
                    data-testid="button-category-chat"
                    className={category === "chat" ? "category-option selected" : "category-option"}
                    onClick={() => setCategory("chat")}
                  >
                    <MessageCircle className="h-4 w-4" /> Trò chuyện
                  </button>
                </div>
                <label className="sr-only" htmlFor="community-post-content">Nội dung chia sẻ</label>
                <textarea
                  id="community-post-content"
                  data-testid="input-post-content"
                  className="composer-textarea"
                  placeholder={category === "lesson" ? "Hôm nay mình vừa hiểu ra..." : "Có ai cũng đang ôn phần này không?"}
                  value={postContent}
                  onChange={(event) => setPostContent(event.target.value.slice(0, POST_LIMIT))}
                  maxLength={POST_LIMIT}
                  rows={4}
                />
                <div className="composer-footer">
                  <span className="character-count" data-testid="text-post-character-count">{postContent.length}/{POST_LIMIT}</span>
                  <button
                    type="submit"
                    data-testid="button-submit-post"
                    className="community-submit"
                    disabled={createPost.isPending || !postContent.trim()}
                  >
                    {createPost.isPending ? "Đang gửi..." : "Chia sẻ"} <Send className="h-4 w-4" />
                  </button>
                </div>
                {createPost.isError && (
                  <p className="form-error" role="alert" data-testid="status-create-post-error">
                    Chưa gửi được bài viết. Bạn thử lại sau nhé.
                  </p>
                )}
                {nicknameNotice && <p className="form-error" role="alert" data-testid="status-nickname">{nicknameNotice}</p>}
              </form>
            </section>

            <div className="feed-heading">
              <div>
                <span className="feed-kicker">BẢNG TIN CỘNG ĐỒNG</span>
                <h2>Những điều được sẻ chia</h2>
              </div>
              {postsQuery.data && <span className="post-total" data-testid="text-post-count">{postsQuery.data.length} bài viết</span>}
            </div>

            {postsQuery.isLoading && (
              <div className="post-stack" aria-label="Đang tải bài viết" data-testid="status-posts-loading">
                {[0, 1, 2].map((item) => (
                  <div className="post-skeleton" key={item}>
                    <div className="skeleton-line skeleton-short" /><div className="skeleton-line" /><div className="skeleton-line skeleton-mid" />
                  </div>
                ))}
              </div>
            )}

            {postsQuery.isError && (
              <div className="feed-message error-panel" data-testid="status-posts-error">
                <div className="empty-mark"><RefreshCw className="h-5 w-5" /></div>
                <h3>Bảng tin đang nghỉ một chút</h3>
                <p>Không tải được bài viết lúc này. Bạn có thể thử lại ngay.</p>
                <button type="button" onClick={() => void postsQuery.refetch()} data-testid="button-retry-posts" className="retry-button">
                  Thử tải lại
                </button>
              </div>
            )}

            {!postsQuery.isLoading && !postsQuery.isError && postsQuery.data?.length === 0 && (
              <div className="feed-message" data-testid="status-posts-empty">
                <div className="empty-mark"><BookOpen className="h-5 w-5" /></div>
                <h3>Trang giấy đầu tiên vẫn đang chờ</h3>
                <p>Chia sẻ một điều bạn vừa học được để mở đầu bảng tin nhé.</p>
              </div>
            )}

            {!postsQuery.isLoading && !postsQuery.isError && !!postsQuery.data?.length && (
              <div className="post-stack" data-testid="list-community-posts">
                {postsQuery.data.map((post) => (
                  <article key={post.id} className={`community-post ${post.category}`} data-testid={`card-community-post-${post.id}`}>
                    <div className="post-topline">
                      <div className="post-author">
                        <div className={`author-avatar ${post.category}`} aria-hidden="true">{initials(post.nickname)}</div>
                        <div>
                          <div className="author-name" data-testid={`text-post-nickname-${post.id}`}>{post.nickname}</div>
                          <time className="post-time" dateTime={post.createdAt} data-testid={`text-post-time-${post.id}`}>{formatDate(post.createdAt)}</time>
                        </div>
                      </div>
                      <span className={`post-category ${post.category}`} data-testid={`badge-post-category-${post.id}`}>
                        {post.category === "lesson" ? <><BookOpen className="h-3.5 w-3.5" /> Bài học nhỏ</> : <><MessageCircle className="h-3.5 w-3.5" /> Trò chuyện</>}
                      </span>
                    </div>
                    <p className="post-content" data-testid={`text-post-content-${post.id}`}>{post.content}</p>

                    <div className="comments-area">
                      <div className="comments-title">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comments.length === 0 ? "Gửi lời động viên đầu tiên" : `${post.comments.length} lời hồi đáp`}</span>
                      </div>
                      {post.comments.length > 0 && (
                        <div className="comment-list" data-testid={`list-comments-${post.id}`}>
                          {post.comments.map((comment) => (
                            <div className="comment-row" key={comment.id} data-testid={`comment-${comment.id}`}>
                              <div className="comment-avatar">{initials(comment.nickname)}</div>
                              <div className="comment-body">
                                <div className="comment-meta"><strong data-testid={`text-comment-nickname-${comment.id}`}>{comment.nickname}</strong><time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time></div>
                                <p data-testid={`text-comment-content-${comment.id}`}>{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <form className="comment-form" onSubmit={(event) => handleComment(event, post.id)} data-testid={`form-comment-${post.id}`}>
                        <label className="sr-only" htmlFor={`comment-input-${post.id}`}>Viết lời hồi đáp</label>
                        <input
                          id={`comment-input-${post.id}`}
                          data-testid={`input-comment-${post.id}`}
                          placeholder="Viết lời hồi đáp..."
                          value={commentDrafts[post.id] ?? ""}
                          maxLength={COMMENT_LIMIT}
                          onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value.slice(0, COMMENT_LIMIT) }))}
                        />
                        <span className="comment-count">{(commentDrafts[post.id] ?? "").length}/500</span>
                        <button
                          type="submit"
                          aria-label="Gửi lời hồi đáp"
                          data-testid={`button-submit-comment-${post.id}`}
                          disabled={addComment.isPending || !(commentDrafts[post.id] ?? "").trim()}
                        >
                          {addComment.isPending ? <span className="sending-dot" /> : <Send className="h-4 w-4" />}
                        </button>
                      </form>
                      {addComment.isError && addComment.variables?.id === post.id && (
                        <p className="form-error" role="alert" data-testid={`status-comment-error-${post.id}`}>Chưa gửi được lời hồi đáp. Hãy thử lại nhé.</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </main>

          <aside className="community-aside">
            <section className="aside-card privacy-card" data-testid="panel-community-privacy">
              <div className="aside-icon"><ShieldCheck className="h-5 w-5" /></div>
              <h2>Không gian công khai</h2>
              <p>Bài viết và lời hồi đáp ở đây mọi người đều có thể đọc. Bạn có thể đăng nhập Google hoặc tiếp tục dùng biệt danh như trước.</p>
              <div className="privacy-divider" />
              <strong>Giữ riêng điều riêng tư</strong>
              <p>Đừng chia sẻ họ tên, trường lớp, số điện thoại, địa chỉ hay thông tin có thể nhận ra bạn.</p>
            </section>
            <section className="aside-card gentle-card">
              <span className="gentle-index">01 / CÙNG NHAU</span>
              <p>Chia sẻ điều có ích, lắng nghe nhẹ nhàng. Mỗi người đều đang học theo nhịp riêng.</p>
              <div className="gentle-line" />
              <span className="gentle-caption">Bạn không cần phải biết hết mới được bắt đầu.</span>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
