import { COVER_PAGE_WRAPPER_SELECTOR } from '../../../utils/grapesBuilder';

export type LibraryPanel = 'blocks' | 'layers';
export type InspectorPanel = 'styles' | 'traits';

/*------------------------------------------------
  Styles applied to the canvas iframe 
  to ensure the cover page is displayed correctly 
  and provides a good editing experience.
-------------------------------------------------*/
export const CANVAS_FRAME_STYLES = `
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-height: 100vh;
    /* clamp keeps padding proportional on narrow viewports */
    padding: clamp(12px, 3vw, 32px);
    background: #e5e7eb;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: Helvetica, Arial, sans-serif;
  }

  ${COVER_PAGE_WRAPPER_SELECTOR} {
    box-shadow: 0 20px 45px rgba(15, 23, 42, 0.16);
  }
`;

/*--------------------------------------------------------------------------------
  Configuration for the style manager sectors in the right inspector panel.
  Each sector groups related CSS properties together for a better user experience.
----------------------------------------------------------------------------------*/
export const STYLE_MANAGER_SECTORS = [
  {
    name: 'Typography',
    open: true,
    properties: [
      'font-family',
      'font-size',
      'font-weight',
      'letter-spacing',
      'line-height',
      'color',
      'text-align',
      'text-transform',
      'text-decoration',
    ],
  },
  {
    name: 'Spacing',
    open: false,
    properties: ['margin', 'padding'],
  },
  {
    name: 'Dimensions',
    open: false,
    properties: ['width', 'height', 'min-height', 'max-width'],
  },
  {
    name: 'Decorations',
    open: false,
    properties: [
      'background-color',
      'border',
      'border-radius',
      'box-shadow',
      'opacity',
    ],
  },
  {
    name: 'Layout',
    open: false,
    properties: [
      'display',
      'position',
      'top',
      'right',
      'bottom',
      'left',
      'flex-direction',
      'justify-content',
      'align-items',
      'gap',
    ],
  },
];

/*------------------------------------------------------------------------------------------------------------
  Flags for the root component of the GrapesJS editor.
  These settings ensure that the root component (which represents the entire canvas)
  cannot be accidentally modified or removed by the user, preserving the integrity of the cover page structure.
---------------------------------------------------------------------------------------------------------------*/
export const ROOT_COMPONENT_FLAGS = {
  removable: false,
  draggable: false,
  copyable: false,
  badgable: false,
  selectable: false,
  hoverable: false,
  stylable: false,
  toolbar: [],
};
