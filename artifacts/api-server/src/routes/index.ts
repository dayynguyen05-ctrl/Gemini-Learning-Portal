// Tổng hợp và đăng ký tất cả các route cho API server
import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import resourcesRouter from "./resources";
import moodRouter from "./mood";
import hotlinesRouter from "./hotlines";
import faqRouter from "./faq";
import statsRouter from "./stats";
import geminiRouter from "./anthropic/index";
import communityRouter from "./community";
import studyStreakRouter from "./study-streak";

const router: IRouter = Router();

// Route kiểm tra sức khỏe server
router.use(healthRouter);

// Route chat Gemini — lưu lịch sử nhiều cuộc trò chuyện theo phiên
router.use("/gemini", geminiRouter);

// Route chat dựa trên luật (không dùng AI)
router.use("/chat", chatRouter);

// Route tài nguyên/bài viết hỗ trợ
router.use("/resources", resourcesRouter);

// Route theo dõi cảm xúc
router.use("/mood", moodRouter);

// Route đường dây nóng hỗ trợ
router.use("/hotlines", hotlinesRouter);

// Route câu hỏi thường gặp
router.use("/faq", faqRouter);

// Route thống kê tổng quan
router.use("/stats", statsRouter);

// Route bảng tin cộng đồng: bài chia sẻ và bình luận
router.use(communityRouter);
router.use("/study-streak", studyStreakRouter);

export default router;
