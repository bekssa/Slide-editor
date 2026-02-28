import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Presentation, Slide, SlideElement, ElementStyle } from '../types';

interface PresentationContextType {
    presentation: Presentation | null;
    addSlide: (background?: string) => void;
    deleteSlide: (id: number) => void;
    updateSlide: (id: number, background: string) => void;
    addElement: (slideId: number, type: 'text' | 'image' | 'shape', content: string | undefined, style: ElementStyle) => void;
    updateElement: (id: number, content?: string, style?: ElementStyle) => void;
    deleteElement: (id: number) => void;
}

const PresentationContext = createContext<PresentationContextType | undefined>(undefined);

const initialPresentation: Presentation = {
    id: 1,
    title: "My First Presentation",
    slides: [
        {
            id: 1,
            orderIndex: 0,
            background: "#1e1e1e",
            elements: [
                {
                    id: 1,
                    type: 'text',
                    content: "Привет! Это тестовый слайд",
                    style: {
                        x: 80,
                        y: 80,
                        width: 800,
                        height: 100,
                        fontSize: 40,
                        color: "#ffffff",
                        fontWeight: "bold",
                        textAlign: "center",
                        opacity: 1,
                        rotation: 0,
                        zIndex: 1,
                    },
                },
                {
                    id: 2,
                    type: 'image',
                    content: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600",
                    style: {
                        x: 312,
                        y: 200,
                        width: 400,
                        height: 240,
                        opacity: 1,
                        rotation: 0,
                        zIndex: 2,
                        shadow: true,
                    }
                }
            ],
        },
    ],
};

export const PresentationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [presentation, setPresentation] = useState<Presentation>(initialPresentation);
    const [nextSlideId, setNextSlideId] = useState(2);
    const [nextElementId, setNextElementId] = useState(3);

    const addSlide = (background = "#1e1e1e") => {
        setPresentation((prev) => ({
            ...prev,
            slides: [
                ...prev.slides,
                {
                    id: nextSlideId,
                    orderIndex: prev.slides.length,
                    background,
                    elements: [],
                },
            ],
        }));
        setNextSlideId(id => id + 1);
    };

    const deleteSlide = (id: number) => {
        setPresentation((prev) => ({
            ...prev,
            slides: prev.slides.filter(s => s.id !== id).map((s, index) => ({ ...s, orderIndex: index })),
        }));
    };

    const updateSlide = (id: number, background: string) => {
        setPresentation((prev) => ({
            ...prev,
            slides: prev.slides.map(s => s.id === id ? { ...s, background } : s),
        }));
    };

    const addElement = (slideId: number, type: 'text' | 'image' | 'shape', content: string | undefined, style: ElementStyle) => {
        setPresentation((prev) => ({
            ...prev,
            slides: prev.slides.map(s => {
                if (s.id !== slideId) return s;
                return {
                    ...s,
                    elements: [
                        ...s.elements,
                        {
                            id: nextElementId,
                            type,
                            content,
                            style,
                        },
                    ],
                };
            }),
        }));
        setNextElementId(id => id + 1);
    };

    const updateElement = (id: number, content?: string, style?: ElementStyle) => {
        setPresentation((prev) => ({
            ...prev,
            slides: prev.slides.map(s => {
                const hasElement = s.elements.some(e => e.id === id);
                if (!hasElement) return s;
                return {
                    ...s,
                    elements: s.elements.map(e => {
                        if (e.id !== id) return e;
                        return {
                            ...e,
                            content: content !== undefined ? content : e.content,
                            style: style !== undefined ? { ...e.style, ...style } : e.style,
                        };
                    }),
                };
            }),
        }));
    };

    const deleteElement = (id: number) => {
        setPresentation((prev) => ({
            ...prev,
            slides: prev.slides.map(s => ({
                ...s,
                elements: s.elements.filter(e => e.id !== id),
            })),
        }));
    };

    return (
        <PresentationContext.Provider
            value={{
                presentation,
                addSlide,
                deleteSlide,
                updateSlide,
                addElement,
                updateElement,
                deleteElement,
            }}
        >
            {children}
        </PresentationContext.Provider>
    );
};

export const usePresentationContext = () => {
    const context = useContext(PresentationContext);
    if (context === undefined) {
        throw new Error('usePresentationContext must be used within a PresentationProvider');
    }
    return context;
};
