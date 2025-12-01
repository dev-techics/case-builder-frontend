/** biome-ignore-all lint/style/noMagicNumbers: <explanation> */
/** biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronDown, ChevronRight, FilePlus2, Folder } from "lucide-react";
import type React from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { reorderFiles, selectFile, toggleFolder } from "../fileTreeSlice";
import type { FolderNode } from "../types";
import { SortableFileItem } from "./SortableFileItem";

type FolderItemProps = {
    folder: FolderNode;
    level: number;
};

export const FolderItem: React.FC<FolderItemProps> = ({ folder, level }) => {
    const dispatch = useAppDispatch();
    const expandedFolders = useAppSelector(
        (state) => state.fileTree.expandedFolders
    );
    const selectedFile = useAppSelector((state) => state.fileTree.selectedFile);
    const scrollToFileId = useAppSelector(
        (state) => state.fileTree.scrollToFileId
    );

    const isExpanded = expandedFolders.includes(folder.id);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = folder.children.findIndex(
                (child) => child.id === active.id
            );
            const newIndex = folder.children.findIndex(
                (child) => child.id === over.id
            );

            dispatch(reorderFiles({ oldIndex, newIndex }));
        }
    };

    const handleFolderClick = () => {
        dispatch(toggleFolder(folder.id));
    };

    const handleFileSelect = (fileId: string) => {
        dispatch(selectFile(fileId));
    };

    return (
        <div>
            <div
                className="flex cursor-pointer items-center px-2 py-1 hover:bg-gray-200"
                onClick={handleFolderClick}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
                {isExpanded ? (
                    <ChevronDown className="mr-1 h-4 w-4 flex-shrink-0" />
                ) : (
                    <ChevronRight className="mr-1 h-4 w-4 flex-shrink-0" />
                )}
                <Folder className="mr-2 h-4 w-4 flex-shrink-0 text-blue-400" />
                <span className="truncate text-gray-800 text-sm">{folder.name}</span>
            </div>

            {isExpanded && (
                <div style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}>
                    <DndContext
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        sensors={sensors}
                    >
                        <SortableContext
                            items={folder.children.map((c) => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {folder.children.map((child) => (
                                <SortableFileItem
                                    file={child}
                                    isSelected={selectedFile === child.id}
                                    key={child.id}
                                    level={level + 1}
                                    onSelect={() => handleFileSelect(child.id)}
                                    shouldScrollIntoView={scrollToFileId === child.id}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>
            )}
        </div>
    );
};
