import type { Component, Editor } from 'grapesjs';
import {
  COVER_PAGE_WRAPPER_ATTR,
  COVER_PAGE_WRAPPER_VALUE,
  getCoverPageWrapperStyleObject,
} from '../../../utils/grapesBuilder';
import {
  getPageSetupAttributes,
  type PageSetup,
} from '../../../utils/pageSetup';
import { ROOT_COMPONENT_FLAGS } from './config';

// Recursively search for the component with the specific attribute that identifies the cover page root.
const findRootByAttribute = (component: Component): Component | null => {
  const attributes = component.getAttributes();
  if (attributes[COVER_PAGE_WRAPPER_ATTR] === COVER_PAGE_WRAPPER_VALUE) {
    return component;
  }

  for (const child of component.components().models as Component[]) {
    const match = findRootByAttribute(child);
    if (match) {
      return match;
    }
  }

  return null;
};

// Find the root component of the cover page in the editor. This is the component that wraps the entire canvas and has specific attributes to identify it.
export const findCoverPageRoot = (editor: Editor) => {
  const wrapper = editor.getWrapper();
  if (!wrapper) {
    return null;
  }

  return findRootByAttribute(wrapper);
};

// Apply the necessary attributes and styles to the root component to ensure it functions correctly as the cover page wrapper and cannot be modified by the user.
export const applyPageSetupToRoot = (root: Component, pageSetup: PageSetup) => {
  root.set(ROOT_COMPONENT_FLAGS);
  root.addAttributes({
    [COVER_PAGE_WRAPPER_ATTR]: COVER_PAGE_WRAPPER_VALUE,
    ...getPageSetupAttributes(pageSetup),
  });
  root.setStyle(getCoverPageWrapperStyleObject(pageSetup), { inline: true });
};

// Ensure that the cover page root component exists in the editor. If it doesn't exist, create it with the appropriate attributes and styles based on the provided page setup. This function is typically called during editor initialization to set up the canvas correctly.
export const ensureCoverPageRoot = (editor: Editor, pageSetup: PageSetup) => {
  const wrapper = editor.getWrapper();
  if (!wrapper) {
    return null;
  }

  const existingRoot = findCoverPageRoot(editor);
  if (existingRoot) {
    applyPageSetupToRoot(existingRoot, pageSetup);
    return existingRoot;
  }

  const [root] = wrapper.append({
    tagName: 'div',
    attributes: {
      [COVER_PAGE_WRAPPER_ATTR]: COVER_PAGE_WRAPPER_VALUE,
      ...getPageSetupAttributes(pageSetup),
    },
    components: '',
    style: getCoverPageWrapperStyleObject(pageSetup),
    ...ROOT_COMPONENT_FLAGS,
  });

  applyPageSetupToRoot(root, pageSetup);
  return root;
};
