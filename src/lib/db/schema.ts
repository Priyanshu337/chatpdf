

import { pgTable, pgEnum, text, serial, integer, varchar, timestamp } from 'drizzle-orm/pg-core'

export const userSystemEnum = pgEnum("user-system-enum", ['system', 'user'])


export const chats = pgTable('chats', {
    id: serial('id').primaryKey(),
    pdfName: text('pdf_name').notNull(),
    pdfUrl: text('pdf_Url').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    userId: varchar('user_id', { length: 256 }).notNull(),
    fileKey: varchar('file_key').notNull(),
})

export const DrizzleChat = typeof chats.$inferSelect;

export const messages = pgTable('messages', {
    id: serial('id').primaryKey(),
    chatID: integer('chat_id').references(() => chats.id).notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    role: userSystemEnum('role').notNull(),
})

