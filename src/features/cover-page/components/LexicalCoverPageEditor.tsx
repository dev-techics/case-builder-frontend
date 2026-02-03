// components/LexicalCoverPageEditor.tsx
import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $insertNodes, type EditorState, type LexicalEditor } from 'lexical';

import ToolbarPlugin from './plugins/ToolbarPlugin';
import { ImagePlugin } from './plugins/ImagePlugin';
import { ImageNode } from './nodes/ImageNode';
import { setCoverPageHtml, setCoverPageLexicalJson } from '../redux/coverPageSlice';
import { Button } from '@/components/ui/button';
import CoverPagePreviewHtml from './CoverPagePreviewHtml';

interface LexicalCoverPageEditorProps {
  type: 'front' | 'back';
}

// Lexical theme configuration
const theme = {
  ltr: 'ltr',
  rtl: 'rtl',
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem',
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem',
  },
  image: 'editor-image',
  link: 'editor-link',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
    code: 'editor-text-code',
  },
  code: 'editor-code',
  codeHighlight: {
    atrule: 'editor-tokenAttr',
    attr: 'editor-tokenAttr',
    boolean: 'editor-tokenProperty',
    builtin: 'editor-tokenSelector',
    cdata: 'editor-tokenComment',
    char: 'editor-tokenSelector',
    class: 'editor-tokenFunction',
    'class-name': 'editor-tokenFunction',
    comment: 'editor-tokenComment',
    constant: 'editor-tokenProperty',
    deleted: 'editor-tokenProperty',
    doctype: 'editor-tokenComment',
    entity: 'editor-tokenOperator',
    function: 'editor-tokenFunction',
    important: 'editor-tokenVariable',
    inserted: 'editor-tokenSelector',
    keyword: 'editor-tokenAttr',
    namespace: 'editor-tokenVariable',
    number: 'editor-tokenProperty',
    operator: 'editor-tokenOperator',
    prolog: 'editor-tokenComment',
    property: 'editor-tokenProperty',
    punctuation: 'editor-tokenPunctuation',
    regex: 'editor-tokenVariable',
    selector: 'editor-tokenSelector',
    string: 'editor-tokenSelector',
    symbol: 'editor-tokenProperty',
    tag: 'editor-tokenProperty',
    url: 'editor-tokenOperator',
    variable: 'editor-tokenVariable',
  },
};

const COVER_PAGE_WRAPPER_ATTR = 'data-cover-page';
const COVER_PAGE_WRAPPER_VALUE = 'content';
const COVER_PAGE_BASE_STYLE = [
  'box-sizing:border-box',
  'width:100%',
  'height:100%',
  'padding:32px',
  'font-family:"Helvetica", Arial, sans-serif',
  'font-size:14px',
  'line-height:1.5',
  'color:#111827',
].join(';');

const TAG_INLINE_STYLES: Record<string, string> = {
  p: 'margin:0 0 12px 0',
  h1: 'margin:0 0 16px 0;font-size:24px;font-weight:700',
  h2: 'margin:0 0 14px 0;font-size:20px;font-weight:700',
  h3: 'margin:0 0 12px 0;font-size:18px;font-weight:600',
  h4: 'margin:0 0 10px 0;font-size:16px;font-weight:600',
  h5: 'margin:0 0 8px 0;font-size:14px;font-weight:600',
  ul: 'margin:0 0 12px 20px;padding:0',
  ol: 'margin:0 0 12px 20px;padding:0',
  li: 'margin:0 0 6px 0',
  blockquote:
    'margin:0 0 12px 0;padding:8px 12px;border-left:3px solid #e5e7eb;color:#4b5563',
  pre: 'margin:0 0 12px 0;padding:10px 12px;background:#f3f4f6;border-radius:4px;overflow:auto',
  code: 'font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;font-size:0.9em',
  a: 'color:#2563eb;text-decoration:underline',
  img: 'max-width:100%;height:auto',
};

const mergeInlineStyles = (existing: string | null, next: string) => {
  if (!existing) {
    return next;
  }
  const trimmed = existing.trim();
  return trimmed.endsWith(';') ? `${trimmed} ${next}` : `${trimmed}; ${next}`;
};

const inlineCoverPageHtml = (html: string) => {
  const parser = new DOMParser();
  const dom = parser.parseFromString(html || '', 'text/html');
  dom.body.querySelectorAll('*').forEach(element => {
    const style = TAG_INLINE_STYLES[element.tagName.toLowerCase()];
    if (style) {
      element.setAttribute(
        'style',
        mergeInlineStyles(element.getAttribute('style'), style)
      );
    }
  });

  const wrapper = dom.createElement('div');
  wrapper.setAttribute(COVER_PAGE_WRAPPER_ATTR, COVER_PAGE_WRAPPER_VALUE);
  wrapper.setAttribute('style', COVER_PAGE_BASE_STYLE);
  wrapper.innerHTML = dom.body.innerHTML;
  return wrapper.outerHTML;
};

