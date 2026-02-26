import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.presentations.list.path, async (req, res) => {
    const items = await storage.getPresentations();
    res.json(items);
  });

  app.get(api.presentations.get.path, async (req, res) => {
    const item = await storage.getPresentation(Number(req.params.id));
    if (!item) {
      return res.status(404).json({ message: 'Presentation not found' });
    }
    res.json(item);
  });

  app.post(api.presentations.create.path, async (req, res) => {
    try {
      const input = api.presentations.create.input.parse(req.body);
      const item = await storage.createPresentation(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.presentations.update.path, async (req, res) => {
    try {
      const input = api.presentations.update.input.parse(req.body);
      const item = await storage.updatePresentation(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.presentations.delete.path, async (req, res) => {
    await storage.deletePresentation(Number(req.params.id));
    res.status(204).send();
  });

  app.post(api.slides.create.path, async (req, res) => {
    try {
      const presentationId = Number(req.params.presentationId);
      const input = api.slides.create.input.parse(req.body);
      const item = await storage.createSlide({ ...input, presentationId });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.slides.update.path, async (req, res) => {
    try {
      const input = api.slides.update.input.parse(req.body);
      const item = await storage.updateSlide(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.slides.delete.path, async (req, res) => {
    await storage.deleteSlide(Number(req.params.id));
    res.status(204).send();
  });

  app.post(api.elements.create.path, async (req, res) => {
    try {
      const slideId = Number(req.params.slideId);
      const input = api.elements.create.input.parse(req.body);
      const item = await storage.createElement({ ...input, slideId });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.elements.update.path, async (req, res) => {
    try {
      const input = api.elements.update.input.parse(req.body);
      const item = await storage.updateElement(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.elements.delete.path, async (req, res) => {
    await storage.deleteElement(Number(req.params.id));
    res.status(204).send();
  });

  // Seed DB optionally if no presentations
  const existing = await storage.getPresentations();
  if (existing.length === 0) {
    const p = await storage.createPresentation({ title: "My First Presentation" });
    const s1 = await storage.createSlide({ presentationId: p.id, orderIndex: 0, background: "#ffffff" });
    await storage.createElement({ slideId: s1.id, type: "text", content: "Welcome to AI Presentation Editor", style: { x: 100, y: 100, width: 400, height: 50, fontSize: 24, color: "#000" } });
  }

  return httpServer;
}
