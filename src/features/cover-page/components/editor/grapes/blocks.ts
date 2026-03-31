import type { Editor } from 'grapesjs';

export const registerCoverPageBlocks = (editor: Editor) => {
  const blockManager = editor.BlockManager;

  blockManager.add('cover-heading', {
    label: 'Heading',
    category: 'Text',
    media:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 6v12M20 6v12M4 12h16"/><path d="M9 6v12M15 6v12"/></svg>',
    content: `
      <h1 style="margin:0 0 18px 0;font-size:34px;line-height:1.2;font-weight:700;color:#0f172a;">
        Case Title
      </h1>
    `,
  });

  blockManager.add('cover-subheading', {
    label: 'Subheading',
    category: 'Text',
    media:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7h16M4 12h12M4 17h8"/></svg>',
    content: `
      <p style="margin:0 0 12px 0;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;">
        Matter Details
      </p>
    `,
  });

  blockManager.add('cover-paragraph', {
    label: 'Paragraph',
    category: 'Text',
    media:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 7h14M5 12h14M5 17h10"/></svg>',
    content: `
      <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#334155;">
        Add the supporting cover page copy here.
      </p>
    `,
  });

  blockManager.add('cover-divider', {
    label: 'Divider',
    category: 'Layout',
    media:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 12h16"/></svg>',
    content:
      '<hr style="margin:18px 0;border:none;border-top:1px solid #cbd5e1;" />',
  });

  blockManager.add('cover-columns', {
    label: 'Two Columns',
    category: 'Layout',
    media:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="5" width="6" height="14"/><rect x="14" y="5" width="6" height="14"/></svg>',
    content: `
      <div style="display:flex;gap:24px;margin:0 0 16px 0;">
        <div style="flex:1;">
          <h3 style="margin:0 0 10px 0;font-size:18px;line-height:1.3;color:#0f172a;">Left Column</h3>
          <p style="margin:0;font-size:14px;line-height:1.7;color:#475569;">
            Add supporting information here.
          </p>
        </div>
        <div style="flex:1;">
          <h3 style="margin:0 0 10px 0;font-size:18px;line-height:1.3;color:#0f172a;">Right Column</h3>
          <p style="margin:0;font-size:14px;line-height:1.7;color:#475569;">
            Add supporting information here.
          </p>
        </div>
      </div>
    `,
  });

  blockManager.add('cover-image', {
    label: 'Image',
    category: 'Media',
    media:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 14l3-3 3 3 2-2 4 4"/><circle cx="9" cy="9" r="1.2"/></svg>',
    content: {
      type: 'image',
      attributes: {
        src: 'https://placehold.co/640x360/e2e8f0/475569?text=Cover+Image',
        alt: 'Cover image',
      },
      style: {
        width: '100%',
        'max-width': '280px',
        display: 'block',
        margin: '0 auto 16px',
      },
    },
  });

  blockManager.add('cover-signature', {
    label: 'Signature',
    category: 'Sections',
    media:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 18h16M7 13c1.4-3.3 2.8-4.9 4.2-4.9 1.8 0 1.4 3.6 3.2 3.6 1 0 1.8-.9 2.6-2.7"/></svg>',
    content: `
      <div style="margin-top:40px;max-width:280px;">
        <div style="height:1px;background:#0f172a;"></div>
        <p style="margin:8px 0 0 0;font-size:13px;line-height:1.6;color:#475569;">
          Attorney Name<br />
          Title
        </p>
      </div>
    `,
  });
};
