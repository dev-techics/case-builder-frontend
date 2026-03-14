export type PageOrientation = 'portrait' | 'landscape';
export type PageSizeId = 'letter' | 'a4' | 'legal';

export type PageMargin = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type PageSetup = {
  orientation: PageOrientation;
  size: PageSizeId;
  margin: PageMargin;
  backgroundColor: string;
};

type PageSize = {
  id: PageSizeId;
  label: string;
  widthCm: number;
  heightCm: number;
};

export const PAGE_SIZES: PageSize[] = [
  {
    id: 'letter',
    label: 'Letter (21.6 cm x 27.9 cm)',
    widthCm: 21.59,
    heightCm: 27.94,
  },
  {
    id: 'a4',
    label: 'A4 (21.0 cm x 29.7 cm)',
    widthCm: 21,
    heightCm: 29.7,
  },
  {
    id: 'legal',
    label: 'Legal (21.6 cm x 35.6 cm)',
    widthCm: 21.59,
    heightCm: 35.56,
  },
];

export const DEFAULT_PAGE_SETUP: PageSetup = {
  orientation: 'portrait',
  size: 'letter',
  margin: {
    top: 2.54,
    right: 2.54,
    bottom: 2.54,
    left: 2.54,
  },
  backgroundColor: '#ffffff',
};

const isOrientation = (value: string): value is PageOrientation =>
  value === 'portrait' || value === 'landscape';

const isPageSize = (value: string): value is PageSizeId =>
  PAGE_SIZES.some(size => size.id === value);

const coerceNumber = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const clamp = (value: number, min = 0) => (value < min ? min : value);

export const normalizePageSetup = (
  input?: Partial<PageSetup> | null
): PageSetup => {
  if (!input) {
    return DEFAULT_PAGE_SETUP;
  }

  const orientation =
    input.orientation && isOrientation(input.orientation)
      ? input.orientation
      : DEFAULT_PAGE_SETUP.orientation;

  const size = input.size && isPageSize(input.size)
    ? input.size
    : DEFAULT_PAGE_SETUP.size;

  const margin = {
    top: clamp(coerceNumber(input.margin?.top, DEFAULT_PAGE_SETUP.margin.top)),
    right: clamp(
      coerceNumber(input.margin?.right, DEFAULT_PAGE_SETUP.margin.right)
    ),
    bottom: clamp(
      coerceNumber(input.margin?.bottom, DEFAULT_PAGE_SETUP.margin.bottom)
    ),
    left: clamp(
      coerceNumber(input.margin?.left, DEFAULT_PAGE_SETUP.margin.left)
    ),
  };

  const backgroundColor =
    typeof input.backgroundColor === 'string' && input.backgroundColor.trim()
      ? input.backgroundColor
      : DEFAULT_PAGE_SETUP.backgroundColor;

  return {
    orientation,
    size,
    margin,
    backgroundColor,
  };
};

export const getPageSize = (sizeId: PageSizeId) =>
  PAGE_SIZES.find(size => size.id === sizeId) ?? PAGE_SIZES[0];

export const getPageDimensions = (setup: PageSetup) => {
  const { widthCm, heightCm } = getPageSize(setup.size);
  return setup.orientation === 'portrait'
    ? { widthCm, heightCm }
    : { widthCm: heightCm, heightCm: widthCm };
};

const parseCmValue = (value?: string | null) => {
  if (!value) {
    return null;
  }
  const match = value.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }
  const parsed = Number(match[0]);
  return Number.isNaN(parsed) ? null : parsed;
};

const getAttribute = (element: Element | null, name: string) =>
  element?.getAttribute(name) ?? null;

const hasPageSetupAttributes = (element: Element | null) => {
  if (!element) {
    return false;
  }
  return (
    element.hasAttribute('data-page-size') ||
    element.hasAttribute('data-page-orientation') ||
    element.hasAttribute('data-page-margin-top') ||
    element.hasAttribute('data-page-background')
  );
};

export const extractPageSetupFromHtml = (
  html: string,
  wrapperSelector: string
) => {
  if (!html) {
    return null;
  }
  const parser = new DOMParser();
  const dom = parser.parseFromString(html, 'text/html');
  const wrapper = dom.querySelector(wrapperSelector);

  if (!hasPageSetupAttributes(wrapper)) {
    return null;
  }

  const orientationAttribute = getAttribute(wrapper, 'data-page-orientation');
  const sizeAttribute = getAttribute(wrapper, 'data-page-size');
  const backgroundColor = getAttribute(wrapper, 'data-page-background');
  const orientation =
    orientationAttribute && isOrientation(orientationAttribute)
      ? orientationAttribute
      : undefined;
  const size =
    sizeAttribute && isPageSize(sizeAttribute) ? sizeAttribute : undefined;
  const margin = {
    top:
      parseCmValue(getAttribute(wrapper, 'data-page-margin-top')) ??
      DEFAULT_PAGE_SETUP.margin.top,
    right:
      parseCmValue(getAttribute(wrapper, 'data-page-margin-right')) ??
      DEFAULT_PAGE_SETUP.margin.right,
    bottom:
      parseCmValue(getAttribute(wrapper, 'data-page-margin-bottom')) ??
      DEFAULT_PAGE_SETUP.margin.bottom,
    left:
      parseCmValue(getAttribute(wrapper, 'data-page-margin-left')) ??
      DEFAULT_PAGE_SETUP.margin.left,
  };

  return normalizePageSetup({
    orientation,
    size,
    backgroundColor: backgroundColor ?? undefined,
    margin,
  });
};

export const getPageSetupAttributes = (setup: PageSetup) => {
  const { widthCm, heightCm } = getPageDimensions(setup);

  return {
    'data-page-orientation': setup.orientation,
    'data-page-size': setup.size,
    'data-page-width': `${widthCm}cm`,
    'data-page-height': `${heightCm}cm`,
    'data-page-margin-top': `${setup.margin.top}cm`,
    'data-page-margin-right': `${setup.margin.right}cm`,
    'data-page-margin-bottom': `${setup.margin.bottom}cm`,
    'data-page-margin-left': `${setup.margin.left}cm`,
    'data-page-background': setup.backgroundColor,
  };
};

export const getPageSetupStyle = (setup: PageSetup) => {
  const { widthCm, heightCm } = getPageDimensions(setup);
  return [
    `background-color:${setup.backgroundColor}`,
    `width:${widthCm}cm`,
    `height:${heightCm}cm`,
    `padding:${setup.margin.top}cm ${setup.margin.right}cm ${setup.margin.bottom}cm ${setup.margin.left}cm`,
  ].join(';');
};
