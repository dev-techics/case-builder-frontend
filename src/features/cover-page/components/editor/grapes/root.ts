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

export const findCoverPageRoot = (editor: Editor) => {
  const wrapper = editor.getWrapper();
  if (!wrapper) {
    return null;
  }

  return findRootByAttribute(wrapper);
};

export const applyPageSetupToRoot = (root: Component, pageSetup: PageSetup) => {
  root.set(ROOT_COMPONENT_FLAGS);
  root.addAttributes({
    [COVER_PAGE_WRAPPER_ATTR]: COVER_PAGE_WRAPPER_VALUE,
    ...getPageSetupAttributes(pageSetup),
  });
  root.setStyle(getCoverPageWrapperStyleObject(pageSetup), { inline: true });
};

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
