import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Plus, Type, Image as ImageIcon, Layout, Download, Loader2 } from "lucide-react";
import { usePresentation } from "@/hooks/use-presentations";
import { useCreateSlide, useDeleteSlide, useCreateElement } from "@/hooks/use-editor";
import { Button } from "@/components/ui/button";
import { SlideCanvas } from "@/components/editor/SlideCanvas";
import { useToast } from "@/hooks/use-toast";

export default function Editor() {
  const params = useParams();
  const presentationId = parseInt(params.id || "0", 10);
  const { data: presentation, isLoading, error } = usePresentation(presentationId);
  const { toast } = useToast();

  const [activeSlideId, setActiveSlideId] = useState<number | null>(null);

  const createSlideMutation = useCreateSlide();
  const deleteSlideMutation = useDeleteSlide();
  const createElementMutation = useCreateElement();

  // Set active slide to first slide on load if none selected
  useEffect(() => {
    if (presentation?.slides && presentation.slides.length > 0 && !activeSlideId) {
      setActiveSlideId(presentation.slides[0].id);
    } else if (presentation?.slides && presentation.slides.length === 0) {
      setActiveSlideId(null);
    }
  }, [presentation, activeSlideId]);

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error || !presentation) {
    return <div className="h-screen w-full flex flex-col items-center justify-center">
      <h2 className="text-xl font-bold mb-4">Presentation not found</h2>
      <Link href="/"><Button>Back to Dashboard</Button></Link>
    </div>;
  }

  const activeSlide = presentation.slides.find(s => s.id === activeSlideId);

  const handleAddSlide = async () => {
    const orderIndex = presentation.slides.length;
    try {
      const newSlide = await createSlideMutation.mutateAsync({ 
        presentationId, 
        orderIndex, 
        background: '#ffffff' 
      });
      setActiveSlideId(newSlide.id);
    } catch (e) {
      toast({ title: "Failed to add slide", variant: "destructive" });
    }
  };

  const handleDeleteSlide = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this slide?")) {
      await deleteSlideMutation.mutateAsync({ id, presentationId });
      if (activeSlideId === id) {
        setActiveSlideId(null); // Reset, effect will pick the new first one
      }
    }
  };

  const handleAddElement = async (type: 'text' | 'image') => {
    if (!activeSlideId) return;
    
    // Default styles for new elements
    const defaultStyle = type === 'text' 
      ? { x: 100, y: 100, width: 400, height: 100, fontSize: 32, color: '#000000' }
      : { x: 100, y: 100, width: 300, height: 200 };
      
    const defaultContent = type === 'text' ? 'Double click to edit text' : '';

    try {
      await createElementMutation.mutateAsync({
        slideId: activeSlideId,
        presentationId,
        type,
        content: defaultContent,
        style: defaultStyle
      });
    } catch (e) {
      toast({ title: `Failed to add ${type}`, variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header Toolbar */}
      <header className="h-14 border-b bg-card flex items-center px-4 justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="h-4 w-px bg-border mx-1" />
          <h1 className="font-display font-semibold text-lg truncate max-w-[200px] sm:max-w-md">
            {presentation.title}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Element creation tools - disabled if no slide selected */}
          <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border/50 mr-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-3 rounded-md hover:bg-white hover:shadow-sm interactive-transition text-muted-foreground hover:text-foreground"
              onClick={() => handleAddElement('text')}
              disabled={!activeSlideId}
            >
              <Type className="h-4 w-4 mr-2" /> Text
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-3 rounded-md hover:bg-white hover:shadow-sm interactive-transition text-muted-foreground hover:text-foreground"
              onClick={() => handleAddElement('image')}
              disabled={!activeSlideId}
            >
              <ImageIcon className="h-4 w-4 mr-2" /> Image
            </Button>
          </div>

          <Button size="sm" className="rounded-lg shadow-sm">
            <Layout className="h-4 w-4 mr-2" /> Present
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Slides */}
        <aside className="w-64 border-r bg-card/50 flex flex-col shrink-0">
          <div className="p-4 border-b flex justify-between items-center bg-card">
            <span className="font-medium text-sm text-muted-foreground">Slides</span>
            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={handleAddSlide} disabled={createSlideMutation.isPending}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {presentation.slides.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                No slides yet.<br/>Click + to add one.
              </div>
            )}
            {presentation.slides.sort((a,b) => a.orderIndex - b.orderIndex).map((slide, index) => (
              <div 
                key={slide.id}
                onClick={() => setActiveSlideId(slide.id)}
                className={`group relative aspect-video rounded-xl border-2 cursor-pointer overflow-hidden interactive-transition flex items-center justify-center shadow-sm
                  ${activeSlideId === slide.id ? 'border-primary ring-4 ring-primary/10' : 'border-border/50 hover:border-primary/50'}`}
                style={{ background: slide.background || '#fff' }}
              >
                {/* Miniature rough representation of elements could go here, for now just a number */}
                <span className={`font-bold text-2xl ${activeSlideId === slide.id ? 'text-primary/30' : 'text-muted-foreground/20'}`}>
                  {index + 1}
                </span>
                
                {/* Delete button overlay */}
                <button 
                  onClick={(e) => handleDeleteSlide(slide.id, e)}
                  className="absolute top-1 right-1 p-1.5 bg-black/40 hover:bg-destructive/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 relative overflow-hidden flex flex-col">
          <SlideCanvas slide={activeSlide} presentationId={presentationId} />
        </main>
      </div>
    </div>
  );
}
