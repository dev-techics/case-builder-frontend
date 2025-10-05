import { PDFViewer } from "../../features/editor/editor";
export default function EditorPage() {
    return (
        <div className="rounded bg-white p-6 shadow">
            <h2 className="mb-4 font-bold text-2xl">Document Title</h2>
            <PDFViewer />
        </div>
    );
}
