import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

import {
  bundleStatusColors,
  bundleStatuses,
  type BundleStatus,
} from '../types';

type BundleStatusMenuProps = {
  className?: string;
  disabled?: boolean;
  onChange: (status: BundleStatus) => void;
  status: BundleStatus;
};

const BundleStatusMenu = ({
  className,
  disabled = false,
  onChange,
  status,
}: BundleStatusMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          onClick={event => event.stopPropagation()}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-wait disabled:opacity-70',
            bundleStatusColors[status],
            className
          )}
        >
          <span>{status}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Change status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={status}
          onValueChange={value => onChange(value as BundleStatus)}
        >
          {bundleStatuses.map(option => (
            <DropdownMenuRadioItem
              key={option}
              value={option}
              disabled={disabled}
            >
              {option}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BundleStatusMenu;
