import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { 
  ArrowLeft, Plus, Type, Image as ImageIcon, Layout, Download, Loader2, Trash2, 
  Shapes, Layers, Palette, BarChart3, UploadCloud, Settings2, ChevronUp, ChevronDown,
  Square
} from "lucide-react";
import { usePresentation } from "@/hooks/use-presentations";
import { useCreateSlide, useDeleteSlide, useCreateElement } from "@/hooks/use-editor";
import { Button } from "@/components/ui/button";
import { SlideCanvas } from "@/components/editor/SlideCanvas";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import screen1 from "@assets/screen_1772138405818.png";
import screen2 from "@assets/screen_1772138412337.png";

type Tool = 'elements' | 'text' | 'uploads' | 'shapes' | 'background' | 'charts';

export default function Editor() {
  const params = useParams();
  const presentationId = parseInt(params.id || "0", 10);
  const { data: presentation, isLoading, error } = usePresentation(presentationId);
  const { toast } = useToast();

  const [activeSlideId, setActiveSlideId] = useState<number | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('uploads');
  const [isSlideStripOpen, setIsSlideStripOpen] = useState(true);

  const createSlideMutation = useCreateSlide();
  const deleteSlideMutation = useDeleteSlide();
  const createElementMutation = useCreateElement();

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
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold mb-4">Presentation not found</h2>
        <Link href="/"><Button>Back to Dashboard</Button></Link>
      </div>
    );
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
        setActiveSlideId(null);
      }
    }
  };

  const handleAddElement = async (type: 'text' | 'image' | 'shape', content = '') => {
    if (!activeSlideId) return;
    
    const defaultStyle = type === 'text' 
      ? { x: 100, y: 100, width: 400, height: 100, fontSize: 32, color: '#000000', rotation: 0, opacity: 1, zIndex: 1 }
      : type === 'shape'
      ? { x: 100, y: 100, width: 100, height: 100, color: '#3b82f6', rotation: 0, opacity: 1, zIndex: 1 }
      : { x: 100, y: 100, width: 300, height: 200, rotation: 0, opacity: 1, zIndex: 1 };
      
    const defaultContent = type === 'text' ? (content || 'Double click to edit text') : content;

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

  const tools: { id: Tool; icon: any; label: string }[] = [
    { id: 'elements', icon: Layout, label: 'Elements' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'uploads', icon: UploadCloud, label: 'Uploads' },
    { id: 'shapes', icon: Square, label: 'Shapes' },
    { id: 'background', icon: Palette, label: 'Background' },
    { id: 'charts', icon: BarChart3, label: 'Charts' },
  ];

  const recentUploads = [screen1, screen2];

  return (
    <div className="flex flex-col h-screen bg-[#F9F9FB] dark:bg-background overflow-hidden text-[#1A1A1A] dark:text-foreground font-sans">
      {/* Top Navigation */}
      <header className="h-16 border-b bg-white dark:bg-card flex items-center px-6 justify-between shrink-0 z-30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2D1B69] rounded-lg flex items-center justify-center text-white font-bold">S</div>
            <span className="font-bold text-lg tracking-tight">Slides & Co.</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <h1 className="font-medium text-sm text-muted-foreground truncate max-w-[300px]">
            {presentation.title}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-xl border-[#E5E5E5] font-medium px-4 h-10">
            <Download className="h-4 w-4 mr-2" /> Download PPTX
          </Button>
          <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border border-border">
            <img src="https://github.com/shadcn.png" alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Vertical Tool Dock */}
        <aside className="w-20 border-r bg-white dark:bg-card flex flex-col items-center py-6 gap-6 shrink-0 z-20">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`flex flex-col items-center gap-1.5 transition-all duration-200 group ${activeTool === tool.id ? 'text-[#2D1B69]' : 'text-[#8E8E93] hover:text-[#2D1B69]'}`}
            >
              <div className={`p-2.5 rounded-xl transition-all duration-200 ${activeTool === tool.id ? 'bg-[#F2F0FF]' : 'group-hover:bg-[#F2F0FF]'}`}>
                <tool.icon className={`h-6 w-6 ${activeTool === tool.id ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">{tool.label}</span>
            </button>
          ))}
        </aside>

        {/* Dynamic Tool Panel */}
        <aside className="w-80 border-r bg-white dark:bg-card flex flex-col shrink-0 z-10">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6 capitalize">{activeTool}</h2>
            
            {activeTool === 'uploads' && (
              <div className="space-y-8">
                <div className="border-2 border-dashed border-[#E5E5E5] rounded-2xl p-8 flex flex-col items-center justify-center bg-[#F9F9FB] hover:bg-[#F2F0FF] hover:border-[#2D1B69] transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="h-6 w-6 text-[#2D1B69]" />
                  </div>
                  <span className="text-sm font-semibold mb-1">Drag & drop area</span>
                  <Button variant="link" className="text-[#2D1B69] font-bold h-auto p-0">Upload media</Button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#8E8E93] mb-4">Recent Uploads</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={handleAddSlide}
                      className="aspect-square rounded-xl border border-[#E5E5E5] flex items-center justify-center bg-white hover:border-[#2D1B69] transition-all"
                    >
                      <Plus className="h-6 w-6 text-[#8E8E93]" />
                    </button>
                    {recentUploads.map((img, i) => (
                      <div 
                        key={i} 
                        className="aspect-square rounded-xl overflow-hidden border border-[#E5E5E5] relative group cursor-pointer"
                        onClick={() => handleAddElement('image', img)}
                      >
                        <img src={img} alt="Upload" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Plus className="text-white h-6 w-6" />
                        </div>
                      </div>
                    ))}
                    {[...Array(4)].map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square rounded-xl bg-[#F2F2F7] animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTool === 'text' && (
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  variant="outline" 
                  className="h-16 rounded-xl border-[#E5E5E5] justify-start px-4 text-lg font-bold"
                  onClick={() => handleAddElement('text', 'Add a Heading')}
                >
                  Add a Heading
                </Button>
                <Button 
                  variant="outline" 
                  className="h-14 rounded-xl border-[#E5E5E5] justify-start px-4 font-semibold"
                  onClick={() => handleAddElement('text', 'Add a Subheading')}
                >
                  Add a Subheading
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12 rounded-xl border-[#E5E5E5] justify-start px-4 text-sm"
                  onClick={() => handleAddElement('text', 'Add body text')}
                >
                  Add body text
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 relative flex flex-col bg-[#F2F2F7] dark:bg-background/50 overflow-hidden">
          <div className="absolute top-6 left-6 z-10">
            <span className="text-xs font-bold text-[#8E8E93] uppercase tracking-widest">Slide Canvas</span>
          </div>
          
          <div className="flex-1 flex items-center justify-center p-12 overflow-auto">
            <SlideCanvas slide={activeSlide} presentationId={presentationId} />
          </div>

          {/* Bottom Slide Strip */}
          <div className={`transition-all duration-300 ease-in-out bg-white dark:bg-card border-t z-20 ${isSlideStripOpen ? 'h-48' : 'h-10'}`}>
            <div className="h-10 flex items-center justify-center border-b relative">
              <button 
                onClick={() => setIsSlideStripOpen(!isSlideStripOpen)}
                className="p-1 hover:bg-muted rounded-md absolute -top-4 bg-white border shadow-sm"
              >
                {isSlideStripOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
            </div>
            
            {isSlideStripOpen && (
              <ScrollArea className="w-full h-38">
                <div className="flex p-6 gap-4 min-w-max">
                  {presentation.slides.sort((a,b) => a.orderIndex - b.orderIndex).map((slide, index) => (
                    <div 
                      key={slide.id}
                      onClick={() => setActiveSlideId(slide.id)}
                      className={`group relative w-48 aspect-video rounded-xl border-2 cursor-pointer overflow-hidden transition-all duration-200 shrink-0 shadow-sm
                        ${activeSlideId === slide.id ? 'border-[#2D1B69] ring-4 ring-[#2D1B69]/10' : 'border-[#E5E5E5] hover:border-[#2D1B69]/50'}`}
                      style={{ background: slide.background || '#fff' }}
                    >
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-md bg-white/80 backdrop-blur-sm border flex items-center justify-center text-[10px] font-bold shadow-sm">
                        {index + 1}
                      </div>
                      
                      <button 
                        onClick={(e) => handleDeleteSlide(slide.id, e)}
                        className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-destructive/10 text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm border shadow-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  
                  <button 
                    onClick={handleAddSlide}
                    className="w-48 aspect-video rounded-xl border-2 border-dashed border-[#E5E5E5] flex flex-col items-center justify-center text-[#8E8E93] hover:border-[#2D1B69] hover:text-[#2D1B69] hover:bg-[#F2F0FF] transition-all shrink-0"
                  >
                    <Plus className="h-8 w-8 mb-1" />
                    <span className="text-xs font-bold">New Slide</span>
                  </button>
                </div>
              </ScrollArea>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
