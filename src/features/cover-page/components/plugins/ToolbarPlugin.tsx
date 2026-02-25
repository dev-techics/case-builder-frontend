// components/plugins/ToolbarPlugin.tsx
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $isNodeSelection,
  $createParagraphNode,
  $getNodeByKey,
} from 'lexical';
import type { NodeKey } from 'lexical';
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
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Link,
  Image,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { INSERT_IMAGE_COMMAND } from './ImagePlugin';
import { $isImageNode, type ImageAlignment } from '../nodes/ImageNode';
import { Input } from '@/components/ui/input';

const LowPriority = 1;

const blockTypeToBlockName = {
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
};

const FONT_FAMILY_OPTIONS = [
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

const normalizeFontSize = (value: string) => {
  if (!value) {
    return '';
  }
  const match = value.match(/\d+(?:\.\d+)?/);
  return match ? match[0] : '';
};

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

type SelectedImage = {
  key: NodeKey;
  width: number | 'inherit';
  height: number | 'inherit';
  maxWidth: number;
  alignment: ImageAlignment;
};

function Divider() {
  return <Separator orientation="vertical" className="h-6 mx-1" />;
}

function BlockFormatDropDown({
  blockType,
  editor,
}: {
  blockType: keyof typeof blockTypeToBlockName;
  editor: any;
}) {
  const formatParagraph = () => {
    if (blockType !== 'paragraph') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createParagraphNode());
        }
      });
    }
  };

  const formatHeading = (headingSize: 'h1' | 'h2' | 'h3' | 'h4' | 'h5') => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createQuoteNode());
        }
      });
    }
  };

  const formatCode = () => {
    if (blockType !== 'code') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createCodeNode());
        }
      });
    }
  };

  return (
    <Select
      value={blockType}
      onValueChange={value => {
        switch (value) {
          case 'paragraph':
            formatParagraph();
            break;
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
            formatHeading(value);
            break;
          case 'bullet':
            formatBulletList();
            break;
          case 'number':
            formatNumberedList();
            break;
          case 'quote':
            formatQuote();
            break;
          case 'code':
            formatCode();
            break;
        }
      }}
    >
      <SelectTrigger className="w-[140px] h-8 text-xs">
        <SelectValue>{blockTypeToBlockName[blockType] || 'Normal'}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="paragraph">Normal</SelectItem>
        <SelectItem value="h1">Heading 1</SelectItem>
        <SelectItem value="h2">Heading 2</SelectItem>
        <SelectItem value="h3">Heading 3</SelectItem>
        <SelectItem value="bullet">Bulleted List</SelectItem>
        <SelectItem value="number">Numbered List</SelectItem>
        <SelectItem value="quote">Quote</SelectItem>
        <SelectItem value="code">Code Block</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] =
    useState<keyof typeof blockTypeToBlockName>('paragraph');
  const [fontFamily, setFontFamily] = useState('default');
  const [fontSize, setFontSize] = useState('');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
    null
  );

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setSelectedImage(null);
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      // Update text format
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
      setFontFamily(resolveFontFamilyValue(nextFontFamily));
      setFontSize(normalizeFontSize(nextFontSize));

      // Update links
      const node = selection.anchor.getNode();
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const listType = parentList
            ? parentList.getListType()
            : element.getListType();
          const normalizedListType = listType === 'check' ? 'bullet' : listType;
          setBlockType(normalizedListType);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          if (type in blockTypeToBlockName) {
            setBlockType(type as keyof typeof blockTypeToBlockName);
          }
        }
      }
    } else if ($isNodeSelection(selection)) {
      const node = selection.getNodes()[0];
      if ($isImageNode(node)) {
        setSelectedImage({
          key: node.getKey(),
          width: node.getWidth(),
          height: node.getHeight(),
          maxWidth: node.getMaxWidth(),
          alignment: node.getAlignment(),
        });
      } else {
        setSelectedImage(null);
      }
    } else {
      setSelectedImage(null);
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, _newEditor) => {
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

  const insertLink = useCallback(() => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://');
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
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

  const handleFontFamilyChange = useCallback(
    (nextValue: string) => {
      setFontFamily(nextValue);
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const cssValue = getFontFamilyCss(nextValue);
          $patchStyleText(selection, {
            'font-family': cssValue ? cssValue : null,
          });
        }
      });
    },
    [editor]
  );

  const handleFontSizeChange = useCallback(
    (nextValue: string) => {
      setFontSize(nextValue);
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return;
        }
        if (nextValue.trim() === '') {
          $patchStyleText(selection, { 'font-size': null });
          return;
        }
        const parsed = Number(nextValue);
        if (!Number.isNaN(parsed) && parsed > 0) {
          $patchStyleText(selection, { 'font-size': `${parsed}px` });
        }
      });
    },
    [editor]
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

  const handleAlign = useCallback(
    (alignment: ImageAlignment) => {
      if (selectedImage) {
        setImageAlignment(alignment);
        return;
      }
      editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
    },
    [editor, selectedImage, setImageAlignment]
  );

  const imageWidthValue =
    selectedImage && selectedImage.width !== 'inherit'
      ? selectedImage.width
      : '';

  return (
    <div
      className="toolbar border-b border-gray-200 p-2 flex items-center gap-1 flex-wrap bg-gray-50"
      ref={toolbarRef}
    >
      {/* ------- Undo -------*/}
      <Button
        variant="ghost"
        size="sm"
        disabled={!canUndo}
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        className="h-8 w-8 p-0"
        aria-label="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>
      {/* ------- Redo ------ */}
      <Button
        variant="ghost"
        size="sm"
        disabled={!canRedo}
        onClick={() => {
          editor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        className="h-8 w-8 p-0"
        aria-label="Redo"
      >
        <Redo className="h-4 w-4" />
      </Button>

      <Divider />
      <BlockFormatDropDown blockType={blockType} editor={editor} />
      <Divider />
      <Select
        value={fontFamily}
        onValueChange={handleFontFamilyChange}
        disabled={!!selectedImage}
      >
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="Font" />
        </SelectTrigger>
        <SelectContent>
          {FONT_FAMILY_OPTIONS.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={8}
          className="h-8 w-16 px-2 text-xs"
          value={fontSize}
          onChange={event => handleFontSizeChange(event.target.value)}
          placeholder="Size"
          disabled={!!selectedImage}
        />
        <span className="text-[10px] text-gray-500">px</span>
      </div>
      <Divider />
      {/* ------- Bold ---------- */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
        }}
        className={`h-8 w-8 p-0 ${isBold ? 'bg-gray-200' : ''}`}
        aria-label="Format Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      {/* ------- Italic -------- */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        }}
        className={`h-8 w-8 p-0 ${isItalic ? 'bg-gray-200' : ''}`}
        aria-label="Format Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      {/* ------- Underline -------- */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
        }}
        className={`h-8 w-8 p-0 ${isUnderline ? 'bg-gray-200' : ''}`}
        aria-label="Format Underline"
      >
        <Underline className="h-4 w-4" />
      </Button>
      {/* --------- Strike through -------- */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
        }}
        className={`h-8 w-8 p-0 ${isStrikethrough ? 'bg-gray-200' : ''}`}
        aria-label="Format Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      {/* --------- code --------- */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
        }}
        className={`h-8 w-8 p-0 ${isCode ? 'bg-gray-200' : ''}`}
        aria-label="Format Code"
      >
        <Code className="h-4 w-4" />
      </Button>
      {/* ---------- link ---------- */}
      <Button
        variant="ghost"
        size="sm"
        onClick={insertLink}
        className={`h-8 w-8 p-0 ${isLink ? 'bg-gray-200' : ''}`}
        aria-label="Insert Link"
      >
        <Link className="h-4 w-4" />
      </Button>

      <Divider />
      {/* -------- Align Left --------- */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          handleAlign('left');
        }}
        className={`h-8 w-8 p-0 ${
          selectedImage?.alignment === 'left' ? 'bg-gray-200' : ''
        }`}
        aria-label="Left Align"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      {/* --------- Align Center -------- */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          handleAlign('center');
        }}
        className={`h-8 w-8 p-0 ${
          selectedImage?.alignment === 'center' ? 'bg-gray-200' : ''
        }`}
        aria-label="Center Align"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      {/* -------- Align Right -------- */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          handleAlign('right');
        }}
        className={`h-8 w-8 p-0 ${
          selectedImage?.alignment === 'right' ? 'bg-gray-200' : ''
        }`}
        aria-label="Right Align"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      {/* ------- Align Justify -------- */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
        }}
        className="h-8 w-8 p-0"
        aria-label="Justify Align"
      >
        <AlignJustify className="h-4 w-4" />
      </Button>
      <Divider />
      {/* ------- Image ----------- */}
      <Button
        variant="ghost"
        size="sm"
        onClick={insertImage}
        className="h-8 w-8 p-0"
        aria-label="Insert Image"
      >
        <Image className="h-4 w-4" />
      </Button>
      {selectedImage && (
        <>
          <Divider />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Width</span>
            <Input
              type="number"
              min={50}
              className="h-8 w-20 px-2 text-xs"
              value={imageWidthValue}
              onChange={event => {
                const nextValue = event.target.value;
                if (nextValue === '') {
                  setImageWidth('inherit');
                  return;
                }
                const parsed = Number(nextValue);
                if (!Number.isNaN(parsed) && parsed > 0) {
                  setImageWidth(parsed);
                }
              }}
              placeholder="Auto"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setImageWidth('inherit')}
            >
              Auto
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
