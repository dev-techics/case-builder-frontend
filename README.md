# PDF Document Organizer & Bundler

A comprehensive React application for organizing, viewing, annotating, and bundling multiple PDF documents with advanced collaboration features including highlights, comments, and real-time annotations.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Features](#features)
- [Architecture](#architecture)
- [Feature Documentation](#feature-documentation)
  - [File Explorer](#file-explorer)
  - [Text Highlighting](#text-highlighting)
  - [Comment System](#comment-system)
- [Data Flow](#data-flow)
- [Redux State Management](#redux-state-management)
- [Getting Started](#getting-started)
- [Key Components](#key-components)
- [Development Guidelines](#development-guidelines)
- [Known Issues & Future Work](#known-issues--future-work)

## Overview

This project is a PDF document management and annotation tool that allows users to:
- Upload and organize multiple PDF files
- Create file hierarchies with folders
- Highlight text with color coding
- Add position-based comments
- View all documents in a unified editor
- Export bundled documents with annotations

## Project Structure

```
src/
├── app/
│   ├── hooks.ts              # Redux hooks (useAppDispatch, useAppSelector)
│   └── store.ts              # Redux store configuration
├── features/
│   ├── auth/
│   │   ├── components/       # Auth UI components
│   │   ├── hooks/            # Auth logic hooks
│   │   ├── services/         # Auth API services
│   │   └── types/            # Auth type definitions
│   │
│   ├── editor/
│   │   ├── components/
│   │   │   ├── Document.tsx              # PDF document renderer with text selection
│   │   │   ├── UploadFile.tsx            # File upload interface
│   │   │   └── ZoomControls.tsx          # PDF zoom controls
│   │   ├── hooks/
│   │   │   └── PdfWithHeaderFooter.tsx   # Hook for loading modified PDFs
│   │   ├── Editor.tsx                    # Main editor container
│   │   ├── editorSlice.ts                # Redux slice for editor state
│   │   ├── helpers.ts                    # Coordinate conversion utilities
│   │   └── types.ts                      # Editor type definitions
│   │
│   ├── file-explorer/
│   │   ├── components/
│   │   │   ├── FolderItem.tsx            # Folder component
│   │   │   ├── SortableFileItem.tsx      # Draggable file item
│   │   │   └── fileUploadHandler.tsx     # Upload logic
│   │   ├── FileExplorer.tsx              # File tree UI
│   │   ├── fileTreeSlice.ts              # Redux file tree state
│   │   └── types.ts                      # File explorer types
│   │
│   ├── properties-panel/
│   │   ├── components/
│   │   │   ├── Annotations.tsx           # View/manage annotations
│   │   │   ├── DocumentSettings.tsx      # Document settings
│   │   │   └── Exports.tsx               # Export options
│   │   ├── sidebar.tsx                   # Properties sidebar
│   │   └── types.ts                      # Properties types
│   │
│   ├── sidebar/
│   │   ├── components/
│   │   │   └── MainSidebar.tsx          # Main navigation sidebar
│   │   └── EditorSidebar.tsx            # Editor-specific sidebar
│   │
│   └── toolbar/
│       ├── components/
│       │   ├── ColorPicker.tsx           # Highlight color selection
│       │   ├── Comment.tsx               # Comment button in toolbar
│       │   ├── Highlight.tsx             # Highlight action handler
│       │   ├── HighlightOverlay.tsx      # Renders highlight overlays on PDF
│       │   ├── InputComment.tsx          # Comment input form
│       │   ├── CommentThread.tsx         # Individual comment display
│       │   └── CommentsSidebar.tsx       # Comments container
│       ├── Toolbar.tsx                   # Main toolbar (appears on text selection)
│       ├── toolbarSlice.ts               # Redux state for toolbar & comments
│       └── types/
│           └── SliceTypes.ts             # Toolbar & comment type definitions
│
├── lib/
│   ├── pdfCoordinateUtils.ts  # PDF coordinate calculation utilities
│   └── [other utilities]/
│
└── components/ui/              # Reusable UI components (Button, Input, etc.)
```

## Features

### 1. File Management
- Upload multiple PDF files
- Organize files in folders
- Drag-and-drop file reordering
- File preview and metadata

### 2. Text Highlighting
- Select text to highlight with color
- Store highlights with PDF coordinates
- Display highlights on page load
- Delete and manage highlights
- Highlight persistence across sessions

### 3. Comment System
- Add position-based comments on selected text
- Comments appear beside the document
- Edit, delete, and resolve comments
- Show selected text context in comments
- Auto-hide comments when no content exists
- Smooth scroll sync with document content

### 4. Document Viewer
- Multi-page PDF viewing
- Zoom controls
- Text layer support (searchable text)
- Scroll synchronization between documents
- Auto-select document based on scroll position

## Architecture

### State Management (Redux)

The application uses Redux for centralized state management with the following main slices:

```typescript
// Store structure
{
  fileTree: {
    tree: TreeNode,           // File/folder hierarchy
    selectedFile: string,     // Currently selected file ID
  },
  
  editor: {
    scale: number,            // PDF zoom level
    currentPage: number,      // Active page
  },
  
  toolbar: {
    ToolbarPosition: { x, y },           // Toolbar screen coordinates
    CommentPosition: { x, y },           // Comment input position
    pendingHighlight: PendingHighlight,  // Highlight being created
    pendingComment: PendingComment,      // Comment being created
    highlights: Highlight[],              // All highlights
    comments: Comment[],                  // All comments
  }
}
```

### Component Hierarchy

```
App
├── Sidebar (Navigation)
├── FileExplorer (File tree)
├── Editor (Main content area)
│   ├── PDFViewer (Scroll container)
│   │   ├── [For each file]
│   │   │   ├── TextHighlightableDocument
│   │   │   │   ├── Toolbar (for text selection)
│   │   │   │   ├── Document (PDF renderer)
│   │   │   │   │   ├── Page
│   │   │   │   │   └── InteractiveHighlightOverlay
│   │   │   │   └── InputComment (inline comment form)
│   │   │
│   │   ├── CommentsSidebar
│   │   │   └── [For each comment]
│   │   │       └── CommentThread
│   │
│   └── PropertiesPanel (Right sidebar)
└── InputComment (Global comment input)
```

## Feature Documentation

### File Explorer

**Location:** `features/file-explorer/`

**How it works:**
1. Files are stored as a tree structure in Redux (`fileTreeSlice.ts`)
2. `FileExplorer.tsx` renders the tree as a hierarchical UI
3. Users can drag files to reorder (handled by `SortableFileItem.tsx`)
4. Clicking a file selects it and updates the editor view

**Key types:**
```typescript
type TreeNode = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children: TreeNode[];
  parentId?: string;
}
```

---

### Text Highlighting

**Location:** `features/editor/` & `features/toolbar/`

**How it works:**

1. **Text Selection Detection** (in `Document.tsx`)
   - `handleMouseUp()` event detects when user finishes selecting text
   - Gets page element and calculates screen coordinates
   - Converts screen coordinates to PDF coordinates using `ScreenToPdfCoordinates()`

2. **Highlight Creation** (in toolbar)
   - User selects text → Toolbar appears above selection
   - User clicks color in ColorPicker → `addHighlight()` dispatched
   - Highlight stored in Redux with PDF coordinates

3. **Highlight Display** (in `InteractiveHighlightOverlay.tsx`)
   - For each page, fetches highlights from Redux
   - Converts PDF coordinates back to screen coordinates
   - Renders colored rectangles over text

**Key data structure:**
```typescript
type Highlight = {
  id: string;
  fileId: string;
  pageNumber: number;
  color: string;
  text: string;
  coordinates: {
    x: number;      // PDF coordinate
    y: number;      // PDF coordinate
    width: number;
    height: number;
  };
  createdAt: string;
}
```

**Coordinate System:**
- PDF coordinates: Relative to the PDF document (0,0 at top-left of page)
- Screen coordinates: Relative to browser viewport or container
- Conversion happens via `ScreenToPdfCoordinates()` and reverse logic

---

### Comment System

**Location:** `features/toolbar/components/` & `features/toolbar/types/`

**How it works:**

1. **Comment Creation Flow**
   ```
   User selects text
   → Toolbar appears
   → User clicks "Comment" button
   → InputComment form opens (in document)
   → User types and submits
   → Comment stored in Redux with position data
   → CommentThread renders in sidebar
   ```

2. **Position Calculation**
   - When comment is created, toolbar Y position is captured
   - Page element's position in viewport is calculated
   - `pageY = toolbarY - pageRect.top` (position relative to page)
   - Stored as: `{ x: 0, y: toolbarY (viewport), pageY (relative to page) }`

3. **Comment Display** (in `CommentThread.tsx`)
   - Queries DOM for page element by `data-file-id` and `data-page-number`
   - Gets page's current position in viewport
   - Recalculates: `absoluteTop = pageRect.top + pageY`
   - Positions comment using `fixed` or `absolute` positioning
   - Only renders if visible in viewport (performance optimization)

4. **Scroll Sync**
   - Listens to scroll events on `.pdf-viewer-container`
   - Recalculates position on each scroll
   - Comments stay aligned with their text automatically

**Key data structures:**
```typescript
type Comment = {
  id: string;
  fileId: string;
  pageNumber: number;
  text: string;
  selectedText?: string;
  position: {
    x: number;      // Always 0 for now
    y: number;      // Toolbar Y when created
    pageY: number;  // Position relative to page top
  };
  createdAt: string;
  updatedAt: string;
  resolved: boolean;
  author?: string;
}

type PendingComment = {
  fileId: string;
  pageNumber: number;
  selectedText?: string;
  position: {
    x: number;
    y: number;
    pageY: number;
  };
}
```

**Important:** Comments use `position.pageY` for positioning. This is the offset from the top of the page, ensuring comments stay aligned with text when scrolling.

---

## Data Flow

### Complete Flow: Text Selection to Comment Creation

```
1. USER SELECTS TEXT on page 2 of file-abc
   ↓
2. Document.handleMouseUp() fires
   - Finds selected page element
   - Calculates selection coordinates
   - Converts to PDF coordinates
   - Gets toolbar position (screen/viewport coords)
   ↓
3. Redux dispatch: setPendingHighlight()
   - Stores: { fileId, pageNumber, text, coordinates }
   ↓
4. Redux dispatch: setToolbarPosition()
   - Stores: { x: screenX, y: screenY }
   ↓
5. Toolbar component renders (inside Document)
   - Checks if pendingHighlight.fileId === file.id
   - If true, renders at toolbar position
   ↓
6. User clicks "Comment" button
   - Dispatches setCommentPosition()
   - Dispatches setPendingComment()
   ↓
7. InputComment form opens
   - User types comment text
   ↓
8. User submits
   - Dispatches addComment() with:
     {
       id: generated,
       fileId: from pendingHighlight,
       pageNumber: from pendingHighlight,
       text: user input,
       selectedText: from pendingHighlight,
       position: { x: 0, y: toolbarY, pageY: calculated },
       resolved: false
     }
   ↓
9. CommentThread renders in sidebar/container
   - Queries for page element by fileId & pageNumber
   - Calculates viewport position
   - Displays at correct location
```

---

## Redux State Management

### Key Slices

#### `editorSlice.ts`
- Manages PDF viewer state (zoom level, current page)
- Handles document selection

#### `fileTreeSlice.ts`
- Manages file/folder hierarchy
- Stores file selection state
- Handles file reordering

#### `toolbarSlice.ts`
- Manages toolbar visibility and position
- Manages pending highlights and comments
- Stores all highlights and comments
- Actions:
  - `setToolbarPosition()` - Position for toolbar
  - `setPendingHighlight()` - Highlight being created
  - `addHighlight()` - Save highlight
  - `removeHighlight()` - Delete highlight
  - `setCommentPosition()` - Position for comment input
  - `setPendingComment()` - Comment being created
  - `addComment()` - Save comment
  - `updateComment()` - Edit comment
  - `deleteComment()` - Delete comment
  - `toggleCommentResolved()` - Mark as resolved/unresolved

---

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- React 18+
- Redux Toolkit
- react-pdf library
- pdf-lib
- ultracite (code formater)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Setup

Create a `.env` file with:
```
VITE_API_URL=http://localhost:3000
VITE_ENV=development
```

---

## Key Components

### Document.tsx
**Responsibilities:**
- Render PDF pages
- Detect text selection
- Calculate and store selection coordinates
- Display toolbar on selection
- Display comment input

**Key functions:**
- `handleMouseUp()` - Detects text selection
- `getTextSelectionCoordinates()` - Gets selection bounding box
- `ScreenToPdfCoordinates()` - Converts coordinates

### Toolbar.tsx
**Responsibilities:**
- Display color picker and comment button
- Positioned at text selection location
- Only show for current file's selection

**Key props:**
- None (reads from Redux)

**Shows when:**
- `pendingHighlight` exists AND `fileId === file.id`

### CommentThread.tsx
**Responsibilities:**
- Display individual comment card
- Handle comment editing, deletion, resolution
- Calculate and maintain position during scrolling
- Show/hide based on viewport visibility

**Key logic:**
- `updatePosition()` hook - Recalculates position on scroll
- Queries DOM for page element
- Uses `getBoundingClientRect()` to get viewport position

### CommentsSidebar.tsx
**Responsibilities:**
- Container for all comments
- Filter comments by file
- Render list of CommentThread components

---

## Development Guidelines

### Adding a New Feature

1. **Create Redux Slice** (if needed)
   - Add to `features/[feature]/[feature]Slice.ts`
   - Define actions and reducers
   - Export actions and reducer

2. **Create Components**
   - Place in `features/[feature]/components/`
   - Use Redux hooks for state
   - Keep components focused and reusable

3. **Update Types**
   - Add TypeScript interfaces to `types.ts`
   - Export from index file

4. **Test Coordinate Logic**
   - Test with multiple pages
   - Test with different zoom levels
   - Test on different screen sizes

### Coordinate System Best Practices

- **Screen/Viewport coordinates:** Used for positioning UI elements (Toolbar, Comments)
- **PDF coordinates:** Used for storing data persistently
- **Container-relative coordinates:** Used internally for positioning within containers
- Always include the source coordinate system in variable names:
  ```typescript
  const toolbarY = 450;           // viewport Y
  const pageY = 150;              // relative to page top
  const pdfY = 850;               // PDF document Y
  ```

### Working with Comments

**When adding comment positioning logic:**
1. Always query by both `data-file-id` AND `data-page-number`
2. Use `getBoundingClientRect()` to get viewport-relative positions
3. Account for scroll offset when calculating final position
4. Listen to scroll events and recalculate on each scroll
5. Test across multiple files and pages

---

## Known Issues & Future Work

### Known Issues

1. **File Reordering**
   - If files are reordered after comments are created, comment positions may not update correctly
   - Workaround: Refresh page after reordering files
   - Fix: Store file order in Redux, use it in position calculations

2. **Comment Overlap**
   - Multiple comments at similar Y positions will overlap
   - No automatic collision detection or stacking

3. **Highlight Precision**
   - Highlights may not perfectly align with multi-line selections
   - Due to bounding box limitations

### Planned Features

- [ ] Comment search and filtering
- [ ] Highlight categories/tags
- [ ] Batch operations on highlights
- [ ] PDF export with annotations
- [ ] Comment export (as JSON/CSV)
- [ ] Undo/Redo for highlights and comments
- [ ] Keyboard shortcuts for common actions
- [ ] Dark mode support
- [ ] Collision detection for overlapping comments

### Performance Optimizations

- [ ] Virtualization for large comment lists (use react-window)
- [ ] Memoization of expensive calculations
- [ ] Lazy load page data
- [ ] Debounce scroll event handlers
- [ ] Image compression for thumbnails

---

## Contributing

When contributing to this project:
1. Follow the existing code structure
2. Add TypeScript types for all new data structures
3. Test with multiple files and pages
4. Update this README with any new features
5. Comment coordinate-related code thoroughly

---

## License

[]