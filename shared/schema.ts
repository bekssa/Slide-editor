import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const presentations = pgTable("presentations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const slides = pgTable("slides", {
  id: serial("id").primaryKey(),
  presentationId: integer("presentation_id").references(() => presentations.id, { onDelete: 'cascade' }).notNull(),
  orderIndex: integer("order_index").notNull(),
  background: text("background").default('#ffffff'),
});

export const elements = pgTable("elements", {
  id: serial("id").primaryKey(),
  slideId: integer("slide_id").references(() => slides.id, { onDelete: 'cascade' }).notNull(),
  type: text("type").notNull(), // 'text', 'image', 'shape'
  content: text("content"), // text content or image url
  style: jsonb("style"), // {x, y, width, height, fontSize, color, rotation, opacity, zIndex, shadow}
});

export const presentationsRelations = relations(presentations, ({ many }) => ({
  slides: many(slides),
}));

export const slidesRelations = relations(slides, ({ one, many }) => ({
  presentation: one(presentations, {
    fields: [slides.presentationId],
    references: [presentations.id],
  }),
  elements: many(elements),
}));

export const elementsRelations = relations(elements, ({ one }) => ({
  slide: one(slides, {
    fields: [elements.slideId],
    references: [slides.id],
  }),
}));

export const insertPresentationSchema = createInsertSchema(presentations).omit({ id: true, createdAt: true });
export const insertSlideSchema = createInsertSchema(slides).omit({ id: true });
export const insertElementSchema = createInsertSchema(elements).omit({ id: true });

export type Presentation = typeof presentations.$inferSelect;
export type InsertPresentation = z.infer<typeof insertPresentationSchema>;

export type Slide = typeof slides.$inferSelect;
export type InsertSlide = z.infer<typeof insertSlideSchema>;

export type Element = typeof elements.$inferSelect;
export type InsertElement = z.infer<typeof insertElementSchema>;

export type PresentationResponse = Presentation & { 
  slides: (Slide & { elements: Element[] })[] 
};
