// components/nodes/ImageNode.tsx
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';

import { $applyNodeReplacement, DecoratorNode } from 'lexical';
import { Suspense, lazy, type ReactElement } from 'react';

const ImageComponent = lazy(() => import('./ImageComponent'));

export type ImageAlignment = 'left' | 'center' | 'right';

export interface ImagePayload {
  altText: string;
  alignment?: ImageAlignment;
  height?: number;
  key?: NodeKey;
  maxWidth?: number;
  src: string;
  width?: number;
}

function convertImageElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLImageElement) {
    const { alt: altText, src, width, height } = domNode;
    const alignment = domNode.getAttribute('data-lexical-align');
    const parsedAlignment: ImageAlignment =
      alignment === 'center' || alignment === 'right' || alignment === 'left'
        ? alignment
        : 'left';
    const node = $createImageNode({
      altText,
      alignment: parsedAlignment,
      height,
      src,
      width,
    });
    return { node };
  }
  return null;
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    alignment?: ImageAlignment;
    height?: number;
    maxWidth?: number;
    src: string;
    width?: number;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<ReactElement> {
  __src: string;
  __altText: string;
  __width: 'inherit' | number;
  __height: 'inherit' | number;
  __maxWidth: number;
  __alignment: ImageAlignment;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__maxWidth,
      node.__width,
      node.__height,
      node.__alignment,
      node.__key
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, alignment, height, width, maxWidth, src } = serializedNode;
    const node = $createImageNode({
      altText,
      alignment,
      height,
      maxWidth,
      src,
      width,
    });
    return node;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    element.setAttribute('data-lexical-align', this.__alignment);
    if (this.__width !== 'inherit') {
      element.setAttribute('width', this.__width.toString());
    }
    if (this.__height !== 'inherit') {
      element.setAttribute('height', this.__height.toString());
    }
    element.style.display = 'block';
    element.style.maxWidth = `${this.__maxWidth}px`;
    if (this.__alignment === 'center') {
      element.style.marginLeft = 'auto';
      element.style.marginRight = 'auto';
    } else if (this.__alignment === 'right') {
      element.style.marginLeft = 'auto';
      element.style.marginRight = '0';
    } else {
      element.style.marginLeft = '0';
      element.style.marginRight = 'auto';
    }
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (_node: Node) => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    };
  }

  constructor(
    src: string,
    altText: string,
    maxWidth: number,
    width?: 'inherit' | number,
    height?: 'inherit' | number,
    alignment: ImageAlignment = 'left',
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__maxWidth = maxWidth || 800;
    this.__width = width || 'inherit';
    this.__height = height || 'inherit';
    this.__alignment = alignment;
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.getAltText(),
      alignment: this.__alignment,
      height: this.__height === 'inherit' ? 0 : this.__height,
      maxWidth: this.__maxWidth,
      src: this.getSrc(),
      type: 'image',
      version: 1,
      width: this.__width === 'inherit' ? 0 : this.__width,
    };
  }

  setWidthAndHeight(
    width: 'inherit' | number,
    height: 'inherit' | number
  ): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  setAlignment(alignment: ImageAlignment): void {
    const writable = this.getWritable();
    writable.__alignment = alignment;
  }

  // View

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  getWidth(): 'inherit' | number {
    return this.__width;
  }

  getHeight(): 'inherit' | number {
    return this.__height;
  }

  getMaxWidth(): number {
    return this.__maxWidth;
  }

  getAlignment(): ImageAlignment {
    return this.__alignment;
  }

  decorate(): ReactElement {
    return (
      <Suspense fallback={null}>
        <ImageComponent
          src={this.__src}
          altText={this.__altText}
          width={this.__width}
          height={this.__height}
          maxWidth={this.__maxWidth}
          alignment={this.__alignment}
          nodeKey={this.getKey()}
        />
      </Suspense>
    );
  }
}

export function $createImageNode({
  altText,
  alignment = 'left',
  height,
  maxWidth = 800,
  src,
  width,
  key,
}: ImagePayload): ImageNode {
  return $applyNodeReplacement(
    new ImageNode(src, altText, maxWidth, width, height, alignment, key)
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined
): node is ImageNode {
  return node instanceof ImageNode;
}
