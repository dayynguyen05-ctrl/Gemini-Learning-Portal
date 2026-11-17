import { pgTable, date, text, uniqueIndex } from "drizzle-orm/pg-core";

export const studyCheckinsTable = pgTable(
  "study_checkins",
  {
    userId: text("user_id").notNull(),
    studyDate: date("study_date", { mode: "string" }).notNull(),
  },
  (table) => [
    uniqueIndex("study_checkins_user_date_unique").on(table.userId, table.studyDate),
  ],
);
