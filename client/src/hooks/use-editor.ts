import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertSlide, InsertElement, Slide, Element } from "@shared/schema";

// Slides
export function useCreateSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ presentationId, ...data }: Omit<InsertSlide, 'presentationId'> & { presentationId: number }) => {
      const url = buildUrl(api.slides.create.path, { presentationId });
      const res = await fetch(url, {
        method: api.slides.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create slide");
      return res.json() as Promise<Slide>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.presentations.get.path, variables.presentationId] });
    },
  });
}

export function useUpdateSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, presentationId, ...data }: Partial<InsertSlide> & { id: number, presentationId: number }) => {
      const url = buildUrl(api.slides.update.path, { id });
      const res = await fetch(url, {
        method: api.slides.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update slide");
      return res.json() as Promise<Slide>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.presentations.get.path, variables.presentationId] });
    },
  });
}

export function useDeleteSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, presentationId }: { id: number, presentationId: number }) => {
      const url = buildUrl(api.slides.delete.path, { id });
      const res = await fetch(url, {
        method: api.slides.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete slide");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.presentations.get.path, variables.presentationId] });
    },
  });
}

// Elements
export function useCreateElement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ slideId, presentationId, ...data }: Omit<InsertElement, 'slideId'> & { slideId: number, presentationId: number }) => {
      const url = buildUrl(api.elements.create.path, { slideId });
      const res = await fetch(url, {
        method: api.elements.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create element");
      return res.json() as Promise<Element>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.presentations.get.path, variables.presentationId] });
    },
  });
}

export function useUpdateElement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, presentationId, ...data }: Partial<InsertElement> & { id: number, presentationId: number }) => {
      const url = buildUrl(api.elements.update.path, { id });
      const res = await fetch(url, {
        method: api.elements.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update element");
      return res.json() as Promise<Element>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.presentations.get.path, variables.presentationId] });
    },
  });
}

export function useDeleteElement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, presentationId }: { id: number, presentationId: number }) => {
      const url = buildUrl(api.elements.delete.path, { id });
      const res = await fetch(url, {
        method: api.elements.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete element");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.presentations.get.path, variables.presentationId] });
    },
  });
}
