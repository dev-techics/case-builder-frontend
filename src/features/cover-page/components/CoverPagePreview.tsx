import { useAppSelector } from '@/app/hooks';
import { COVER_TEMPLATES } from '../constants/coverTemplates';
import type { CoverPageField } from '../types';

export default function CoverPagePreview() {
  const { templateKey, values } = useAppSelector(state => state.coverPage);

  const template = COVER_TEMPLATES.find(t => t.key === templateKey);

  if (!template) {
    return null;
  }

  // A4 dimensions in pixels at 96 DPI (standard screen resolution)
  // A4 is 210mm x 297mm = 793px x 1122px at 96 DPI
  const pageWidth = 793;
  const pageHeight = 1122;
  const scale = 0.6; // Scale down for preview

  const renderField = (field: CoverPageField) => {
    const value = values[field.name] || '';
    if (!value) return null;

    // Convert PDF coordinates to CSS
    // PDF uses bottom-left origin, CSS uses top-left
    const x = field.x * 3.78; // Convert mm to px (1mm ≈ 3.78px at 96 DPI)
    const y = field.y * 3.78;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      fontSize: `${field.size}px`,
      fontWeight: field.bold ? 'bold' : 'normal',
      textAlign: field.align,
      color: field.color || '#000',
      fontFamily: field.font.includes('Times')
        ? 'Georgia, "Times New Roman", serif'
        : field.font.includes('Helvetica')
          ? 'Arial, Helvetica, sans-serif'
          : 'inherit',
      maxWidth: field.maxWidth ? `${field.maxWidth}px` : 'auto',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    };

    // Adjust for alignment
    if (field.align === 'center') {
      style.transform = 'translateX(-50%)';
    } else if (field.align === 'right') {
      style.transform = 'translateX(-100%)';
    }

    return (
      <div key={field.name} style={style}>
        {value}
      </div>
    );
  };

  return (
    <div
      className="relative mx-auto bg-white"
      style={{
        width: `${pageWidth * scale}px`,
        height: `${pageHeight * scale}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      {/* A4 Page Background */}
      <div
        className="absolute inset-0 bg-white shadow-lg"
        style={{
          width: `${pageWidth}px`,
          height: `${pageHeight}px`,
        }}
      >
        {/* Render all fields */}
        {template.fields.map(renderField)}
      </div>
    </div>
  );
}
