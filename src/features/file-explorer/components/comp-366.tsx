import Lottie from "lottie-react";
import { EllipsisIcon, Pencil } from "lucide-react";
import { Button } from "@/features/file-explorer/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/features/file-explorer/components/ui/dropdown-menu";

import TrashCan from "../../../../public/Trash Can.json" with { type: "json" };

export default function Component() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Open edit menu" size="icon" variant="ghost">
          <EllipsisIcon aria-hidden="true" size={14} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <Pencil className="ml-1" size={16} />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center">
          {/* Render Lottie JSON animation */}
          <Lottie
            animationData={TrashCan}
            className="flex items-center justify-center text-2xl text-red-600"
            loop={false}
            style={{
              width: 24,
              height: 24,
              color: "red",
              marginBottom: "5px",
            }}
          />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
