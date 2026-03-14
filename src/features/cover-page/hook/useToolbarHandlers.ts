// hook/useToolbarHandlers.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  type LexicalEditor,
  type NodeKey,
  type RangeSelection,
  type TextFormatType,
} from 'lexical';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
  $wrapNodes,
} from '@lexical/selection';
import { $getNearestNodeOfType, mergeRegister } from '@lexical/utils';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from '@lexical/list';
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
} from '@lexical/rich-text';
import { $createCodeNode } from '@lexical/code';

import { INSERT_IMAGE_COMMAND } from '../components/plugins/ImagePlugin';
import {
  $isImageNode,
  type ImageAlignment,
} from '../components/nodes/ImageNode';

const LowPriority = 1;

// Human-friendly labels for block formatting options.
export const blockTypeToBlockName = {
  code: 'Code Block',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  number: 'Numbered List',
  paragraph: 'Normal',
  quote: 'Quote',
  bullet: 'Bulleted List',
} as const;

export type BlockType = keyof typeof blockTypeToBlockName;

type FontFamilyOption = {
  label: string;
  value: string;
  css: string;
  matches: string[];
};

// Font families shown in the toolbar dropdown.
export const FONT_FAMILY_OPTIONS: FontFamilyOption[] = [
  {
    label: 'Default',
    value: 'default',
    css: '',
    matches: [],
  },
  {
    label: 'Arial',
    value: 'arial',
    css: 'Arial, Helvetica, sans-serif',
    matches: ['arial'],
  },
  {
    label: 'Times New Roman',
    value: 'times-new-roman',
    css: '"Times New Roman", Times, serif',
    matches: ['times new roman'],
  },
  {
    label: 'Georgia',
    value: 'georgia',
    css: 'Georgia, serif',
    matches: ['georgia'],
  },
  {
    label: 'Garamond',
    value: 'garamond',
    css: 'Garamond, serif',
    matches: ['garamond'],
  },
  {
    label: 'Verdana',
    value: 'verdana',
    css: 'Verdana, Geneva, sans-serif',
    matches: ['verdana'],
  },
  {
    label: 'Tahoma',
    value: 'tahoma',
    css: 'Tahoma, Geneva, sans-serif',
    matches: ['tahoma'],
  },
  {
    label: 'Courier New',
    value: 'courier-new',
    css: '"Courier New", Courier, monospace',
    matches: ['courier new', 'courier'],
  },
];

