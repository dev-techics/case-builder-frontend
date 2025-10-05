import { useAppSelector } from "../../app/hooks";
import { FolderItem } from "./components/FolderItem";
import { FileUploadHandler } from "./services/fileUploadHandler";

const FileTree: React.FC = () => {
    const tree = useAppSelector((state) => state.fileTree.tree);

    return (
        <div className="h-screen w-64 overflow-auto bg-gray-800 text-white">
            <div className="border-gray-700 border-b p-2">
                <h2 className="font-semibold text-gray-400 text-xs uppercase tracking-wider">
                    Explorer
                </h2>
            </div>
            <FileUploadHandler />
            <div className="py-1">
                <FolderItem folder={tree} level={0} />
            </div>
        </div>
    );
};

export default FileTree;