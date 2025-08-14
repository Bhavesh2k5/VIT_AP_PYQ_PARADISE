import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const questionPapers = pgTable("question_papers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(),
  extractedText: text("extracted_text"),
  solutions: text("solutions"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertQuestionPaperSchema = createInsertSchema(questionPapers).pick({
  filename: true,
  fileType: true,
  extractedText: true,
});

export const processQuestionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  filename: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type QuestionPaper = typeof questionPapers.$inferSelect;
export type InsertQuestionPaper = z.infer<typeof insertQuestionPaperSchema>;
export type ProcessQuestionRequest = z.infer<typeof processQuestionSchema>;
