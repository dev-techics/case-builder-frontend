"use client";

import {
  hotkeysCoreFeature,
  renamingFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import { FileIcon, FolderIcon, FolderOpenIcon } from "lucide-react";
import { useState } from "react";
import { Input } from "@/features/file-explorer/components/ui/input";
import { Tree, TreeItem, TreeItemLabel } from "@/features/file-explorer/components/ui/tree";

type Item = {
  name: string;
  children?: string[];
};

// Initial data
const initialItems: Record<string, Item> = {
  company: {
    name: "Company",
    children: ["engineering", "marketing", "operations"],
  },
  engineering: {
    name: "Engineering",
    children: ["frontend", "backend", "platform-team"],
  },
  frontend: { name: "Frontend", children: ["design-system", "web-platform"] },
  "design-system": {
    name: "Design System",
    children: ["components", "tokens", "guidelines"],
  },
  components: { name: "Components" },
  tokens: { name: "Tokens" },
  guidelines: { name: "Guidelines" },
  "web-platform": { name: "Web Platform" },
  backend: { name: "Backend", children: ["apis", "infrastructure"] },
  apis: { name: "APIs" },
  infrastructure: { name: "Infrastructure" },
  "platform-team": { name: "Platform Team" },
  marketing: { name: "Marketing", children: ["content", "seo"] },
  content: { name: "Content" },
  seo: { name: "SEO" },
  operations: { name: "Operations", children: ["hr", "finance"] },
  hr: { name: "HR" },
  finance: { name: "Finance" },
};

const indent = 20;

export default function Component() {
  const [items, setItems] = useState(initialItems);

  const tree = useTree<Item>({
    initialState: {
      expandedItems: ["engineering", "frontend", "design-system"],
    },
    indent,
    rootItemId: "company",
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => (item.getItemData()?.children?.length ?? 0) > 0,
    dataLoader: {
      getItem: (itemId) => items[itemId],
      getChildren: (itemId) => items[itemId].children ?? [],
    },
    onRename: (item, newName) => {
      // Update the item name in our state
      const itemId = item.getId();
      setItems((prevItems) => ({
        ...prevItems,
        [itemId]: {
          ...prevItems[itemId],
          name: newName,
        },
      }));
    },
    features: [
      syncDataLoaderFeature,
      hotkeysCoreFeature,
      renamingFeature,
      selectionFeature,
    ],
  });

  return (
    <div className="flex h-full flex-col gap-2 *:first:grow">
      <Tree indent={indent} tree={tree}>
        {tree.getItems().map((item) => (
          <TreeItem item={item} key={item.getId()}>
            <TreeItemLabel>
              <span className="flex items-center gap-2">
                {item.isFolder() ? (
                  item.isExpanded() ? (
                    <FolderOpenIcon className="pointer-events-none size-4 text-muted-foreground" />
                  ) : (
                    <FolderIcon className="pointer-events-none size-4 text-muted-foreground" />
                  )
                ) : (
                  <FileIcon className="pointer-events-none size-4 text-muted-foreground" />
                )}
                {item.isRenaming() ? (
                  <Input
                    {...item.getRenameInputProps()}
                    autoFocus
                    className="-my-0.5 h-6 px-1"
                  />
                ) : (
                  item.getItemName()
                )}
              </span>
            </TreeItemLabel>
          </TreeItem>
        ))}
      </Tree>

      <p
        aria-live="polite"
        className="mt-2 text-muted-foreground text-xs"
        role="region"
      >
        Tree with renaming (press F2 to rename) ∙{" "}
        <a
          className="underline hover:text-foreground"
          href="https://headless-tree.lukasbach.com"
          rel="noopener noreferrer"
          target="_blank"
        >
          API
        </a>
      </p>
    </div>
  );
}
