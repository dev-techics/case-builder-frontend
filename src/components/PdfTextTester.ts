import { getDocument } from 'pdfjs-dist';

export async function testPdfTextExtraction(fileUrl) {
  const loadingTask = getDocument(fileUrl);
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const textContent = await page.getTextContent();

  // console.log("🔍 Extracted text items:");
  return textContent.items;
}
