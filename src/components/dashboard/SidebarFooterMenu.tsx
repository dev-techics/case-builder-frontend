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
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logout } from '@/features/auth/redux/authSlice';

const SidebarFooterMenu = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const user = useAppSelector(state => state.auth.user);
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    return () => {
      // Dispatch logout action or call logout function here
      console.log('Logout clicked');
      dispatch(logout());
    };
  };
  return (
    <SidebarMenuItem>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton className="focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src="" alt="Username" />
              <AvatarFallback className="rounded-lg">
                {user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user?.name}</span>
              <span className="truncate text-xs">{user?.email}</span>
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
                  src="https://www.freepik.com/free-vector/blue-circle-with-white-user_145857007.htm#fromView=keyword&page=1&position=0&uuid=58174c9b-bec5-4a67-aa90-c5c1843ebbdd&query=User+profile"
                  alt="Username"
                />
                <AvatarFallback className="rounded-lg">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email}
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
          <DropdownMenuItem onClick={handleLogout()}>
            <HugeiconsIcon icon={LogoutCircle01FreeIcons} />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export default SidebarFooterMenu;
