import { Router } from "express";
import { db } from "@workspace/db";
import { hotlinesTable } from "@workspace/db";

const router = Router();

router.get("/", async (_req, res) => {
  const hotlines = await db.select().from(hotlinesTable);
  const priority = ["112", "111", "115", "113", "114"];
  hotlines.sort((a, b) => {
    const indexA = priority.indexOf(a.phone);
    const indexB = priority.indexOf(b.phone);
    const rankA = indexA === -1 ? priority.length : indexA;
    const rankB = indexB === -1 ? priority.length : indexB;
    return rankA - rankB || a.id - b.id;
  });
  return res.json(hotlines);
});

export default router;
