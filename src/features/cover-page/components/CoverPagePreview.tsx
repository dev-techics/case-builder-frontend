import { useAppSelector } from '@/app/hooks';
import type { CoverPageField } from '../types';

const CoverPagePreview = () => {
  const { templateKey, templates, values } = useAppSelector(
    state => state.coverPage
  );

  const template = templates.find(t => t.template_key === templateKey);

  if (!template) {
    return null;
  }

  // A4 dimensions in pixels at 96 DPI (standard screen resolution)
  // A4 is 210mm x 297mm = 793px x 1122px at 96 DPI
  const pageWidth = 793;
  const pageHeight = 1122;
  const scale = 0.6; // Scale down for preview

  // Helper function to get the value for a field
  const getFieldValue = (fieldName: string): string => {
    const field = values.find((f: any) => f.name === fieldName);
    return field?.value || '';
  };

  // Helper function to get placeholder text for empty fields
  const getPlaceholderText = (fieldName: string): string => {
    const placeholders: Record<string, string> = {
      case_title: 'Case Title',
      case_number: 'Case No. 12345',
      court_name: 'Superior Court Name',
      county: 'County Name',
      attorney_name: 'Attorney Name',
      bar_number: 'Bar No. 123456',
      firm_name: 'Law Firm Name',
      address: '123 Main Street',
      city_state_zip: 'City, State ZIP',
      phone: '(555) 123-4567',
      email: 'email@example.com',
      party_name: 'Party Name',
      document_title: 'Document Title',
      date: new Date().toLocaleDateString(),
    };

    return (
      placeholders[fieldName] ||
      fieldName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    );
  };

  const renderField = (field: CoverPageField) => {
    const value = getFieldValue(field.name);
    const displayValue = value || getPlaceholderText(field.name);

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
      color: value ? field.color || '#000' : '#9ca3af', // Gray color for placeholders
      fontFamily: field.font.includes('Times')
        ? 'Georgia, "Times New Roman", serif'
        : field.font.includes('Helvetica')
          ? 'Arial, Helvetica, sans-serif'
          : 'inherit',
      maxWidth: field.maxWidth ? `${field.maxWidth}px` : 'auto',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      fontStyle: value ? 'normal' : 'italic', // Italic for placeholders
    };

    // Adjust for alignment
    if (field.align === 'center') {
      style.transform = 'translateX(-50%)';
    } else if (field.align === 'right') {
      style.transform = 'translateX(-100%)';
    }

    return (
      <div key={field.name} style={style}>
        {displayValue}
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
        {template.values.fields.map(renderField)}
      </div>
    </div>
  );
};

export default CoverPagePreview;
