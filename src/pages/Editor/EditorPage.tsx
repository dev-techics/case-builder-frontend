import PdfViewer from "../../features/editor/Editor";
export default function EditorPage() {
    return (
        <div className="rounded bg-white p-6 shadow">
            <h2 className="mb-4 font-bold text-2xl">Document Title</h2>
            <PdfViewer />
        </div>
    );
}
