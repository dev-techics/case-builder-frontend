import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HugeiconsIcon } from '@hugeicons/react';
import { Notification01Icon } from '@hugeicons/core-free-icons';

type DashboardNotification = {
  id: string;
  accentClassName: string;
  content: ReactNode;
};

const notifications: DashboardNotification[] = [
  {
    id: 'export-402',
    accentClassName: 'border-emerald-500',
    content: (
      <p className="text-sm">
        Export of <strong>Bundle #402</strong> finished successfully.
      </p>
    ),
  },
  {
    id: 'comment-court-case-x',
    accentClassName: 'border-emerald-400',
    content: (
      <p className="text-sm">
        New comment on <strong>Court Case X</strong> by Senior Partner.
      </p>
    ),
  },
];

const Topbar = () => {
  return (
    <div className="h-16 border-b bg-background flex items-center px-4 flex-shrink-0">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="text-sm font-semibold tracking-tight">Case Bundler</div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Open notifications"
              variant="ghost"
              size="icon"
              className="relative"
            >
              {/* <Bell className="size-4" /> */}
              <HugeiconsIcon className="size-6" icon={Notification01Icon} />
              {notifications.length > 0 && (
                <span className="absolute right-2 top-2 size-2 rounded-full bg-emerald-500" />
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-96">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <span className="text-xs text-muted-foreground">
                {notifications.length}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {notifications.length === 0 ? (
              <div className="px-2 py-3 text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="space-y-3 p-2">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`flex gap-3 border-l-2 pl-3 py-1 ${notification.accentClassName}`}
                  >
                    {notification.content}
                  </div>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Topbar;
