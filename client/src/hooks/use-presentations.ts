import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertPresentation, Presentation, PresentationResponse } from "@shared/schema";

export function usePresentations() {
  return useQuery({
    queryKey: [api.presentations.list.path],
    queryFn: async () => {
      const res = await fetch(api.presentations.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch presentations");
      return res.json() as Promise<Presentation[]>;
    },
  });
}

export function usePresentation(id: number | null) {
  return useQuery({
    queryKey: [api.presentations.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.presentations.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch presentation");
      return res.json() as Promise<PresentationResponse>;
    },
    enabled: id !== null,
  });
}

export function useCreatePresentation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertPresentation) => {
      const res = await fetch(api.presentations.create.path, {
        method: api.presentations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create presentation");
      return res.json() as Promise<Presentation>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.presentations.list.path] });
    },
  });
}

export function useUpdatePresentation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<InsertPresentation> & { id: number }) => {
      const url = buildUrl(api.presentations.update.path, { id });
      const res = await fetch(url, {
        method: api.presentations.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update presentation");
      return res.json() as Promise<Presentation>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.presentations.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.presentations.get.path, variables.id] });
    },
  });
}

export function useDeletePresentation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.presentations.delete.path, { id });
      const res = await fetch(url, {
        method: api.presentations.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete presentation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.presentations.list.path] });
    },
  });
}
