import { EllipsisIcon } from "lucide-react";

import { Button } from "@/features/file-explorer/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/features/file-explorer/components/ui/dropdown-menu";

export default function Component() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Open edit menu"
          className="rounded-full shadow-none hover:bg-gray-800 hover:text-white"
          size="icon"
          variant="ghost"
        >
          <EllipsisIcon aria-hidden="true" size={14} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="border-0 bg-gray-700 text-white">
        <DropdownMenuItem className="hover:bg-gray-800">Rename</DropdownMenuItem>
        <DropdownMenuItem className="text-red-500 hover:bg-gray-800">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

