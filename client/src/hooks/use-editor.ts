import { usePresentationContext } from '../context/PresentationContext';
import { ElementStyle } from '../types';

export function useCreateSlide() {
  const { addSlide } = usePresentationContext();
  return { mutateAsync: async (params: { background: string }) => addSlide(params.background) };
}

export function useUpdateSlide() {
  const { updateSlide } = usePresentationContext();
  return { mutateAsync: async (params: { id: number, background: string }) => updateSlide(params.id, params.background) };
}

export function useDeleteSlide() {
  const { deleteSlide } = usePresentationContext();
  return { mutateAsync: async (params: { id: number }) => deleteSlide(params.id) };
}

export function useCreateElement() {
  const { addElement } = usePresentationContext();
  return {
    mutateAsync: async (params: { slideId: number, type: 'text' | 'image' | 'shape', content?: string, style: ElementStyle }) => {
      addElement(params.slideId, params.type, params.content, params.style);
    }
  };
}

export function useUpdateElement() {
  const { updateElement } = usePresentationContext();
  return {
    mutate: (params: { id: number, content?: string, style?: ElementStyle }) => {
      updateElement(params.id, params.content, params.style);
    }
  };
}

export function useDeleteElement() {
  const { deleteElement } = usePresentationContext();
  return { mutate: (params: { id: number }) => deleteElement(params.id) };
}
