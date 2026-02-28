import { useState, useEffect, useRef } from "react";

import {
  Plus, Type, Image as ImageIcon, Layout, Download, Loader2, Trash2,
  Shapes, Layers, Palette, BarChart3, UploadCloud, Settings2, ChevronUp, ChevronDown,
  Square, X, MousePointer2
} from "lucide-react";
import { usePresentation } from "@/hooks/use-presentations";
import { useCreateSlide, useDeleteSlide, useCreateElement, useUpdateSlide } from "@/hooks/use-editor";
import { Button } from "@/components/ui/button";
import { SlideCanvas } from "@/components/editor/SlideCanvas";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";



type Tool = 'elements' | 'text' | 'uploads' | 'shapes' | 'background' | 'charts';

export default function Editor() {
  const { data: presentation, isLoading, error } = usePresentation(1);
  const { toast } = useToast();

  const [activeSlideId, setActiveSlideId] = useState<number | null>(null);
  const [activeTool, setActiveTool] = useState<Tool | null>('uploads');
  const [recentUploads, setRecentUploads] = useState<string[]>([]);

  const createSlideMutation = useCreateSlide();
  const deleteSlideMutation = useDeleteSlide();
  const updateSlideMutation = useUpdateSlide();
  const createElementMutation = useCreateElement();

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        <p className="text-muted-foreground mb-4">Presentation could not be loaded.</p>
      </div>
    );
  }

  const activeSlide = presentation.slides.find(s => s.id === activeSlideId);

  const handleAddSlide = async () => {
    try {
      await createSlideMutation.mutateAsync({ background: '#1e1e1e' });
    } catch (e) {
      toast({ title: "Failed to add slide", variant: "destructive" });
    }
  };

  const handleDeleteSlide = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this slide?")) {
      await deleteSlideMutation.mutateAsync({ id });
      if (activeSlideId === id) {
        setActiveSlideId(null);
      }
    }
  };

  const handleUpdateSlideBackground = async (color: string) => {
    if (!activeSlideId) return;
    try {
      await updateSlideMutation.mutateAsync({
        id: activeSlideId,
        background: color
      });
    } catch (e) {
      toast({ title: "Failed to update background", variant: "destructive" });
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
        type,
        content: defaultContent,
        style: defaultStyle
      });
    } catch (e) {
      toast({ title: `Failed to add ${type}`, variant: "destructive" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setRecentUploads((prev) => [base64, ...prev]);
        handleAddElement('image', base64);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const tools: { id: Tool; icon: any; label: string }[] = [
    { id: 'elements', icon: Layout, label: 'Elements' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'uploads', icon: UploadCloud, label: 'Uploads' },
    { id: 'shapes', icon: Square, label: 'Shapes' },
    { id: 'background', icon: Palette, label: 'Background' },
    { id: 'charts', icon: BarChart3, label: 'Charts' },
  ];

  const backgroundColors = [
    '#1e1e1e', '#ffffff', '#f44336', '#e91e63', '#9c27b0',
    '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4'
  ];



  return (
    <div className="flex flex-col h-[100dvh] bg-[#0F0F0F] overflow-hidden text-[#E0E0E0] font-sans dark">
      <header className="h-14 md:h-16 border-b border-[#2A2A2A] bg-[#121212] flex items-center px-3 md:px-6 justify-between shrink-0 z-30">
        <div className="flex items-center gap-3 md:gap-6 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-bold text-lg md:text-xl tracking-tight text-white">Slides</span>
          </div>
          <Separator orientation="vertical" className="h-6 bg-[#2A2A2A] hidden md:block" />
          <h1 className="font-medium text-sm text-[#8E8E93] truncate max-w-[150px] md:max-w-[300px]">
            {presentation.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <Button variant="outline" size="sm" className="hidden sm:flex rounded-xl border-[#2A2A2A] bg-transparent hover:bg-[#1E1E1E] text-white font-medium px-4 h-9 md:h-10">
            <Download className="h-4 w-4 mr-2" /> Download
          </Button>
          <Button variant="outline" size="icon" className="sm:hidden rounded-lg border-[#2A2A2A] bg-transparent hover:bg-[#1E1E1E] text-white h-9 w-9">
            <Download className="h-4 w-4" />
          </Button>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#1E1E1E] overflow-hidden border border-[#2A2A2A] shrink-0">
            <img src="https://github.com/shadcn.png" alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        {/* Tools Bar - Left on Desktop, Bottom on Mobile */}
        <aside className="w-full md:w-20 h-16 md:h-full border-t md:border-t-0 md:border-r border-[#2A2A2A] bg-[#121212] flex flex-row md:flex-col shrink-0 z-50 order-last md:order-first overflow-x-auto overflow-y-hidden md:overflow-y-auto pb-safe [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex flex-row md:flex-col items-center py-2 px-4 md:px-0 md:py-6 gap-2 md:gap-6 w-max mx-auto md:w-full md:mx-0 h-full md:h-auto">
            <button
              onClick={() => setActiveTool(null)}
              className={`flex flex-col items-center gap-1 md:gap-1.5 transition-all duration-200 group flex-1 md:flex-none ${activeTool === null ? 'text-white' : 'text-[#8E8E93] hover:text-white'}`}
            >
              <div className={`p-2  md:p-2.5 rounded-xl transition-all duration-200 ${activeTool === null ? 'bg-[#1E1E1E]' : 'group-hover:bg-[#1E1E1E]'}`}>
                <MousePointer2 className={`h-5 w-5 md:h-6 md:w-6 ${activeTool === null ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              </div>
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider">Select</span>
            </button>
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`flex flex-col items-center gap-1 md:gap-1.5 transition-all duration-200 group flex-1 md:flex-none ${activeTool === tool.id ? 'text-white' : 'text-[#8E8E93] hover:text-white'}`}
              >
                <div className={`p-2 md:p-2.5 rounded-xl transition-all duration-200 ${activeTool === tool.id ? 'bg-[#1E1E1E]' : 'group-hover:bg-[#1E1E1E]'}`}>
                  <tool.icon className={`h-5 w-5 md:h-6 md:w-6 ${activeTool === tool.id ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                </div>
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider">{tool.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Properties Panel - Right on Desktop, Bottom Sheet on Mobile */}
        {activeTool && (
          <aside className="absolute md:relative bottom-16 md:bottom-auto w-full md:w-80 h-[50dvh] md:h-full border-t md:border-t-0 md:border-r border-[#2A2A2A] bg-[#121212] flex flex-col shrink-0 z-40 md:z-10 shadow-2xl md:shadow-none animate-in slide-in-from-bottom-full md:slide-in-from-left-0 duration-300 rounded-t-2xl md:rounded-none">
            <div className="w-12 h-1.5 bg-[#2A2A2A] rounded-full mx-auto mt-3 md:hidden" onClick={() => setActiveTool(null)} />
            <button
              onClick={() => setActiveTool(null)}
              className="absolute top-4 right-4 p-1.5 bg-[#181818] md:bg-transparent md:hover:bg-[#1E1E1E] rounded-md transition-colors text-[#8E8E93] hover:text-white"
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
            </button>
            <div className="p-4 md:p-6 overflow-y-auto flex-1">
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 capitalize text-white">{activeTool}</h2>

              {activeTool === 'uploads' && (
                <div className="space-y-6 md:space-y-8">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#2A2A2A] rounded-2xl p-8 flex flex-col items-center justify-center bg-[#181818] hover:bg-[#1E1E1E] hover:border-[#3A3A3A] transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#121212] shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold mb-1 text-white">Drag & drop area</span>
                    <Button
                      variant="link"
                      className="text-muted-foreground hover:text-white font-bold h-auto p-0"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    >
                      Upload media
                    </Button>
                  </div>

                  {recentUploads.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-4">Recent Uploads</h3>
                      <div className="grid grid-cols-2 gap-3">
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
                  )}
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

              {activeTool === 'background' && (
                <div className="grid grid-cols-5 gap-3">
                  {backgroundColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleUpdateSlideBackground(color)}
                      className={`aspect-square rounded-full border-2 transition-all ${activeSlide?.background === color ? 'border-white scale-110' : 'border-[#2A2A2A] hover:border-[#3A3A3A]'}`}
                      style={{ background: color }}
                    />
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Main Canvas Area */}
        <main className="flex-1 relative flex flex-col bg-[#0A0A0A] overflow-hidden">
          <div className="flex-1 flex items-center justify-center p-2 md:p-4 relative overflow-hidden">
            <SlideCanvas slide={activeSlide} />
          </div>

          {/* Bottom Slide Strip */}
          <div className="bg-[#121212] border-t border-[#2A2A2A] z-20 shrink-0 h-24 md:h-52 flex overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex px-3 md:px-6 gap-3 md:gap-4 min-w-max pr-12 md:pr-24 items-center h-full mx-auto md:mx-0">
              {presentation.slides.sort((a, b) => a.orderIndex - b.orderIndex).map((slide, index) => (
                <div
                  key={slide.id}
                  onClick={() => setActiveSlideId(slide.id)}
                  className={`group relative w-32 md:w-48 aspect-video rounded-xl border-2 cursor-pointer overflow-hidden transition-all duration-200 shrink-0 shadow-sm
                        ${activeSlideId === slide.id ? 'border-white ring-2 md:ring-4 ring-white/10' : 'border-[#2A2A2A] hover:border-[#3A3A3A]'}`}
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
                className="w-32 md:w-48 aspect-video rounded-xl border-2 border-dashed border-[#2A2A2A] flex flex-col items-center justify-center text-[#8E8E93] hover:border-[#3A3A3A] hover:text-white hover:bg-[#181818] transition-all shrink-0"
              >
                <Plus className="h-6 w-6 md:h-8 md:w-8 mb-1" />
                <span className="text-[10px] md:text-xs font-bold">New Slide</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