const extractCoverPageHtml = (html: string) => {
  if (!html) {
    return '';
  }
  const parser = new DOMParser();
  const dom = parser.parseFromString(html, 'text/html');
  const wrapper = dom.querySelector(
    `[${COVER_PAGE_WRAPPER_ATTR}="${COVER_PAGE_WRAPPER_VALUE}"]`
  );
  return wrapper ? wrapper.innerHTML : html;
};

// Plugin to load initial HTML content or Lexical state
function LoadHtmlPlugin({
  html,
  lexicalJson,
}: {
  html: string;
  lexicalJson?: string | null;
}) {
  const [editor] = useLexicalComposerContext();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!isFirstRender.current) {
      return;
    }

    if (lexicalJson) {
      try {
        const editorState = editor.parseEditorState(lexicalJson);
        editor.setEditorState(editorState);
        isFirstRender.current = false;
        return;
      } catch (error) {
        console.error('Failed to parse lexical JSON, falling back to HTML', error);
      }
    }

    if (html) {
      editor.update(() => {
        const parser = new DOMParser();
        const normalizedHtml = extractCoverPageHtml(html);
        const dom = parser.parseFromString(normalizedHtml, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        $getRoot().clear();
        $getRoot().select();
        $insertNodes(nodes);
      });
    }

    isFirstRender.current = false;
  }, [editor, html, lexicalJson]);

  return null;
}

// Plugin to handle HTML + Lexical JSON changes
function OnChangeCoverPagePlugin({
  onHtmlChange,
  onLexicalChange,
}: {
  onHtmlChange: (html: string) => void;
  onLexicalChange: (lexicalJson: string) => void;
}) {
  const handleChange = (
    editorState: EditorState,
    lexicalEditor: LexicalEditor
  ) => {
    editorState.read(() => {
      const htmlString = $generateHtmlFromNodes(lexicalEditor);
      onHtmlChange(inlineCoverPageHtml(htmlString));
      onLexicalChange(JSON.stringify(editorState.toJSON()));
    });
  };

  return <OnChangePlugin onChange={handleChange} ignoreSelectionChange />;
}

const LexicalCoverPageEditor = ({ type }: LexicalCoverPageEditorProps) => {
  const dispatch = useAppDispatch();
  const {
    frontHtml,
    backHtml,
    frontLexicalJson,
    backLexicalJson,
    frontTemplateKey,
    backTemplateKey,
    templates,
  } = useAppSelector(state => state.coverPage);

  const html = type === 'front' ? frontHtml : backHtml;
  const lexicalJson = type === 'front' ? frontLexicalJson : backLexicalJson;
  const templateKey = type === 'front' ? frontTemplateKey : backTemplateKey;
  const template = templates.find(t => t.template_key === templateKey);

  const [showPreview, setShowPreview] = useState(false);

  const handleHtmlChange = (newHtml: string) => {
    dispatch(setCoverPageHtml({ type, html: newHtml }));
  };

  const handleLexicalChange = (lexicalState: string) => {
    dispatch(setCoverPageLexicalJson({ type, lexicalJson: lexicalState }));
  };

  const initialConfig = {
    namespace: `CoverPageEditor-${type}`,
    theme,
    onError: (error: Error) => {
      console.error('Lexical Error:', error);
    },
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode,
      ImageNode,
    ],
  };

  if (!template) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Template not found</p>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-6 lg:grid-cols-2">
      {/* Left: Editor */}
      <div className="order-1 overflow-hidden flex flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">
            Edit {type === 'front' ? 'Front' : 'Back'} Cover Page
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>

        <div className="flex-1 overflow-hidden border border-gray-200 rounded-lg bg-white">
          <LexicalComposer initialConfig={initialConfig}>
            <div className="editor-container h-full flex flex-col">
              <ToolbarPlugin />
              <div className="editor-inner flex-1 overflow-auto relative">
                <RichTextPlugin
                  contentEditable={
                    <ContentEditable className="editor-input min-h-full p-4 outline-none" />
                  }
                  placeholder={
                    <div className="editor-placeholder absolute top-4 left-4 text-gray-400 pointer-events-none">
                      Start typing your cover page content...
                    </div>
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />
                <OnChangeCoverPagePlugin
                  onHtmlChange={handleHtmlChange}
                  onLexicalChange={handleLexicalChange}
                />
                <LoadHtmlPlugin html={html || ''} lexicalJson={lexicalJson} />
                <HistoryPlugin />
                <AutoFocusPlugin />
                <LinkPlugin />
                <ListPlugin />
                <ImagePlugin />
                <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
              </div>
            </div>
          </LexicalComposer>
        </div>

        <p className="mt-2 text-gray-500 text-xs">
          Use the toolbar to format your cover page. Images and styles will be
          preserved in the PDF.
        </p>
      </div>

      {/* Right: Preview */}
      <div className="order-2 lg:order-2">
        {showPreview && (
          <div className="sticky top-6">
            <h3 className="mb-3 font-semibold text-gray-900 text-sm">
              Live Preview (A4)
            </h3>
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-auto max-h-[800px]">
              <CoverPagePreviewHtml type={type} html={html || ''} />
            </div>
            <p className="mt-2 text-gray-500 text-xs">
              This preview shows how your {type} cover page will appear in the
              final PDF
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LexicalCoverPageEditor;
