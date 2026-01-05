import { pgTable, text, timestamp, uuid, decimal, date, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const appRoleEnum = pgEnum("app_role", ["admin", "moderator", "user"]);

export const userRoles = pgTable("user_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  role: appRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  rollNumber: text("roll_number"),
  department: text("department"),
  studentClass: text("student_class"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  isSeen: boolean("is_seen").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const bookBorrows = pgTable("book_borrows", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  bookId: text("book_id").notNull(),
  bookTitle: text("book_title").notNull(),
  borrowerName: text("borrower_name").notNull(),
  borrowerPhone: text("borrower_phone"),
  borrowerEmail: text("borrower_email"),
  borrowDate: timestamp("borrow_date", { withTimezone: true }).defaultNow().notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  returnDate: timestamp("return_date", { withTimezone: true }),
  status: text("status").default("borrowed").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const libraryCardApplications = pgTable("library_card_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  fatherName: text("father_name"),
  dob: date("dob"),
  class: text("class").notNull(),
  field: text("field"),
  rollNo: text("roll_no").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  addressStreet: text("address_street").notNull(),
  addressCity: text("address_city").notNull(),
  addressState: text("address_state").notNull(),
  addressZip: text("address_zip").notNull(),
  status: text("status").default("pending").notNull(),
  cardNumber: text("card_number").unique(),
  password: text("password"),
  studentId: text("student_id"),
  issueDate: date("issue_date"),
  validThrough: date("valid_through"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const donations = pgTable("donations", {
  id: uuid("id").defaultRandom().primaryKey(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: text("method").notNull(),
  name: text("name"),
  email: text("email"),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const students = pgTable("students", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  cardId: text("card_id").notNull().unique(),
  name: text("name").notNull(),
  class: text("class"),
  field: text("field"),
  rollNo: text("roll_no"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const nonStudents = pgTable("non_students", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const books = pgTable("books", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookName: text("book_name").notNull(),
  shortIntro: text("short_intro").notNull(),
  description: text("description").notNull(),
  bookImage: text("book_image"),
  totalCopies: decimal("total_copies", { precision: 10, scale: 0 }).default("1").notNull(),
  availableCopies: decimal("available_copies", { precision: 10, scale: 0 }).default("1").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});


export const insertBookSchema = z.object({
  bookName: z.string(),
  shortIntro: z.string(),
  description: z.string(),
  bookImage: z.string().optional().nullable(),
  totalCopies: z.any().optional(),
  availableCopies: z.any().optional(),
});
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const rareBooks = pgTable("rare_books", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").default("General").notNull(),
  pdfPath: text("pdf_path").notNull(),
  coverImage: text("cover_image").notNull(),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const insertProfileSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string(),
  phone: z.string().optional().nullable(),
  rollNumber: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  studentClass: z.string().optional().nullable(),
});

export const insertContactMessageSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  subject: z.string(),
  message: z.string(),
});

export const insertBookBorrowSchema = z.object({
  userId: z.string().uuid(),
  bookId: z.string(),
  bookTitle: z.string(),
  borrowerName: z.string(),
  borrowerPhone: z.string().optional().nullable(),
  borrowerEmail: z.string().optional().nullable(),
  dueDate: z.any(), // date string or Date object
});

export const insertLibraryCardApplicationSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  fatherName: z.string().optional().nullable(),
  dob: z.string().optional().nullable(), // date string
  class: z.string(),
  field: z.string().optional().nullable(),
  rollNo: z.string(),
  email: z.string().email(),
  phone: z.string(),
  addressStreet: z.string(),
  addressCity: z.string(),
  addressState: z.string(),
  addressZip: z.string(),
  password: z.string().optional().nullable(),
});

export const insertDonationSchema = z.object({
  amount: z.any(),
  method: z.string(),
  name: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
});

export const insertStudentSchema = z.object({
  userId: z.string().uuid(),
  cardId: z.string(),
  name: z.string(),
  class: z.string().optional().nullable(),
  field: z.string().optional().nullable(),
  rollNo: z.string().optional().nullable(),
});

export const insertNonStudentSchema = z.object({
  userId: z.string().uuid(),
  name: z.string(),
  role: z.string(),
  phone: z.string().optional().nullable(),
});

export const insertUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "moderator", "user"]).default("user"),
});

export const insertBookDetailSchema = insertBookSchema;

export const insertRareBookSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string().optional().default("General"),
  pdfPath: z.string(),
  coverImage: z.string(),
  status: z.string().optional().default("active"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type InsertBookBorrow = z.infer<typeof insertBookBorrowSchema>;
export type InsertLibraryCardApplication = z.infer<typeof insertLibraryCardApplicationSchema>;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertNonStudent = z.infer<typeof insertNonStudentSchema>;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type InsertBookDetail = z.infer<typeof insertBookDetailSchema>;
export type InsertRareBook = z.infer<typeof insertRareBookSchema>;
export type RareBook = typeof rareBooks.$inferSelect;

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type BookBorrow = typeof bookBorrows.$inferSelect;
export type LibraryCardApplication = typeof libraryCardApplications.$inferSelect;
export type Donation = typeof donations.$inferSelect;
export type Student = typeof students.$inferSelect;
export type NonStudent = typeof nonStudents.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type BookDetail = typeof books.$inferSelect;

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  images: text("images").array(),
  date: date("date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertEventSchema = z.object({
  title: z.string(),
  description: z.string(),
  images: z.array(z.string()).optional().nullable(),
  date: z.string().optional().nullable(),
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title"),
  message: text("message"),
  image: text("image"),
  type: text("type").notNull(), // 'text', 'image', 'both'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertNotificationSchema = z.object({
  title: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  type: z.string(),
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  class: text("class").notNull(),
  subject: text("subject").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  pdfPath: text("pdf_path").notNull(),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertNoteSchema = z.object({
  class: z.string(),
  subject: z.string(),
  title: z.string(),
  description: z.string(),
  pdfPath: z.string(),
  status: z.string().default("active"),
});

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;
