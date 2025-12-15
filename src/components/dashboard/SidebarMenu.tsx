import {
  SidebarGroupContent,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { Home07Icon, Files02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

const iconColor = 'currentColor';
const iconSize = 20;

const menuItems = [
  {
    name: 'Home',
    icon: <HugeiconsIcon icon={Home07Icon} color={iconColor} size={iconSize} />,
    url: '/home',
  },
  {
    name: 'Bundles',
    icon: (
      <HugeiconsIcon icon={Files02Icon} color={iconColor} size={iconSize} />
    ),
    url: '/dashboard/bundles',
  },
];

const DashboardSidebarMenu = () => {
  return (
    <SidebarGroupContent>
      <SidebarMenu className="mt-2">
        {menuItems.map(item => (
          <SidebarMenuItem key={item.name} className="mb-2">
            <SidebarMenuButton asChild>
              <a href={item.url}>
                <span>{item.icon}</span>
                <span className="text-base text-[#4B4D4E]">{item.name}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroupContent>
  );
};

export default DashboardSidebarMenu;
