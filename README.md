# Slide-editor — Полная документация проекта

## Содержание

1. [Общее описание](#1-общее-описание)
2. [Структура файлов](#2-структура-файлов)
3. [Как работает State (данные)](#3-как-работает-state-данные)
4. [Types — типы данных](#4-types--типы-данных)
5. [Context — глобальное хранилище](#5-context--глобальное-хранилище)
6. [Хуки — подробный разбор](#6-хуки--подробный-разбор)
7. [Страницы](#7-страницы)
8. [Компоненты](#8-компоненты)
9. [Маршрутизация (App.tsx)](#9-маршрутизация-apptsx)
10. [Конфигурация проекта](#10-конфигурация-проекта)
11. [Поток данных — от клика до экрана](#11-поток-данных--от-клика-до-экрана)

---

## 1. Общее описание

**Slide-editor** — это браузерный редактор презентаций. Аналог Google Slides / Canva, но работающий полностью в браузере без сервера и базы данных.

**Стек технологий:**

| Технология | Для чего |
|---|---|
| React 18 | UI-фреймворк |
| TypeScript | Типизация |
| Vite | Сборщик и dev-сервер |
| react-rnd | Drag & resize элементов на канвасе |
| Tailwind CSS | Стили |
| shadcn/ui + Radix UI | UI-компоненты (кнопки, слайдеры и т.д.) |
| Lucide React | Иконки |

**Важно:** Проект полностью фронтенд. Нет сервера, нет базы данных, нет HTTP-запросов. Все данные живут в памяти браузера (React state) и сбрасываются при перезагрузке.

---

## 2. Структура файлов

```
Slide-editor/
├── client/
│   ├── index.html              — HTML-шаблон, подключает шрифты Google Fonts
│   └── src/
│       ├── main.tsx            — Точка входа приложения, рендерит <App />
│       ├── App.tsx             — Провайдеры и роутинг
│       ├── index.css           — Глобальные стили, CSS-переменные темы
│       ├── types.ts            — TypeScript-типы данных
│       ├── context/
│       │   └── PresentationContext.tsx  — Глобальный State всей презентации
│       ├── hooks/
│       │   ├── use-presentations.ts     — Хук для чтения данных презентации
│       │   ├── use-editor.ts            — Хуки для изменения данных (CRUD)
│       │   ├── use-toast.ts             — Хук для уведомлений
│       │   └── use-mobile.ts            — Хук проверки мобильного устройства
│       ├── pages/
│       │   └── Editor.tsx      — Главная страница редактора (вся UI-логика)
│       ├── components/
│       │   ├── editor/
│       │   │   └── SlideCanvas.tsx     — Канвас слайда с drag&drop
│       │   └── ui/                     — Переиспользуемые UI-компоненты (shadcn)
│       └── lib/
│           ├── utils.ts        — Утилита cn() для объединения классов
│           └── queryClient.ts  — Пустой файл (остаток от бэкенда)
├── attached_assets/            — Статичные картинки
├── vite.config.ts              — Конфигурация Vite
├── tailwind.config.ts          — Конфигурация Tailwind
├── tsconfig.json               — Конфигурация TypeScript
└── package.json                — Зависимости проекта
```

---

## 3. Как работает State (данные)

Вся логика хранения данных построена на трёх уровнях:

```
PresentationContext (useState)
        ↓ предоставляет данные через React Context
Хуки (use-presentations, use-editor)
        ↓ компоненты вызывают хуки
Компоненты (Editor.tsx, SlideCanvas.tsx)
```

### Структура данных в памяти:

```
Presentation
├── id: number
├── title: string
└── slides: Slide[]
        ├── id: number
        ├── orderIndex: number        (порядок слайда)
        ├── background: string        (цвет фона, например "#1e1e1e")
        └── elements: SlideElement[]
                ├── id: number
                ├── type: 'text' | 'image' | 'shape'
                ├── content: string   (текст / base64-картинка / тип фигуры)
                └── style: ElementStyle
                        ├── x, y           (позиция на канвасе в px)
                        ├── width, height  (размер в px)
                        ├── fontSize       (размер шрифта, только для text)
                        ├── color          (цвет текста/фигуры)
                        ├── fontWeight     ('normal' | 'bold')
                        ├── textAlign      ('left' | 'center' | 'right')
                        ├── rotation       (угол поворота в градусах)
                        ├── opacity        (прозрачность от 0 до 1)
                        ├── zIndex         (слой, z-порядок)
                        └── shadow         (boolean, есть ли тень)
```

---

## 4. Types — типы данных

**Файл:** `client/src/types.ts`

Содержит TypeScript-интерфейсы — описание формы всех данных приложения.

```typescript
// Стиль элемента на слайде
interface ElementStyle {
    x: number;         // позиция по горизонтали (px от левого края канваса)
    y: number;         // позиция по вертикали (px от верхнего края)
    width: number;     // ширина
    height: number;    // высота
    fontSize?: number; // только для текста
    color?: string;    // цвет текста или фигуры
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    rotation?: number; // 0-360 градусов
    opacity?: number;  // 0.0 (прозрачный) — 1.0 (непрозрачный)
    zIndex?: number;   // порядок слоёв
    shadow?: boolean;  // тень box-shadow
    borderRadius?: string;
}

interface SlideElement {
    id: number;
    type: 'text' | 'image' | 'shape';
    content?: string;  // текст для 'text', base64 для 'image'
    style: ElementStyle;
}

interface Slide {
    id: number;
    orderIndex: number;  // позиция в списке слайдов
    background?: string; // hex-цвет фона
    elements: SlideElement[];
}

interface Presentation {
    id: number;
    title: string;
    slides: Slide[];
}
```

---

## 5. Context — глобальное хранилище

**Файл:** `client/src/context/PresentationContext.tsx`

Это сердце приложения. Он реализует паттерн **React Context + useState**.

### Как работает React Context:

Обычно данные передаются через props (родитель → ребёнок). Context позволяет любому компоненту получить данные напрямую, без передачи через всю цепочку.

```
App (Provider — оборачивает всё приложение)
├── Editor.tsx    ← может взять данные из Context
│   └── SlideCanvas.tsx ← тоже может взять из Context
```

### Что хранится в Context:

```typescript
interface PresentationContextType {
    presentation: Presentation | null;  // сами данные
    addSlide: (background?: string) => void;
    deleteSlide: (id: number) => void;
    updateSlide: (id: number, background: string) => void;
    addElement: (slideId, type, content, style) => void;
    updateElement: (id, content?, style?) => void;
    deleteElement: (id: number) => void;
}
```

### Начальные данные (initialPresentation):

Context инициализируется с тестовым слайдом — текст "Привет! Это тестовый слайд" + горная картинка с Unsplash.

### Как работают методы:

Все методы изменяют state через `setPresentation()` — React автоматически перерисовывает всё, что использует эти данные.

**Пример — addSlide:**
```typescript
const addSlide = (background = "#1e1e1e") => {
    setPresentation((prev) => ({
        ...prev,
        slides: [
            ...prev.slides,
            {
                id: nextSlideId,          // берём следующий ID
                orderIndex: prev.slides.length,  // добавляем в конец
                background,
                elements: [],
            },
        ],
    }));
    setNextSlideId(id => id + 1);  // увеличиваем счётчик ID
};
```

**Пример — updateElement:**
```typescript
const updateElement = (id, content?, style?) => {
    setPresentation((prev) => ({
        ...prev,
        slides: prev.slides.map(slide => {
            // находим слайд, содержащий этот элемент
            const hasElement = slide.elements.some(e => e.id === id);
            if (!hasElement) return slide;  // пропускаем чужие слайды
            return {
                ...slide,
                elements: slide.elements.map(el => {
                    if (el.id !== id) return el;
                    return {
                        ...el,
                        // обновляем только то, что передали
                        content: content !== undefined ? content : el.content,
                        style: style !== undefined ? { ...el.style, ...style } : el.style,
                    };
                }),
            };
        }),
    }));
};
```

---

## 6. Хуки — подробный разбор

Хуки — это функции, название которых начинается с `use`. Они позволяют использовать возможности React (state, lifecycle) в функциональных компонентах.

### `use-presentations.ts`

**Файл:** `client/src/hooks/use-presentations.ts`

Отвечает за **чтение** данных презентации.

```typescript
// Возвращает список всех презентаций (пока всегда одна)
export function usePresentations() {
    const { presentation } = usePresentationContext();
    return { data: [presentation], isLoading: false, error: null };
}

// Возвращает конкретную презентацию по ID
// (id сейчас игнорируется — всегда одна презентация)
export function usePresentation(id: number | null) {
    const { presentation } = usePresentationContext();
    return { data: presentation, isLoading: false, error: null };
}
```

**Почему такая структура?** Раньше был бэкенд — хуки делали HTTP-запросы и возвращали `{ data, isLoading, error }`. Теперь бэкенда нет, но структура сохранена, чтобы компоненты не пришлось переписывать.

**Где используется:**
```typescript
// В Editor.tsx:
const { data: presentation, isLoading, error } = usePresentation(presentationId);
// presentation — объект Presentation со всеми слайдами
// isLoading — всегда false (данные мгновенны)
// error — всегда null
```

---

### `use-editor.ts`

**Файл:** `client/src/hooks/use-editor.ts`

Содержит хуки для **изменения** данных. Каждый хук — обёртка над одним методом из Context.

#### `useCreateSlide()`
```typescript
export function useCreateSlide() {
    const { addSlide } = usePresentationContext();
    return {
        mutateAsync: async (params: { background: string }) =>
            addSlide(params.background)
    };
}
```
**Использование в Editor.tsx:**
```typescript
const createSlideMutation = useCreateSlide();
// ...
await createSlideMutation.mutateAsync({ background: '#1e1e1e' });
```

#### `useUpdateSlide()`
```typescript
export function useUpdateSlide() {
    const { updateSlide } = usePresentationContext();
    return {
        mutateAsync: async (params: { id: number, background: string }) =>
            updateSlide(params.id, params.background)
    };
}
```
**Используется** при смене цвета фона слайда через палитру.

#### `useDeleteSlide()`
```typescript
export function useDeleteSlide() {
    const { deleteSlide } = usePresentationContext();
    return {
        mutateAsync: async (params: { id: number }) =>
            deleteSlide(params.id)
    };
}
```
**Используется** при нажатии на иконку корзины на слайде в нижней полоске.

#### `useCreateElement()`
```typescript
export function useCreateElement() {
    const { addElement } = usePresentationContext();
    return {
        mutateAsync: async (params: {
            slideId: number,
            type: 'text' | 'image' | 'shape',
            content?: string,
            style: ElementStyle
        }) => {
            addElement(params.slideId, params.type, params.content, params.style);
        }
    };
}
```
**Используется** когда добавляют текст, картинку или фигуру на слайд.

#### `useUpdateElement()`
```typescript
export function useUpdateElement() {
    const { updateElement } = usePresentationContext();
    return {
        mutate: (params: { id: number, content?: string, style?: ElementStyle }) => {
            updateElement(params.id, params.content, params.style);
        }
    };
}
```
**Используется в SlideCanvas.tsx** при:
- Перетаскивании элемента (обновляет x, y)
- Изменении размера (обновляет width, height)
- Вводе текста в textarea (обновляет content)
- Изменении стилей через панель Properties (fontSize, color, opacity, rotation и т.д.)

#### `useDeleteElement()`
```typescript
export function useDeleteElement() {
    const { deleteElement } = usePresentationContext();
    return {
        mutate: (params: { id: number }) => deleteElement(params.id)
    };
}
```
**Используется** при нажатии на иконку корзины в панели Properties.

---

### `use-toast.ts`

**Файл:** `client/src/hooks/use-toast.ts`

Управляет системой всплывающих уведомлений (toast).

```typescript
const { toast } = useToast();
// Показать уведомление:
toast({ title: "Файл загружен", variant: "default" });
toast({ title: "Ошибка", variant: "destructive" }); // красное
```

Работает через глобальный массив `listeners` и `memoryState` — это упрощённый менеджер состояния без Context.

---

### `use-mobile.ts`

Проверяет, является ли устройство мобильным (ширина экрана < 768px). Используется в компонентах Sidebar для адаптивной вёрстки.

```typescript
const isMobile = useIsMobile(); // true/false
```

---

## 7. Страницы

### `Editor.tsx` — главная страница

**Файл:** `client/src/pages/Editor.tsx`

Это самый большой файл — содержит всю логику редактора.

**Структура UI:**
```
Editor
├── <header>        — Топ-бар: логотип, название, кнопка Download
├── <div flex>
│   ├── <aside w-20>  — Вертикальная панель инструментов (иконки слева)
│   ├── <aside w-80>  — Панель инструмента (открывается при клике)
│   │   ├── Uploads   — Загрузка картинок + Recent Uploads
│   │   ├── Text      — Добавление текстовых блоков
│   │   ├── Background — Выбор цвета фона слайда
│   │   └── (Elements, Shapes, Charts — пока пустые)
│   └── <main>        — Область канваса
│       ├── SlideCanvas  — Сам слайд с элементами
│       └── Slide Strip  — Полоска слайдов внизу
```

**Локальный State в Editor:**

| State | Тип | Описание |
|---|---|---|
| `activeSlideId` | `number \| null` | ID выбранного слайда |
| `activeTool` | `Tool \| null` | Открытая боковая панель |
| `isSlideStripOpen` | `boolean` | Свёрнута ли нижняя полоска |
| `recentUploads` | `string[]` | Массив base64-картинок загруженных за сессию |

**Инструменты (tools):**
```typescript
type Tool = 'elements' | 'text' | 'uploads' | 'shapes' | 'background' | 'charts'
```

**Как работает загрузка картинок:**
1. Пользователь кликает "Upload media" или на зону drag&drop
2. Открывается нативный диалог выбора файла
3. `handleFileUpload` читает файл через `FileReader` → конвертирует в base64
4. base64 сохраняется в `recentUploads` (для превью) и добавляется на слайд как элемент типа `image`

---

## 8. Компоненты

### `SlideCanvas.tsx`

**Файл:** `client/src/components/editor/SlideCanvas.tsx`

Рендерит один слайд с интерактивными элементами.

**Как работает масштабирование:**
```typescript
// Слайд всегда 1024×576px (16:9)
// Но отображается в доступном пространстве
const scaleX = wrapperWidth / 1024;
const scaleY = wrapperHeight / 576;
const scale = Math.min(scaleX, scaleY, 1); // не больше 100%
// Применяется: transform: `scale(${scale})`
```

**Как работает drag & resize:**

Используется библиотека `react-rnd`:
```tsx
<Rnd
    position={{ x: style.x, y: style.y }}
    size={{ width: style.width, height: style.height }}
    scale={scale}  // важно! учитываем масштаб канваса
    onDragStop={(e, d) => {
        // d.x, d.y — новые координаты после перетаскивания
        handleUpdateStyle(el.id, { ...style, x: d.x, y: d.y });
    }}
    onResizeStop={(e, direction, ref, delta, position) => {
        handleUpdateStyle(el.id, {
            ...style,
            width: parseInt(ref.style.width),
            height: parseInt(ref.style.height),
            ...position
        });
    }}
>
```

**Типы элементов:**

- **text** — `<textarea>` с прозрачным фоном, редактируется двойным кликом
- **image** — `<img>` с base64 или URL в src. При ошибке загрузки показывает иконку-заглушку
- **shape** — `<div>` с цветным фоном

**Панель Properties:**

Появляется при клике на элемент. Позиционируется возле курсора, но не выходит за пределы экрана:
```typescript
let left = mouseX + 20;
let top = mouseY - 150;
// Если выходит за правый край:
if (left + 300 > window.innerWidth) left = mouseX - 300 - 20;
// Если выходит за нижний край:
if (top + popoverHeight > window.innerHeight) top = window.innerHeight - popoverHeight - 20;
```

---

### UI-компоненты (`components/ui/`)

Стандартные компоненты из библиотеки **shadcn/ui** на базе **Radix UI**.

Главные используемые:

| Компонент | Где используется |
|---|---|
| `Button` | Везде — кнопки |
| `Slider` | Панель Properties — opacity, rotation, font size |
| `Switch` | Панель Properties — Shadow, Bold |
| `ScrollArea` | Нижняя полоска слайдов, боковая панель |
| `Separator` | Разделитель в хедере |
| `Popover` | Не используется напрямую (заменён кастомным div) |

---

## 9. Точка входа (App.tsx)

Поскольку проект является Single Page Application без сложной навигации, внешней маршрутизации (роутинга) нет. Файл `App.tsx` просто оборачивает главный компонент `<Editor />` во все необходимые провайдеры контекста.

```typescript
function App() {
    return (
        <PresentationProvider>    {/* Глобальный State презентации */}
            <TooltipProvider>     {/* Контекст для всплывающих подсказок (shadcn) */}
                <div className="dark">
                    <Editor />    {/* Главная страница редактора */}
                </div>
                <Toaster />       {/* Контейнер для toast-уведомлений */}
            </TooltipProvider>
        </PresentationProvider>
    );
}
```

**Порядок обёрток важен!** `PresentationProvider` должен быть снаружи — тогда все компоненты внутри (включая `Editor` и `SlideCanvas`) могут использовать Context через хуки.

---

## 10. Конфигурация проекта

### `vite.config.ts`

```typescript
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": "./client/src",          // @/components/... → client/src/components/...
            "@assets": "./attached_assets" // @assets/image.png → attached_assets/image.png
        }
    },
    root: "./client",              // корень для HTML и публичных файлов
    build: { outDir: "../dist/public" },
    server: {
        fs: {
            allow: ["./client", "./attached_assets"]  // разрешаем файлы вне root
        }
    }
});
```

### `tailwind.config.ts`

Определяет кастомные токены дизайна:
- Шрифты: `Inter` (основной), `Plus Jakarta Sans` (заголовки)
- Цвета: через CSS-переменные (`--primary`, `--background` и т.д.)
- Тема меняется между светлой и тёмной через CSS-класс `.dark`

### `tsconfig.json`

```json
{
    "include": ["client/src/**/*"],  // только клиентский код
    "paths": {
        "@/*": ["./client/src/*"]    // алиас для импортов
    }
}
```

---

## 11. Поток данных — от клика до экрана

### Пример: пользователь добавляет текстовый блок

```
1. Пользователь кликает "Add a Heading" в боковой панели Text
         ↓
2. Editor.tsx вызывает handleAddElement('text', 'Add a Heading')
         ↓
3. handleAddElement вызывает createElementMutation.mutateAsync({
       slideId: activeSlideId,
       type: 'text',
       content: 'Add a Heading',
       style: { x:100, y:100, width:400, height:100, fontSize:32, ... }
   })
         ↓
4. useCreateElement() (хук) вызывает addElement() из Context
         ↓
5. PresentationContext.addElement() вызывает setPresentation()
   — добавляет новый элемент в массив elements нужного слайда
         ↓
6. React видит изменение state → перерисовывает компоненты
         ↓
7. Editor.tsx получает обновлённый activeSlide → передаёт в <SlideCanvas>
         ↓
8. SlideCanvas рендерит новый <Rnd> с <textarea> на канвасе
         ↓
9. Пользователь видит текстовый блок на слайде ✓
```

### Пример: пользователь перетаскивает элемент

```
1. Пользователь тащит элемент мышкой
         ↓
2. react-rnd обрабатывает MouseEvent
         ↓
3. onDragStop срабатывает с новыми координатами d.x, d.y
         ↓
4. SlideCanvas вызывает handleUpdateStyle(el.id, { ...style, x: d.x, y: d.y })
         ↓
5. handleUpdateStyle вызывает updateElementMutation.mutate()
         ↓
6. useUpdateElement() (хук) вызывает updateElement() из Context
         ↓
7. Context обновляет style элемента → setPresentation()
         ↓
8. React перерисовывает → элемент на новом месте ✓
```

---

## Часто задаваемые вопросы

**Q: Почему данные пропадают при обновлении страницы?**
A: Все данные хранятся в React `useState` — это оперативная память браузера. При обновлении страницы React перезапускается и state сбрасывается до начального значения. Чтобы сохранять данные, нужно добавить `localStorage`.

**Q: Откуда берётся начальный слайд с картинкой?**
A: Из `initialPresentation` в `PresentationContext.tsx` — это hardcoded объект, который используется как начальное значение `useState`.

**Q: Почему хуки возвращают `{ mutate }` и `{ mutateAsync }`?**
A: Это имитация интерфейса `@tanstack/react-query`, который использовался когда был бэкенд. Сохранено для совместимости — компоненты не пришлось переписывать.

**Q: Что такое `cn()` в UI-компонентах?**
A: Утилита из `lib/utils.ts`. Объединяет CSS-классы и разрешает конфликты Tailwind:
```typescript
cn("px-4 py-2", isActive && "bg-blue-500", className)
```
