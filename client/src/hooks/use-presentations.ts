import { usePresentationContext } from '../context/PresentationContext';

export function usePresentations() {
  const { presentation } = usePresentationContext();
  return { data: [presentation], isLoading: false, error: null };
}

export function usePresentation(id: number | null) {
  const { presentation } = usePresentationContext();
  return { data: presentation, isLoading: false, error: null };
}
