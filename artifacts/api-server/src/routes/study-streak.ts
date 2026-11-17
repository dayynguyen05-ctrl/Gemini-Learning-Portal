import { getAuth } from "@clerk/express";
import { desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CheckInStudyDayResponse,
  GetStudyStreakResponse,
} from "@workspace/api-zod";
import { db, studyCheckinsTable } from "@workspace/db";

const router: IRouter = Router();
const vietnamDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getVietnamDate(): string {
  const parts = vietnamDateFormatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Could not determine today's date in Vietnam.");
  }

  return `${year}-${month}-${day}`;
}

function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00.000Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

async function loadStudyStreak(userId: string) {
  const rows = await db
    .select({ studyDate: studyCheckinsTable.studyDate })
    .from(studyCheckinsTable)
    .where(eq(studyCheckinsTable.userId, userId))
    .orderBy(desc(studyCheckinsTable.studyDate));

  const studyDates = rows.map((row) => row.studyDate);
  const recordedDates = new Set(studyDates);
  const today = getVietnamDate();
  const checkedInToday = recordedDates.has(today);
  let dateToCount = checkedInToday ? today : shiftDate(today, -1);
  let currentStreak = 0;

  while (recordedDates.has(dateToCount)) {
    currentStreak += 1;
    dateToCount = shiftDate(dateToCount, -1);
  }

  return {
    currentStreak,
    totalStudyDays: studyDates.length,
    checkedInToday,
    lastCheckInDate: studyDates[0] ?? null,
  };
}

router.get("/", async (req, res): Promise<void> => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Đăng nhập để lưu chuỗi học tập." });
    return;
  }

  const streak = await loadStudyStreak(userId);
  const validated = GetStudyStreakResponse.parse(streak);
  res.json({ ...validated, lastCheckInDate: streak.lastCheckInDate });
});

router.post("/", async (req, res): Promise<void> => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Đăng nhập để lưu chuỗi học tập." });
    return;
  }

  const today = getVietnamDate();
  await db
    .insert(studyCheckinsTable)
    .values({ userId, studyDate: today })
    .onConflictDoNothing();

  const streak = await loadStudyStreak(userId);
  const validated = CheckInStudyDayResponse.parse(streak);
  res.json({ ...validated, lastCheckInDate: streak.lastCheckInDate });
});

export default router;
