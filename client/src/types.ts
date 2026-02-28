export interface ElementStyle {
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize?: number;
    color?: string;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    rotation?: number;
    opacity?: number;
    zIndex?: number;
    shadow?: boolean;
    borderRadius?: string;
}

export interface SlideElement {
    id: number;
    type: 'text' | 'image' | 'shape';
    content?: string;
    style: ElementStyle;
}

export interface Slide {
    id: number;
    orderIndex: number;
    background?: string;
    elements: SlideElement[];
}

export interface Presentation {
    id: number;
    title: string;
    slides: Slide[];
}
