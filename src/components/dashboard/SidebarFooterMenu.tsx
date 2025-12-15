import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Invoice01Icon,
  LogoutCircle01FreeIcons,
  Settings01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';

const SidebarFooterMenu = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    <SidebarMenuItem>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton className="focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src="" alt="Username" />
              <AvatarFallback className="rounded-lg">S</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Shajjad Miah</span>
              <span className="truncate text-xs">example@gmail.com</span>
            </div>

            <HugeiconsIcon
              icon={isOpen ? ArrowDown01Icon : ArrowUp01Icon}
              size={20}
              className="ml-auto"
            />
          </SidebarMenuButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="right"
          align="end"
          sideOffset={25}
          className="w-[--radix-popper-anchor-width] min-w-56 mb-4"
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src="https://avatars.githubusercontent.com/u/98038960?v=4"
                  alt="Username"
                />
                <AvatarFallback className="rounded-lg">UN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Username</span>
                <span className="truncate text-xs text-muted-foreground">
                  user@example.com
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <HugeiconsIcon icon={UserIcon} />
            <span>Account</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <HugeiconsIcon icon={Invoice01Icon} />
            <span>Billing</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <HugeiconsIcon icon={Settings01Icon} />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <HugeiconsIcon icon={LogoutCircle01FreeIcons} />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export default SidebarFooterMenu;