const normalizeFontFamily = (value: string) =>
  value.replace(/['"]/g, '').toLowerCase();

// Map a computed font-family string back to one of our dropdown values.
const resolveFontFamilyValue = (styleValue: string) => {
  if (!styleValue) {
    return 'default';
  }
  const normalized = normalizeFontFamily(styleValue);
  const match = FONT_FAMILY_OPTIONS.find(option =>
    option.matches.some(token => normalized.includes(token))
  );
  return match ? match.value : 'default';
};

const getFontFamilyCss = (value: string) =>
  FONT_FAMILY_OPTIONS.find(option => option.value === value)?.css ?? '';

// Keep font-size inputs simple (numbers only for the input field).
const normalizeFontSize = (value: string) => {
  if (!value) {
    return '';
  }
  const match = value.match(/\d+(?:\.\d+)?/);
  return match ? match[0] : '';
};

// Line-height can be unitless or include units; normalize to the numeric part.
const normalizeLineHeight = (value: string) => {
  if (!value) {
    return '';
  }
  const match = value.match(/\d+(?:\.\d+)?/);
  return match ? match[0] : '';
};

// Normalize user-provided image URLs so Lexical always gets a full URL.
const normalizeImageUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (/^(data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^\/\//.test(trimmed)) {
    return `https:${trimmed}`;
  }
  return `https://${trimmed}`;
};

const isBlockType = (value: string): value is BlockType =>
  Object.prototype.hasOwnProperty.call(blockTypeToBlockName, value);

export type SelectedImage = {
  key: NodeKey;
  width: number | 'inherit';
  height: number | 'inherit';
  maxWidth: number;
  alignment: ImageAlignment;
};

type ToolbarState = {
  canUndo: boolean;
  canRedo: boolean;
  blockType: BlockType;
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  isCode: boolean;
  isLink: boolean;
  selectedImage: SelectedImage | null;
};

type ToolbarActions = {
  undo: () => void;
  redo: () => void;
  formatText: (format: TextFormatType) => void;
  toggleLink: () => void;
  insertImage: () => void;
  setFontFamily: (nextValue: string) => void;
  setFontSize: (nextValue: string) => void;
  setLineHeight: (nextValue: string) => void;
  applyBlockType: (nextType: BlockType) => void;
  align: (alignment: ImageAlignment) => void;
  justify: () => void;
  setImageWidthFromInput: (nextValue: string) => void;
  resetImageWidth: () => void;
};

type ToolbarDerived = {
  isImageSelected: boolean;
  imageWidthValue: number | '';
};

type ToolbarHandlersResult = {
  state: ToolbarState;
  actions: ToolbarActions;
  derived: ToolbarDerived;
};

export const useToolbarHandlers = (
  editor: LexicalEditor
): ToolbarHandlersResult => {
  // Toolbar state mirrored from the editor selection and history.
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] = useState<BlockType>('paragraph');
  const [fontFamily, setFontFamilyState] = useState('default');
  const [fontSize, setFontSizeState] = useState('');
  const [lineHeight, setLineHeightState] = useState('');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
    null
  );
  const lastSelectionRef = useRef<RangeSelection | null>(null);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      // Persist the latest range selection so toolbar inputs can still apply styles.
      lastSelectionRef.current = selection.clone();
      // Text selection: clear image state and sync text formatting details.
      setSelectedImage(null);

      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      // Inline text styles.
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));

      const nextFontFamily = $getSelectionStyleValueForProperty(
        selection,
        'font-family',
        ''
      );
      const nextFontSize = $getSelectionStyleValueForProperty(
        selection,
        'font-size',
        ''
      );
      const nextLineHeight = $getSelectionStyleValueForProperty(
        selection,
        'line-height',
        ''
      );
      setFontFamilyState(resolveFontFamilyValue(nextFontFamily));
      setFontSizeState(normalizeFontSize(nextFontSize));
      setLineHeightState(normalizeLineHeight(nextLineHeight));

      // Link state depends on the current node or its parent.
      const node = selection.anchor.getNode();
      const parent = node.getParent();
      setIsLink($isLinkNode(parent) || $isLinkNode(node));

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const listType = parentList
            ? parentList.getListType()
            : element.getListType();
          const normalizedListType = listType === 'check' ? 'bullet' : listType;
          setBlockType(normalizedListType as BlockType);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          if (isBlockType(type)) {
            setBlockType(type);
          }
        }
      }

      return;
    }

    if ($isNodeSelection(selection)) {
      // Node selection: show image sizing/align controls when an image is selected.
      const node = selection.getNodes()[0];
      if ($isImageNode(node)) {
        setSelectedImage({
          key: node.getKey(),
          width: node.getWidth(),
          height: node.getHeight(),
          maxWidth: node.getMaxWidth(),
          alignment: node.getAlignment(),
        });
        return;
      }
    }

    // Default fallback when no supported selection is detected.
    setSelectedImage(null);
  }, [editor]);

  useEffect(() => {
    // Keep toolbar state in sync with editor updates and history changes.
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        payload => {
          setCanUndo(payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        payload => {
          setCanRedo(payload);
          return false;
        },
        LowPriority
      )
    );
  }, [editor, updateToolbar]);

  // ---- Toolbar actions ----
  const undo = useCallback(() => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  }, [editor]);

  const redo = useCallback(() => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  }, [editor]);

  const formatText = useCallback(
    (format: TextFormatType) => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    },
    [editor]
  );

  const toggleLink = useCallback(() => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, isLink ? null : 'https://');
  }, [editor, isLink]);

  const insertImage = useCallback(() => {
    const url = prompt('Enter image URL:');
    if (!url) {
      return;
    }
    const normalized = normalizeImageUrl(url);
    if (!normalized) {
      return;
    }
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
      altText: 'Image',
      src: normalized,
    });
  }, [editor]);

  const setFontFamily = useCallback(
    (nextValue: string) => {
      setFontFamilyState(nextValue);
      editor.update(() => {
        const selection = $getSelection();
        const targetSelection = $isRangeSelection(selection)
          ? selection
          : lastSelectionRef.current?.clone();
        if (!targetSelection) {
          return;
        }
        const cssValue = getFontFamilyCss(nextValue);
        $patchStyleText(targetSelection, {
          'font-family': cssValue ? cssValue : null,
        });
      });
    },
    [editor]
  );

  const setFontSize = useCallback(
    (nextValue: string) => {
      setFontSizeState(nextValue);
      editor.update(() => {
        const selection = $getSelection();
        const targetSelection = $isRangeSelection(selection)
          ? selection
          : lastSelectionRef.current?.clone();
        if (!targetSelection) {
          return;
        }
        if (nextValue.trim() === '') {
          // Clearing the input removes the font-size style.
          $patchStyleText(targetSelection, { 'font-size': null });
          return;
        }
        const parsed = Number(nextValue);
        if (!Number.isNaN(parsed) && parsed > 0) {
          $patchStyleText(targetSelection, { 'font-size': `${parsed}px` });
        }
      });
    },
    [editor]
  );

  const setLineHeight = useCallback(
    (nextValue: string) => {
      setLineHeightState(nextValue);
      editor.update(() => {
        const selection = $getSelection();
        const targetSelection = $isRangeSelection(selection)
          ? selection
          : lastSelectionRef.current?.clone();
        if (!targetSelection) {
          return;
        }
        if (nextValue.trim() === '') {
          $patchStyleText(targetSelection, { 'line-height': null });
          return;
        }
        const parsed = Number(nextValue);
        if (!Number.isNaN(parsed) && parsed > 0) {
          $patchStyleText(targetSelection, { 'line-height': `${parsed}` });
        }
      });
    },
    [editor]
  );

  const applyBlockType = useCallback(
    (nextType: BlockType) => {
      switch (nextType) {
        case 'paragraph':
          if (blockType !== 'paragraph') {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $wrapNodes(selection, () => $createParagraphNode());
              }
            });
          }
          break;
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
          if (blockType !== nextType) {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $wrapNodes(selection, () => $createHeadingNode(nextType));
              }
            });
          }
          break;
        case 'bullet':
          if (blockType !== 'bullet') {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
          } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
          }
          break;
        case 'number':
          if (blockType !== 'number') {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
          } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
          }
          break;
        case 'quote':
          if (blockType !== 'quote') {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $wrapNodes(selection, () => $createQuoteNode());
              }
            });
          }
          break;
        case 'code':
          if (blockType !== 'code') {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $wrapNodes(selection, () => $createCodeNode());
              }
            });
          }
          break;
      }
    },
    [blockType, editor]
  );

  const setImageAlignment = useCallback(
    (alignment: ImageAlignment) => {
      if (!selectedImage) {
        return;
      }
      editor.update(() => {
        const node = $getNodeByKey(selectedImage.key);
        if ($isImageNode(node)) {
          node.setAlignment(alignment);
        }
      });
    },
    [editor, selectedImage]
  );

  const align = useCallback(
    (alignment: ImageAlignment) => {
      if (selectedImage) {
        setImageAlignment(alignment);
        return;
      }
      editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
    },
    [editor, selectedImage, setImageAlignment]
  );

  const justify = useCallback(() => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
  }, [editor]);

  const setImageWidth = useCallback(
    (width: number | 'inherit') => {
      if (!selectedImage) {
        return;
      }
      editor.update(() => {
        const node = $getNodeByKey(selectedImage.key);
        if ($isImageNode(node)) {
          node.setWidthAndHeight(width, 'inherit');
        }
      });
    },
    [editor, selectedImage]
  );

  const setImageWidthFromInput = useCallback(
    (nextValue: string) => {
      if (nextValue === '') {
        setImageWidth('inherit');
        return;
      }
      const parsed = Number(nextValue);
      if (!Number.isNaN(parsed) && parsed > 0) {
        setImageWidth(parsed);
      }
    },
    [setImageWidth]
  );

  const resetImageWidth = useCallback(() => {
    setImageWidth('inherit');
  }, [setImageWidth]);

  return {
    state: {
      canUndo,
      canRedo,
      blockType,
      fontFamily,
      fontSize,
      lineHeight,
      isBold,
      isItalic,
      isUnderline,
      isStrikethrough,
      isCode,
      isLink,
      selectedImage,
    },
    actions: {
      undo,
      redo,
      formatText,
      toggleLink,
      insertImage,
      setFontFamily,
      setFontSize,
      setLineHeight,
      applyBlockType,
      align,
      justify,
      setImageWidthFromInput,
      resetImageWidth,
    },
    derived: {
      isImageSelected: Boolean(selectedImage),
      imageWidthValue:
        selectedImage && selectedImage.width !== 'inherit'
          ? selectedImage.width
          : '',
    },
  };
};
