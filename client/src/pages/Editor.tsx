import { useState, useEffect, useRef } from "react";
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

interface EditorProps {
  overrideId?: number;
}

export default function Editor({ overrideId }: EditorProps) {
  const params = useParams();
  const presentationId = overrideId || parseInt(params.id || "0", 10);
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
    return <div className="h-screen w-full flex items-center justify-center bg-[#121212]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error || !presentation) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#121212] text-white">
        <h2 className="text-xl font-bold mb-4">Editor initialization failed</h2>
        <p className="text-muted-foreground mb-4">Please ensure the database is seeded.</p>
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
        background: '#1e1e1e' 
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
      ? { x: 100, y: 100, width: 400, height: 100, fontSize: 32, color: '#ffffff', rotation: 0, opacity: 1, zIndex: 1 }
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
    <div className="flex flex-col h-screen bg-[#0F0F0F] overflow-hidden text-[#E0E0E0] font-sans dark">
      {/* Top Navigation */}
      <header className="h-16 border-b border-[#2A2A2A] bg-[#121212] flex items-center px-6 justify-between shrink-0 z-30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight text-white">Slides</span>
          </div>
          <Separator orientation="vertical" className="h-6 bg-[#2A2A2A]" />
          <h1 className="font-medium text-sm text-[#8E8E93] truncate max-w-[300px]">
            {presentation.title}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-xl border-[#2A2A2A] bg-transparent hover:bg-[#1E1E1E] text-white font-medium px-4 h-10">
            <Download className="h-4 w-4 mr-2" /> Download PPTX
          </Button>
          <div className="w-10 h-10 rounded-full bg-[#1E1E1E] overflow-hidden border border-[#2A2A2A]">
            <img src="https://github.com/shadcn.png" alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Vertical Tool Dock */}
        <aside className="w-20 border-r border-[#2A2A2A] bg-[#121212] flex flex-col items-center py-6 gap-6 shrink-0 z-20">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`flex flex-col items-center gap-1.5 transition-all duration-200 group ${activeTool === tool.id ? 'text-white' : 'text-[#8E8E93] hover:text-white'}`}
            >
              <div className={`p-2.5 rounded-xl transition-all duration-200 ${activeTool === tool.id ? 'bg-[#1E1E1E]' : 'group-hover:bg-[#1E1E1E]'}`}>
                <tool.icon className={`h-6 w-6 ${activeTool === tool.id ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">{tool.label}</span>
            </button>
          ))}
        </aside>

        {/* Dynamic Tool Panel */}
        <aside className="w-80 border-r border-[#2A2A2A] bg-[#121212] flex flex-col shrink-0 z-10">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6 capitalize text-white">{activeTool}</h2>
            
            {activeTool === 'uploads' && (
              <div className="space-y-8">
                <div className="border-2 border-dashed border-[#2A2A2A] rounded-2xl p-8 flex flex-col items-center justify-center bg-[#181818] hover:bg-[#1E1E1E] hover:border-[#3A3A3A] transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-[#121212] shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-semibold mb-1 text-white">Drag & drop area</span>
                  <Button variant="link" className="text-muted-foreground hover:text-white font-bold h-auto p-0">Upload media</Button>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-4">Recent Uploads</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={handleAddSlide}
                      className="aspect-square rounded-xl border border-[#2A2A2A] flex items-center justify-center bg-[#181818] hover:border-[#3A3A3A] transition-all"
                    >
                      <Plus className="h-6 w-6 text-[#8E8E93]" />
                    </button>
                    {recentUploads.map((img, i) => (
                      <div 
                        key={i} 
                        className="aspect-square rounded-xl overflow-hidden border border-[#2A2A2A] relative group cursor-pointer"
                        onClick={() => handleAddElement('image', img)}
                      >
                        <img src={img} alt="Upload" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Plus className="text-white h-6 w-6" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTool === 'text' && (
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  variant="outline" 
                  className="h-16 rounded-xl border-[#2A2A2A] bg-[#181818] hover:bg-[#1E1E1E] justify-start px-4 text-lg font-bold text-white"
                  onClick={() => handleAddElement('text', 'Add a Heading')}
                >
                  Add a Heading
                </Button>
                <Button 
                  variant="outline" 
                  className="h-14 rounded-xl border-[#2A2A2A] bg-[#181818] hover:bg-[#1E1E1E] justify-start px-4 font-semibold text-white"
                  onClick={() => handleAddElement('text', 'Add a Subheading')}
                >
                  Add a Subheading
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12 rounded-xl border-[#2A2A2A] bg-[#181818] hover:bg-[#1E1E1E] justify-start px-4 text-sm text-white"
                  onClick={() => handleAddElement('text', 'Add body text')}
                >
                  Add body text
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 relative flex flex-col bg-[#0A0A0A] overflow-hidden">
          <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
             <SlideCanvas slide={activeSlide} presentationId={presentationId} />
          </div>

          {/* Bottom Slide Strip */}
          <div className={`transition-all duration-300 ease-in-out bg-[#121212] border-t border-[#2A2A2A] z-20 ${isSlideStripOpen ? 'h-48' : 'h-10'}`}>
            <div className="h-10 flex items-center justify-center border-b border-[#2A2A2A] relative">
              <button 
                onClick={() => setIsSlideStripOpen(!isSlideStripOpen)}
                className="p-1 hover:bg-[#1E1E1E] rounded-md absolute -top-4 bg-[#121212] border border-[#2A2A2A] shadow-sm text-white"
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
                        ${activeSlideId === slide.id ? 'border-white ring-4 ring-white/10' : 'border-[#2A2A2A] hover:border-[#3A3A3A]'}`}
                      style={{ background: slide.background || '#1e1e1e' }}
                    >
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-md bg-[#121212]/80 backdrop-blur-sm border border-[#2A2A2A] flex items-center justify-center text-[10px] font-bold shadow-sm text-white">
                        {index + 1}
                      </div>
                      
                      <button 
                        onClick={(e) => handleDeleteSlide(slide.id, e)}
                        className="absolute top-2 right-2 p-1.5 bg-[#121212]/80 hover:bg-destructive/20 text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm border border-[#2A2A2A] shadow-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  
                  <button 
                    onClick={handleAddSlide}
                    className="w-48 aspect-video rounded-xl border-2 border-dashed border-[#2A2A2A] flex flex-col items-center justify-center text-[#8E8E93] hover:border-[#3A3A3A] hover:text-white hover:bg-[#181818] transition-all shrink-0"
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
