import type { ProjectData } from 'grapesjs';
import {
  getPageDimensions,
  getPageSetupAttributes,
  normalizePageSetup,
  type PageSetup,
} from './pageSetup';

export const COVER_PAGE_WRAPPER_ATTR = 'data-cover-page';
export const COVER_PAGE_WRAPPER_VALUE = 'content';
export const COVER_PAGE_WRAPPER_SELECTOR = `[${COVER_PAGE_WRAPPER_ATTR}="${COVER_PAGE_WRAPPER_VALUE}"]`;

const COVER_PAGE_STYLE_TAG_ATTR = 'data-cover-page-styles';
const COVER_PAGE_STYLE_TAG_SELECTOR = `style[${COVER_PAGE_STYLE_TAG_ATTR}="true"]`;
const DEFAULT_FONT_STACK = '"Helvetica", Arial, sans-serif';

const STARTER_CONTENT = '';

type ParsedCoverPageBuilderState = {
  projectData: ProjectData | null;
  pageSetup: PageSetup | null;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const isProjectData = (value: unknown): value is ProjectData => {
  if (!isObject(value)) {
    return false;
  }

  return (
    Array.isArray(value.pages) ||
    Array.isArray(value.assets) ||
    Array.isArray(value.styles)
  );
};

const stringifyStyle = (style: Record<string, string>) =>
  Object.entries(style)
    .map(([key, value]) => `${key}:${value}`)
    .join(';');

const applyPageSetupToElement = (
  element: Element,
  pageSetup: PageSetup,
  styleOverrides?: Record<string, string>
) => {
  element.setAttribute(COVER_PAGE_WRAPPER_ATTR, COVER_PAGE_WRAPPER_VALUE);

  Object.entries(getPageSetupAttributes(pageSetup)).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  element.setAttribute(
    'style',
    stringifyStyle({
      ...getCoverPageWrapperStyleObject(pageSetup),
      ...styleOverrides,
    })
  );
};

const createWrapperDocument = (
  html: string,
  pageSetup: PageSetup,
  styleOverrides?: Record<string, string>
) => {
  const parser = new DOMParser();
  const dom = parser.parseFromString('', 'text/html');
  const wrapper = dom.createElement('div');

  wrapper.innerHTML = html.trim() ? html : STARTER_CONTENT;
  applyPageSetupToElement(wrapper, pageSetup, styleOverrides);
  dom.body.innerHTML = '';
  dom.body.appendChild(wrapper);

  return {
    dom,
    wrapper,
  };
};

export const getCoverPageWrapperStyleObject = (pageSetup: PageSetup) => {
  const { widthCm, heightCm } = getPageDimensions(pageSetup);

  return {
    'box-sizing': 'border-box',
    width: `${widthCm}cm`,
    'min-height': `${heightCm}cm`,
    height: `${heightCm}cm`,
    padding: `${pageSetup.margin.top}cm ${pageSetup.margin.right}cm ${pageSetup.margin.bottom}cm ${pageSetup.margin.left}cm`,
    'background-color': pageSetup.backgroundColor,
    position: 'relative',
    overflow: 'hidden',
    color: '#111827',
    'font-family': DEFAULT_FONT_STACK,
    'font-size': '14px',
    'line-height': '1.5',
  };
};

export const createDefaultCoverPageHtml = (pageSetup: PageSetup) => {
  const { wrapper } = createWrapperDocument('', pageSetup);
  return wrapper.outerHTML;
};

export const normalizeCoverPageCanvasHtml = (
  html: string,
  pageSetup: PageSetup
) => {
  if (!html.trim()) {
    return createDefaultCoverPageHtml(pageSetup);
  }

  const parser = new DOMParser();
  const dom = parser.parseFromString(html, 'text/html');
  const existingWrapper = dom.querySelector(COVER_PAGE_WRAPPER_SELECTOR);

  if (existingWrapper) {
    applyPageSetupToElement(existingWrapper, pageSetup);
    return existingWrapper.outerHTML;
  }

  const { wrapper } = createWrapperDocument(dom.body.innerHTML, pageSetup);
  return wrapper.outerHTML;
};

export const buildPersistedCoverPageHtml = ({
  html,
  css,
  pageSetup,
}: {
  html: string;
  css?: string;
  pageSetup: PageSetup;
}) => {
  const normalizedHtml = normalizeCoverPageCanvasHtml(html, pageSetup);
  const parser = new DOMParser();
  const dom = parser.parseFromString(normalizedHtml, 'text/html');
  const wrapper = dom.querySelector(COVER_PAGE_WRAPPER_SELECTOR);

  if (!wrapper) {
    return normalizedHtml;
  }

  wrapper.querySelectorAll(COVER_PAGE_STYLE_TAG_SELECTOR).forEach(node => {
    node.remove();
  });

  const trimmedCss = css?.trim();
  if (trimmedCss) {
    const styleElement = dom.createElement('style');
    styleElement.setAttribute(COVER_PAGE_STYLE_TAG_ATTR, 'true');
    styleElement.textContent = trimmedCss;
    wrapper.insertBefore(styleElement, wrapper.firstChild);
  }

  applyPageSetupToElement(wrapper, pageSetup);

  return wrapper.outerHTML;
};

/*-----------------------------------------------------------------
 Used to determine if the builder state from the template is valid 
 and can be loaded into the editor 
 ------------------------------------------------------------------*/
export const parseCoverPageBuilderState = (
  raw?: string | null
): ParsedCoverPageBuilderState => {
  if (!raw) {
    return { projectData: null, pageSetup: null };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (isProjectData(parsed)) {
      return { projectData: parsed, pageSetup: null };
    }

    if (!isObject(parsed)) {
      return { projectData: null, pageSetup: null };
    }

    const rawPageSetup = isObject(parsed.pageSetup) ? parsed.pageSetup : null;
    const pageSetup = rawPageSetup ? normalizePageSetup(rawPageSetup) : null;

    if (isProjectData(parsed.projectData)) {
      return {
        projectData: parsed.projectData,
        pageSetup,
      };
    }

    return {
      projectData: null,
      pageSetup,
    };
  } catch {
    return { projectData: null, pageSetup: null };
  }
};

export const serializeCoverPageBuilderState = (
  projectData: ProjectData,
  pageSetup: PageSetup
) =>
  JSON.stringify({
    builder: 'grapesjs',
    projectData,
    pageSetup,
  });
