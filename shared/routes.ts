import { z } from 'zod';
import { insertPresentationSchema, insertSlideSchema, insertElementSchema, presentations, slides, elements } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  presentations: {
    list: {
      method: 'GET' as const,
      path: '/api/presentations' as const,
      responses: {
        200: z.array(z.custom<typeof presentations.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/presentations/:id' as const,
      responses: {
        200: z.custom<any>(), // PresentationResponse
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/presentations' as const,
      input: insertPresentationSchema,
      responses: {
        201: z.custom<typeof presentations.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/presentations/:id' as const,
      input: insertPresentationSchema.partial(),
      responses: {
        200: z.custom<typeof presentations.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/presentations/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  },
  slides: {
    create: {
      method: 'POST' as const,
      path: '/api/presentations/:presentationId/slides' as const,
      input: insertSlideSchema.omit({ presentationId: true }),
      responses: {
        201: z.custom<typeof slides.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/slides/:id' as const,
      input: insertSlideSchema.partial(),
      responses: {
        200: z.custom<typeof slides.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/slides/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  },
  elements: {
    create: {
      method: 'POST' as const,
      path: '/api/slides/:slideId/elements' as const,
      input: insertElementSchema.omit({ slideId: true }),
      responses: {
        201: z.custom<typeof elements.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/elements/:id' as const,
      input: insertElementSchema.partial(),
      responses: {
        200: z.custom<typeof elements.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/elements/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
