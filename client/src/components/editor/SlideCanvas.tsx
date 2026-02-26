import { useState, useRef, useEffect } from "react";
import { Rnd } from "react-rnd";
import { Slide, Element } from "@shared/schema";
import { useUpdateElement, useDeleteElement } from "@/hooks/use-editor";
import { Type, Image as ImageIcon, Trash2 } from "lucide-react";

interface SlideCanvasProps {
  slide: (Slide & { elements: Element[] }) | undefined;
  presentationId: number;
}

export function SlideCanvas({ slide, presentationId }: SlideCanvasProps) {
  const [selectedElementId, setSelectedElementId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const updateElementMutation = useUpdateElement();
  const deleteElementMutation = useDeleteElement();

  // Click outside to deselect
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
    <div className="w-full h-full flex items-center justify-center p-8 bg-muted/20 overflow-auto">
      {/* Fixed aspect ratio wrapper (16:9 approx 1024x576) */}
      <div 
        ref={containerRef}
        className="relative bg-white canvas-shadow bg-canvas-grid w-[1024px] h-[576px] shrink-0"
        style={{ background: slide.background || '#ffffff' }}
        onClick={() => setSelectedElementId(null)}
      >
        {slide.elements?.map((el) => {
          const style = (el.style as any) || { x: 50, y: 50, width: 200, height: 100, fontSize: 24, color: '#000000' };
          const isSelected = selectedElementId === el.id;

          return (
            <Rnd
              key={el.id}
              bounds="parent"
              position={{ x: style.x || 0, y: style.y || 0 }}
              size={{ width: style.width || 200, height: style.height || 100 }}
              onDragStop={(e, d) => {
                if (d.x === style.x && d.y === style.y) return; // No change
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
              className={`group absolute ${isSelected ? 'ring-2 ring-primary ring-offset-2 z-20' : 'hover:ring-1 hover:ring-primary/50 z-10'}`}
              dragHandleClassName="drag-handle"
            >
              <div className="w-full h-full relative drag-handle cursor-move">
                {/* Element Toolbar - Shows only when selected */}
                {isSelected && (
                  <div className="absolute -top-12 left-0 bg-gray-900 text-white rounded-lg shadow-lg flex items-center gap-1 p-1 z-30 cursor-default">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(el.id); }}
                      className="p-1.5 hover:bg-gray-800 rounded-md text-destructive interactive-transition"
                      title="Delete Element"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {el.type === 'text' && (
                      <input 
                        type="color" 
                        value={style.color || '#000000'}
                        onChange={(e) => handleUpdateStyle(el.id, { ...style, color: e.target.value })}
                        className="w-6 h-6 p-0 border-0 bg-transparent rounded cursor-pointer mx-1"
                        title="Text Color"
                      />
                    )}
                  </div>
                )}

                {/* Content Renderer */}
                {el.type === 'text' ? (
                  <textarea
                    value={el.content || ''}
                    onChange={(e) => handleContentChange(el.id, e.target.value)}
                    className="w-full h-full resize-none bg-transparent border-none outline-none overflow-hidden"
                    style={{ 
                      fontSize: `${style.fontSize || 24}px`,
                      color: style.color || '#000000',
                      fontFamily: 'var(--font-sans)',
                      lineHeight: 1.2
                    }}
                    placeholder="Type something..."
                    onClick={(e) => e.stopPropagation()} // Allow clicking inside to type without triggering drag handle unnecessarily if we refined it, but for now simple setup.
                  />
                ) : el.type === 'image' ? (
                  <div className="w-full h-full bg-muted/50 border border-border/50 flex flex-col items-center justify-center overflow-hidden">
                    {el.content ? (
                      <img src={el.content} alt="Element" className="w-full h-full object-cover pointer-events-none" />
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <input 
                          type="text" 
                          placeholder="Paste image URL..." 
                          className="w-full bg-white px-2 py-1 text-sm border rounded"
                          onBlur={(e) => handleContentChange(el.id, e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleContentChange(el.id, (e.target as HTMLInputElement).value)}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-100 p-2">Unknown element type</div>
                )}
              </div>
            </Rnd>
          );
        })}
      </div>
    </div>
  );
}
