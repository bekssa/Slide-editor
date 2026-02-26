import { db } from "./db";
import {
  presentations,
  slides,
  elements,
  type Presentation,
  type InsertPresentation,
  type Slide,
  type InsertSlide,
  type Element,
  type InsertElement,
  type PresentationResponse
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getPresentations(): Promise<Presentation[]>;
  getPresentation(id: number): Promise<PresentationResponse | undefined>;
  createPresentation(p: InsertPresentation): Promise<Presentation>;
  updatePresentation(id: number, p: Partial<InsertPresentation>): Promise<Presentation>;
  deletePresentation(id: number): Promise<void>;

  createSlide(s: InsertSlide): Promise<Slide>;
  updateSlide(id: number, s: Partial<InsertSlide>): Promise<Slide>;
  deleteSlide(id: number): Promise<void>;

  createElement(e: InsertElement): Promise<Element>;
  updateElement(id: number, e: Partial<InsertElement>): Promise<Element>;
  deleteElement(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getPresentations(): Promise<Presentation[]> {
    return await db.select().from(presentations);
  }

  async getPresentation(id: number): Promise<PresentationResponse | undefined> {
    const [presentation] = await db.select().from(presentations).where(eq(presentations.id, id));
    if (!presentation) return undefined;
    
    const presentationSlides = await db.select().from(slides).where(eq(slides.presentationId, id));
    const slideIds = presentationSlides.map(s => s.id);
    
    let allElements: Element[] = [];
    if (slideIds.length > 0) {
      allElements = await db.query.elements.findMany({
        where: (elements, { inArray }) => inArray(elements.slideId, slideIds)
      });
    }

    const slidesWithElements = presentationSlides.map(s => ({
      ...s,
      elements: allElements.filter(e => e.slideId === s.id)
    }));

    return {
      ...presentation,
      slides: slidesWithElements
    };
  }

  async createPresentation(p: InsertPresentation): Promise<Presentation> {
    const [created] = await db.insert(presentations).values(p).returning();
    return created;
  }

  async updatePresentation(id: number, p: Partial<InsertPresentation>): Promise<Presentation> {
    const [updated] = await db.update(presentations).set(p).where(eq(presentations.id, id)).returning();
    return updated;
  }

  async deletePresentation(id: number): Promise<void> {
    await db.delete(presentations).where(eq(presentations.id, id));
  }

  async createSlide(s: InsertSlide): Promise<Slide> {
    const [created] = await db.insert(slides).values(s).returning();
    return created;
  }

  async updateSlide(id: number, s: Partial<InsertSlide>): Promise<Slide> {
    const [updated] = await db.update(slides).set(s).where(eq(slides.id, id)).returning();
    return updated;
  }

  async deleteSlide(id: number): Promise<void> {
    await db.delete(slides).where(eq(slides.id, id));
  }

  async createElement(e: InsertElement): Promise<Element> {
    const [created] = await db.insert(elements).values(e).returning();
    return created;
  }

  async updateElement(id: number, e: Partial<InsertElement>): Promise<Element> {
    const [updated] = await db.update(elements).set(e).where(eq(elements.id, id)).returning();
    return updated;
  }

  async deleteElement(id: number): Promise<void> {
    await db.delete(elements).where(eq(elements.id, id));
  }
}

export const storage = new DatabaseStorage();
