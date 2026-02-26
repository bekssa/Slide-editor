import { useState, useRef, useEffect } from "react";
import { Rnd } from "react-rnd";
import { Slide, Element } from "@shared/schema";
import { useUpdateElement, useDeleteElement } from "@/hooks/use-editor";
import { Type, Image as ImageIcon, Trash2, Settings2, Layers, RotateCw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface SlideCanvasProps {
  slide: (Slide & { elements: Element[] }) | undefined;
  presentationId: number;
}

export function SlideCanvas({ slide, presentationId }: SlideCanvasProps) {
  const [selectedElementId, setSelectedElementId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const updateElementMutation = useUpdateElement();
  const deleteElementMutation = useDeleteElement();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && e.target === containerRef.current) {
        setSelectedElementId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!slide) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground font-medium">
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
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-8 overflow-visible relative">
      <div 
        ref={containerRef}
        className="relative bg-white shadow-2xl w-[1024px] h-[576px] shrink-0 overflow-hidden rounded-sm"
        style={{ background: slide.background || '#ffffff' }}
        onClick={() => setSelectedElementId(null)}
      >
        {slide.elements?.sort((a, b) => ((a.style as any)?.zIndex || 0) - ((b.style as any)?.zIndex || 0)).map((el) => {
          const style = (el.style as any) || { x: 50, y: 50, width: 200, height: 100, fontSize: 24, color: '#000000', rotation: 0, opacity: 1, zIndex: 1, shadow: false };
          const isSelected = selectedElementId === el.id;

          return (
            <Rnd
              key={el.id}
              bounds="parent"
              position={{ x: style.x || 0, y: style.y || 0 }}
              size={{ width: style.width || 200, height: style.height || 100 }}
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
              onClick={(e) => {
                e.stopPropagation();
                setSelectedElementId(el.id);
              }}
              className={`group absolute ${isSelected ? 'ring-2 ring-[#2D1B69] z-50' : 'hover:ring-1 hover:ring-[#2D1B69]/50 z-10'}`}
              style={{ 
                transform: `rotate(${style.rotation || 0}deg)`,
                opacity: style.opacity ?? 1,
                boxShadow: style.shadow ? '0 10px 25px -5px rgba(0,0,0,0.3)' : 'none'
              }}
            >
              <div className="w-full h-full relative cursor-move">
                {el.type === 'text' ? (
                  <textarea
                    value={el.content || ''}
                    onChange={(e) => handleContentChange(el.id, e.target.value)}
                    className="w-full h-full resize-none bg-transparent border-none outline-none overflow-hidden p-2"
                    style={{ 
                      fontSize: `${style.fontSize || 24}px`,
                      color: style.color || '#000000',
                      fontWeight: style.fontWeight || 'normal',
                      textAlign: style.textAlign || 'left',
                      lineHeight: 1.2
                    }}
                    placeholder="Type something..."
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : el.type === 'image' ? (
                  <div className="w-full h-full bg-muted/20 flex flex-col items-center justify-center overflow-hidden">
                    {el.content ? (
                      <img src={el.content} alt="Element" className="w-full h-full object-cover pointer-events-none" />
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <input 
                          type="text" 
                          placeholder="Paste image URL..." 
                          className="w-full bg-white px-2 py-1 text-xs border rounded shadow-sm"
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

      {/* Floating Property Editor */}
      {selectedElementId && slide.elements.find(e => e.id === selectedElementId) && (() => {
        const el = slide.elements.find(e => e.id === selectedElementId)!;
        const style = (el.style as any) || {};
        
        return (
          <div className="absolute right-[-340px] top-1/2 -translate-y-1/2 w-80 bg-white shadow-2xl rounded-2xl p-6 border border-border animate-in fade-in slide-in-from-right-4 z-50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-[#2D1B69]" />
                Properties
              </h3>
              <button onClick={() => handleDelete(el.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground">
                  <label className="flex items-center gap-2"><RotateCw className="h-3 w-3" /> Rotation</label>
                  <span>{style.rotation || 0}°</span>
                </div>
                <Slider 
                  value={[style.rotation || 0]} 
                  max={360} 
                  step={1} 
                  onValueChange={([v]) => handleUpdateStyle(el.id, { ...style, rotation: v })}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground">
                  <label className="flex items-center gap-2"><Layers className="h-3 w-3" /> Opacity</label>
                  <span>{Math.round((style.opacity ?? 1) * 100)}%</span>
                </div>
                <Slider 
                  value={[(style.opacity ?? 1) * 100]} 
                  max={100} 
                  step={1} 
                  onValueChange={([v]) => handleUpdateStyle(el.id, { ...style, opacity: v / 100 })}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Label htmlFor="shadow-toggle" className="text-xs font-bold uppercase text-muted-foreground">Shadows</Label>
                <Switch 
                  id="shadow-toggle" 
                  checked={style.shadow || false}
                  onCheckedChange={(v) => handleUpdateStyle(el.id, { ...style, shadow: v })}
                />
              </div>

              <div className="pt-4 border-t">
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-4">Layers</label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => handleUpdateStyle(el.id, { ...style, zIndex: (style.zIndex || 0) + 1 })}>Bring Forward</Button>
                  <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => handleUpdateStyle(el.id, { ...style, zIndex: Math.max(0, (style.zIndex || 0) - 1) })}>Send Backward</Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
