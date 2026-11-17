import { Router } from "express";
import conversationsRouter from "./conversations";
import messagesRouter from "./geminiMessages";

const router = Router();

router.use("/conversations", conversationsRouter);
router.use("/conversations/:id/messages", messagesRouter);

export default router;
