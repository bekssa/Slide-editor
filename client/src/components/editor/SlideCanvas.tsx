import { useState, useRef, useEffect } from "react";
import { Rnd } from "react-rnd";
import { Slide, SlideElement } from "../../types";
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
  slide: Slide | undefined;
}

export function SlideCanvas({ slide }: SlideCanvasProps) {
  const [selectedElementId, setSelectedElementId] = useState<number | null>(null);
  const [modalPos, setModalPos] = useState<{ x: number, y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const updateElementMutation = useUpdateElement();
  const deleteElementMutation = useDeleteElement();

  useEffect(() => {
    const handleResize = () => {
      if (!wrapperRef.current) return;
      const isMobile = window.innerWidth < 768;
      const padding = isMobile ? 20 : 80;
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
      style: newStyle
    });
  };

  const handleContentChange = (elId: number, content: string) => {
    updateElementMutation.mutate({
      id: elId,
      content
    });
  };

  const handleDelete = (elId: number) => {
    deleteElementMutation.mutate({ id: elId });
    setSelectedElementId(null);
    setModalPos(null);
  };

  const handleElementClick = (e: any, elId: number) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    setSelectedElementId(elId);

    let clientX = e?.clientX;
    let clientY = e?.clientY;

    if (e?.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e && e.target && typeof e.target.getBoundingClientRect === 'function' && clientX === undefined) {
      const rect = e.target.getBoundingClientRect();
      clientX = rect.left + rect.width / 2;
      clientY = rect.top + rect.height / 2;
    }

    if (clientX !== undefined && clientY !== undefined && !isNaN(clientX) && !isNaN(clientY)) {
      setModalPos({ x: clientX, y: clientY });
    } else {
      setModalPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }
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
              onDragStart={(e: any) => handleElementClick(e, el.id)}
              onDragStop={(e: any, d) => {
                if (d.x === style.x && d.y === style.y) return;
                handleUpdateStyle(el.id, { ...style, x: d.x, y: d.y });
              }}
              onResizeStop={(e: any, direction, ref, delta, position) => {
                handleUpdateStyle(el.id, {
                  ...style,
                  width: parseInt(ref.style.width, 10),
                  height: parseInt(ref.style.height, 10),
                  ...position
                });
              }}
              onClick={(e: any) => handleElementClick(e, el.id)}
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
                    onFocus={(e) => handleElementClick(e, el.id)}
                    onTouchStart={(e) => handleElementClick(e, el.id)}
                    onClick={(e) => handleElementClick(e, el.id)}
                    className="w-full h-full resize-none bg-transparent border-none outline-none overflow-hidden p-2 text-white"
                    style={{
                      fontSize: `${style.fontSize || 24}px`,
                      color: style.color || '#ffffff',
                      fontWeight: style.fontWeight || 'normal',
                      textAlign: (style.textAlign || 'left') as any,
                      lineHeight: 1.2
                    }}
                    placeholder="Type something..."
                  />
                ) : el.type === 'image' ? (
                  <div className="w-full h-full bg-[#181818] flex flex-col items-center justify-center overflow-hidden">
                    {el.content ? (
                      <img
                        src={el.content}
                        alt="Element"
                        className="w-full h-full object-cover pointer-events-none"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.img-broken')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'img-broken w-full h-full flex flex-col items-center justify-center text-[#8E8E93]';
                            fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><span style="font-size:11px;margin-top:6px;font-family:sans-serif">Image</span>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
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

      {selectedElementId && modalPos && slide.elements.find(e => e.id === selectedElementId) && (() => {
        const el = slide.elements.find(e => e.id === selectedElementId)!;
        const style = (el.style as any) || {};

        const popoverWidth = 300;
        const popoverHeight = el.type === 'text' ? 500 : 350;
        let left = modalPos.x + 20;
        let top = modalPos.y - 150;

        if (left + popoverWidth > window.innerWidth) left = modalPos.x - popoverWidth - 20;
        if (left < 10) left = 10;

        if (top + popoverHeight > window.innerHeight) top = window.innerHeight - popoverHeight - 20;
        if (top < 10) top = 10;

        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

        return (
          <div
            className={`fixed bg-[#121212] shadow-2xl border-[#2A2A2A] animate-in text-white flex flex-col w-full h-[50dvh] slide-in-from-bottom-full duration-300 border-t rounded-t-2xl md:w-[300px] md:h-auto md:max-h-[80vh] md:rounded-2xl md:border md:zoom-in-95 md:slide-in-none md:p-0`}
            style={{
              left: isMobile ? '0' : `${left}px`,
              top: isMobile ? 'auto' : `${top}px`,
              bottom: isMobile ? '64px' : 'auto',
              zIndex: 99999
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-[#2A2A2A] rounded-full mx-auto mt-3 shrink-0 md:hidden" />

            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => handleDelete(el.id)}
                className="p-1.5 bg-[#181818] md:bg-transparent md:hover:bg-destructive/10 text-destructive hover:text-red-400 rounded-md transition-colors"
              >
                <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              <button
                onClick={() => { setSelectedElementId(null); setModalPos(null); }}
                className="p-1.5 bg-[#181818] md:bg-transparent md:hover:bg-[#1E1E1E] rounded-md transition-colors text-[#8E8E93] hover:text-white"
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>

            <div className="p-4 md:p-5 overflow-y-auto flex-1">
              <h2 className="text-xl md:text-sm font-bold mb-6 md:mb-4 pb-0 md:pb-3 md:border-b md:border-[#2A2A2A] capitalize text-white flex items-center gap-2">
                <Settings2 className="h-5 w-5 md:h-4 md:w-4 text-[#8E8E93] hidden md:inline-block" />
                {el.type === 'text' ? 'Text Style' : 'Properties'}
              </h2>

              <div className="space-y-6 max-md:space-y-8 pb-4">
                {el.type === 'text' && (
                  <>
                    <div className="space-y-3 max-md:space-y-4">
                      <label className="text-[10px] max-md:text-[11px] font-bold max-md:font-extrabold uppercase text-[#8E8E93] flex items-center gap-2 max-md:tracking-wider">
                        <TypeIcon className="h-3 w-3 max-md:h-4 max-md:w-4" /> Font Size
                      </label>
                      <div className="flex items-center gap-4">
                        <Slider
                          className="flex-1 max-md:[&_[role=slider]]:bg-[#0A0A0A] max-md:[&_[role=slider]]:border-[3px] max-md:[&_[role=slider]]:border-[#5B32EA] max-md:[&_[role=slider]]:w-5 max-md:[&_[role=slider]]:h-5 max-md:[&>span:first-child]:bg-[#2A2A2A] max-md:[&>span:first-child>span]:bg-[#5B32EA]"
                          value={[style.fontSize || 24]}
                          min={8}
                          max={120}
                          step={1}
                          onValueChange={([v]) => handleUpdateStyle(el.id, { ...style, fontSize: v })}
                        />
                        <span className="text-xs max-md:text-sm font-normal max-md:font-bold min-w-[3ch]">{style.fontSize || 24}</span>
                      </div>
                    </div>

                    <div className="space-y-3 max-md:space-y-4">
                      <label className="text-[10px] max-md:text-[11px] font-bold max-md:font-extrabold uppercase text-[#8E8E93] flex items-center gap-2 max-md:tracking-wider">
                        <Palette className="h-3 w-3 max-md:h-4 max-md:w-4" /> Color
                      </label>
                      <div className="grid grid-cols-5 gap-2 max-md:gap-3">
                        {textColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleUpdateStyle(el.id, { ...style, color })}
                            className={`transition-all w-8 h-8 max-md:w-10 max-md:h-10 rounded-md max-md:rounded-xl border max-md:border-none ${style.color === color ? 'border-white max-md:ring-2 max-md:ring-white scale-110' : 'border-[#2A2A2A] max-md:border-none hover:border-[#3A3A3A] max-md:hover:scale-105'}`}
                            style={{ background: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 max-md:space-y-4">
                      <label className="text-[10px] max-md:text-[11px] font-bold max-md:font-extrabold uppercase text-[#8E8E93] max-md:tracking-wider">Alignment</label>
                      <div className="flex gap-1 max-md:gap-2 bg-[#181818] max-md:bg-transparent p-1 max-md:p-0 rounded-lg border border-[#2A2A2A] max-md:border-transparent">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`flex-1 h-8 max-md:h-12 max-md:rounded-xl transition-colors ${style.textAlign === 'left' ? 'bg-[#2A2A2A] max-md:bg-[#333333] text-white' : 'text-[#8E8E93] max-md:bg-[#121212] max-md:border max-md:border-[#2A2A2A] max-md:hover:text-white'}`}
                          onClick={() => handleUpdateStyle(el.id, { ...style, textAlign: 'left' })}
                        >
                          <AlignLeft className="h-4 w-4 max-md:h-5 max-md:w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`flex-1 h-8 max-md:h-12 max-md:rounded-xl transition-colors ${style.textAlign === 'center' ? 'bg-[#2A2A2A] max-md:bg-[#333333] text-white' : 'text-[#8E8E93] max-md:bg-[#121212] max-md:border max-md:border-[#2A2A2A] max-md:hover:text-white'}`}
                          onClick={() => handleUpdateStyle(el.id, { ...style, textAlign: 'center' })}
                        >
                          <AlignCenter className="h-4 w-4 max-md:h-5 max-md:w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`flex-1 h-8 max-md:h-12 max-md:rounded-xl transition-colors ${style.textAlign === 'right' ? 'bg-[#2A2A2A] max-md:bg-[#333333] text-white' : 'text-[#8E8E93] max-md:bg-[#121212] max-md:border max-md:border-[#2A2A2A] max-md:hover:text-white'}`}
                          onClick={() => handleUpdateStyle(el.id, { ...style, textAlign: 'right' })}
                        >
                          <AlignRight className="h-4 w-4 max-md:h-5 max-md:w-5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between max-md:mt-2">
                      <Label className="text-[10px] max-md:text-[11px] font-bold max-md:font-extrabold uppercase text-[#8E8E93] max-md:tracking-wider">Bold</Label>
                      <Switch
                        checked={style.fontWeight === 'bold'}
                        onCheckedChange={(v) => handleUpdateStyle(el.id, { ...style, fontWeight: v ? 'bold' : 'normal' })}
                        className="max-md:[&[data-state=checked]]:bg-[#5B32EA]"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-3 max-md:space-y-4">
                  <div className="flex justify-between text-[10px] max-md:text-[11px] font-bold max-md:font-extrabold uppercase text-[#8E8E93] max-md:tracking-wider">
                    <label className="flex items-center gap-2"><RotateCw className="h-3 w-3 max-md:h-4 max-md:w-4" /> Rotation</label>
                    <span className="font-normal max-md:font-bold">{style.rotation || 0}°</span>
                  </div>
                  <div className="px-0 max-md:px-1">
                    <Slider
                      className="h-4 max-md:[&_[role=slider]]:bg-[#0A0A0A] max-md:[&_[role=slider]]:border-[3px] max-md:[&_[role=slider]]:border-[#5B32EA] max-md:[&_[role=slider]]:w-5 max-md:[&_[role=slider]]:h-5 max-md:[&>span:first-child]:bg-[#2A2A2A] max-md:[&>span:first-child>span]:bg-[#5B32EA]"
                      value={[style.rotation || 0]}
                      max={360}
                      step={1}
                      onValueChange={([v]) => handleUpdateStyle(el.id, { ...style, rotation: v })}
                    />
                  </div>
                </div>

                <div className="space-y-3 max-md:space-y-4">
                  <div className="flex justify-between text-[10px] max-md:text-[11px] font-bold max-md:font-extrabold uppercase text-[#8E8E93] max-md:tracking-wider">
                    <label className="flex items-center gap-2"><Layers className="h-3 w-3 max-md:h-4 max-md:w-4" /> Opacity</label>
                    <span className="font-normal max-md:font-bold">{Math.round((style.opacity ?? 1) * 100)}%</span>
                  </div>
                  <div className="px-0 max-md:px-1">
                    <Slider
                      className="h-4 max-md:[&_[role=slider]]:bg-[#0A0A0A] max-md:[&_[role=slider]]:border-[3px] max-md:[&_[role=slider]]:border-[#5B32EA] max-md:[&_[role=slider]]:w-5 max-md:[&_[role=slider]]:h-5 max-md:[&>span:first-child]:bg-[#2A2A2A] max-md:[&>span:first-child>span]:bg-[#5B32EA]"
                      value={[(style.opacity ?? 1) * 100]}
                      max={100}
                      step={1}
                      onValueChange={([v]) => handleUpdateStyle(el.id, { ...style, opacity: v / 100 })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pb-0 max-md:pb-4">
                  <Label htmlFor="shadow-toggle" className="text-[10px] max-md:text-[11px] font-bold max-md:font-extrabold uppercase text-[#8E8E93] max-md:tracking-wider">Shadows</Label>
                  <Switch
                    id="shadow-toggle"
                    checked={style.shadow || false}
                    onCheckedChange={(v) => handleUpdateStyle(el.id, { ...style, shadow: v })}
                    className="max-md:[&[data-state=checked]]:bg-[#5B32EA]"
                  />
                </div>

                <div className="pt-3 max-md:pt-6 border-t border-[#2A2A2A]">
                  <label className="text-[10px] max-md:text-[11px] font-bold max-md:font-extrabold uppercase text-[#8E8E93] block mb-3 max-md:mb-4 max-md:tracking-wider">Layers</label>
                  <div className="flex gap-2 max-md:gap-3">
                    <Button variant="outline" size="sm" className="flex-1 h-8 max-md:h-12 text-[10px] max-md:text-xs uppercase font-bold max-md:font-extrabold max-md:tracking-wider border-[#2A2A2A] bg-transparent hover:bg-[#1E1E1E] text-white max-md:rounded-xl" onClick={() => handleUpdateStyle(el.id, { ...style, zIndex: (style.zIndex || 0) + 1 })}>Forward</Button>
                    <Button variant="outline" size="sm" className="flex-1 h-8 max-md:h-12 text-[10px] max-md:text-xs uppercase font-bold max-md:font-extrabold max-md:tracking-wider border-[#2A2A2A] bg-transparent hover:bg-[#1E1E1E] text-white max-md:rounded-xl" onClick={() => handleUpdateStyle(el.id, { ...style, zIndex: Math.max(0, (style.zIndex || 0) - 1) })}>Backward</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
