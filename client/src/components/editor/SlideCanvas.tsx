import { useState, useRef, useEffect } from "react";
import { Rnd } from "react-rnd";
import { Slide, Element } from "@shared/schema";
import { useUpdateElement, useDeleteElement } from "@/hooks/use-editor";
import { 
  Type, Image as ImageIcon, Trash2, Settings2, Layers, RotateCw, X, 
  Type as TypeIcon, AlignLeft, AlignCenter, AlignRight, Bold, Palette
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SlideCanvasProps {
  slide: (Slide & { elements: Element[] }) | undefined;
  presentationId: number;
}

export function SlideCanvas({ slide, presentationId }: SlideCanvasProps) {
  const [selectedElementId, setSelectedElementId] = useState<number | null>(null);
  const [modalPos, setModalPos] = useState<{ x: number, y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  
  const updateElementMutation = useUpdateElement();
  const deleteElementMutation = useDeleteElement();

  // Auto-scale to fit screen
  useEffect(() => {
    const handleResize = () => {
      if (!wrapperRef.current) return;
      const padding = 80;
      const wrapperWidth = wrapperRef.current.clientWidth - padding;
      const wrapperHeight = wrapperRef.current.clientHeight - padding;
      
      const canvasWidth = 1024;
      const canvasHeight = 576;
      
      const scaleX = wrapperWidth / canvasWidth;
      const scaleY = wrapperHeight / canvasHeight;
      const newScale = Math.min(scaleX, scaleY, 1);
      
      setScale(newScale);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && e.target === containerRef.current) {
        setSelectedElementId(null);
        setModalPos(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!slide) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[#8E8E93] font-medium">
        Select or create a slide to begin
      </div>
    );
  }

  const handleUpdateStyle = (elId: number, newStyle: any) => {
    updateElementMutation.mutate({
      id: elId,
      presentationId,
      style: newStyle
    });
  };

  const handleContentChange = (elId: number, content: string) => {
    updateElementMutation.mutate({
      id: elId,
      presentationId,
      content
    });
  };

  const handleDelete = (elId: number) => {
    deleteElementMutation.mutate({ id: elId, presentationId });
    setSelectedElementId(null);
    setModalPos(null);
  };

  const handleElementClick = (e: React.MouseEvent, elId: number) => {
    e.stopPropagation();
    setSelectedElementId(elId);
    setModalPos({ x: e.clientX, y: e.clientY });
  };

  const textColors = [
    '#ffffff', '#000000', '#8E8E93', '#f44336', '#e91e63', 
    '#9c27b0', '#673ab7', '#2196f3', '#03a9f4', '#00bcd4'
  ];

  return (
    <div ref={wrapperRef} className="w-full h-full flex items-center justify-center relative bg-transparent">
      <div 
        ref={containerRef}
        className="relative bg-[#1E1E1E] shadow-2xl w-[1024px] h-[576px] shrink-0 overflow-hidden rounded-sm origin-center transition-transform duration-200"
        style={{ 
          background: slide.background || '#1e1e1e',
          transform: `scale(${scale})`
        }}
        onClick={() => {
          setSelectedElementId(null);
          setModalPos(null);
        }}
      >
        {slide.elements?.sort((a, b) => ((a.style as any)?.zIndex || 0) - ((b.style as any)?.zIndex || 0)).map((el) => {
          const style = (el.style as any) || { x: 50, y: 50, width: 200, height: 100, fontSize: 24, color: '#ffffff', rotation: 0, opacity: 1, zIndex: 1, shadow: false };
          const isSelected = selectedElementId === el.id;

          return (
            <Rnd
              key={el.id}
              bounds="parent"
              position={{ x: style.x || 0, y: style.y || 0 }}
              size={{ width: style.width || 200, height: style.height || 100 }}
              scale={scale}
              onDragStop={(e, d) => {
                if (d.x === style.x && d.y === style.y) return;
                handleUpdateStyle(el.id, { ...style, x: d.x, y: d.y });
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                handleUpdateStyle(el.id, { 
                  ...style, 
                  width: parseInt(ref.style.width, 10), 
                  height: parseInt(ref.style.height, 10),
                  ...position 
                });
              }}
              onClick={(e) => handleElementClick(e, el.id)}
              className={`group absolute ${isSelected ? 'ring-2 ring-white z-50' : 'hover:ring-1 hover:ring-white/50 z-10'}`}
              style={{ 
                transform: `rotate(${style.rotation || 0}deg)`,
                opacity: style.opacity ?? 1,
                boxShadow: style.shadow ? '0 10px 25px -5px rgba(0,0,0,0.5)' : 'none'
              }}
            >
              <div className="w-full h-full relative cursor-move">
                {el.type === 'text' ? (
                  <textarea
                    value={el.content || ''}
                    onChange={(e) => handleContentChange(el.id, e.target.value)}
                    onFocus={(e) => handleElementClick(e as any, el.id)}
                    className="w-full h-full resize-none bg-transparent border-none outline-none overflow-hidden p-2 text-white"
                    style={{ 
                      fontSize: `${style.fontSize || 24}px`,
                      color: style.color || '#ffffff',
                      fontWeight: style.fontWeight || 'normal',
                      textAlign: (style.textAlign || 'left') as any,
                      lineHeight: 1.2
                    }}
                    placeholder="Type something..."
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : el.type === 'image' ? (
                  <div className="w-full h-full bg-[#181818] flex flex-col items-center justify-center overflow-hidden">
                    {el.content ? (
                      <img src={el.content} alt="Element" className="w-full h-full object-cover pointer-events-none" />
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="h-8 w-8 text-[#8E8E93] mx-auto mb-2" />
                        <input 
                          type="text" 
                          placeholder="Image URL..." 
                          className="w-full bg-[#121212] text-white px-2 py-1 text-xs border border-[#2A2A2A] rounded shadow-sm"
                          onBlur={(e) => handleContentChange(el.id, e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleContentChange(el.id, (e.target as HTMLInputElement).value)}
                        />
                      </div>
                    )}
                  </div>
                ) : el.type === 'shape' ? (
                  <div 
                    className="w-full h-full" 
                    style={{ backgroundColor: style.color || '#3b82f6', borderRadius: style.borderRadius || '0px' }} 
                  />
                ) : null}
              </div>
            </Rnd>
          );
        })}
      </div>

      {/* Popover Property Editor */}
      {selectedElementId && modalPos && slide.elements.find(e => e.id === selectedElementId) && (() => {
        const el = slide.elements.find(e => e.id === selectedElementId)!;
        const style = (el.style as any) || {};
        
        // Calculate popover position to keep it on screen
        const popoverWidth = 300;
        const popoverHeight = el.type === 'text' ? 500 : 350;
        let left = modalPos.x + 20;
        let top = modalPos.y - 150;
        
        if (left + popoverWidth > window.innerWidth) left = modalPos.x - popoverWidth - 20;
        if (top + popoverHeight > window.innerHeight) top = window.innerHeight - popoverHeight - 20;
        if (top < 20) top = 20;

        return (
          <div 
            className="fixed w-[300px] bg-[#121212] shadow-2xl rounded-2xl p-5 border border-[#2A2A2A] animate-in zoom-in-95 duration-200 z-[100] text-white"
            style={{ left: `${left}px`, top: `${top}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2A2A2A]">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-[#8E8E93]" />
                {el.type === 'text' ? 'Text Style' : 'Properties'}
              </h3>
              <div className="flex gap-1">
                <button onClick={() => handleDelete(el.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
                <button onClick={() => { setSelectedElementId(null); setModalPos(null); }} className="p-1.5 hover:bg-[#1E1E1E] rounded-md transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <ScrollArea className="h-[max-content] max-h-[60vh] pr-2">
              <div className="space-y-6">
                {el.type === 'text' && (
                  <>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase text-[#8E8E93] flex items-center gap-2">
                        <TypeIcon className="h-3 w-3" /> Font Size
                      </label>
                      <div className="flex items-center gap-4">
                        <Slider 
                          className="flex-1"
                          value={[style.fontSize || 24]} 
                          min={8}
                          max={120} 
                          step={1} 
                          onValueChange={([v]) => handleUpdateStyle(el.id, { ...style, fontSize: v })}
                        />
                        <span className="text-xs min-w-[3ch]">{style.fontSize || 24}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase text-[#8E8E93] flex items-center gap-2">
                        <Palette className="h-3 w-3" /> Color
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {textColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleUpdateStyle(el.id, { ...style, color })}
                            className={`w-8 h-8 rounded-md border transition-all ${style.color === color ? 'border-white scale-110' : 'border-[#2A2A2A] hover:border-[#3A3A3A]'}`}
                            style={{ background: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase text-[#8E8E93]">Alignment</label>
                      <div className="flex gap-1 bg-[#181818] p-1 rounded-lg border border-[#2A2A2A]">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`flex-1 h-8 ${style.textAlign === 'left' ? 'bg-[#2A2A2A] text-white' : 'text-[#8E8E93]'}`}
                          onClick={() => handleUpdateStyle(el.id, { ...style, textAlign: 'left' })}
                        >
                          <AlignLeft className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`flex-1 h-8 ${style.textAlign === 'center' ? 'bg-[#2A2A2A] text-white' : 'text-[#8E8E93]'}`}
                          onClick={() => handleUpdateStyle(el.id, { ...style, textAlign: 'center' })}
                        >
                          <AlignCenter className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`flex-1 h-8 ${style.textAlign === 'right' ? 'bg-[#2A2A2A] text-white' : 'text-[#8E8E93]'}`}
                          onClick={() => handleUpdateStyle(el.id, { ...style, textAlign: 'right' })}
                        >
                          <AlignRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase text-[#8E8E93]">Bold</Label>
                      <Switch 
                        checked={style.fontWeight === 'bold'}
                        onCheckedChange={(v) => handleUpdateStyle(el.id, { ...style, fontWeight: v ? 'bold' : 'normal' })}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-[#8E8E93]">
                    <label className="flex items-center gap-2"><RotateCw className="h-3 w-3" /> Rotation</label>
                    <span>{style.rotation || 0}°</span>
                  </div>
                  <Slider 
                    className="h-4"
                    value={[style.rotation || 0]} 
                    max={360} 
                    step={1} 
                    onValueChange={([v]) => handleUpdateStyle(el.id, { ...style, rotation: v })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-[#8E8E93]">
                    <label className="flex items-center gap-2"><Layers className="h-3 w-3" /> Opacity</label>
                    <span>{Math.round((style.opacity ?? 1) * 100)}%</span>
                  </div>
                  <Slider 
                    className="h-4"
                    value={[(style.opacity ?? 1) * 100]} 
                    max={100} 
                    step={1} 
                    onValueChange={([v]) => handleUpdateStyle(el.id, { ...style, opacity: v / 100 })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="shadow-toggle" className="text-[10px] font-bold uppercase text-[#8E8E93]">Shadows</Label>
                  <Switch 
                    id="shadow-toggle" 
                    checked={style.shadow || false}
                    onCheckedChange={(v) => handleUpdateStyle(el.id, { ...style, shadow: v })}
                  />
                </div>

                <div className="pt-3 border-t border-[#2A2A2A]">
                  <label className="text-[10px] font-bold uppercase text-[#8E8E93] block mb-3">Layers</label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-[10px] uppercase font-bold border-[#2A2A2A] bg-transparent hover:bg-[#1E1E1E]" onClick={() => handleUpdateStyle(el.id, { ...style, zIndex: (style.zIndex || 0) + 1 })}>Forward</Button>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-[10px] uppercase font-bold border-[#2A2A2A] bg-transparent hover:bg-[#1E1E1E]" onClick={() => handleUpdateStyle(el.id, { ...style, zIndex: Math.max(0, (style.zIndex || 0) - 1) })}>Backward</Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        );
      })()}
    </div>
  );
}
