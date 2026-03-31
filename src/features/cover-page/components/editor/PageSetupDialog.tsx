import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DEFAULT_PAGE_SETUP,
  PAGE_SIZES,
  normalizePageSetup,
  type PageOrientation,
  type PageSetup,
  type PageSizeId,
} from '../../utils/pageSetup';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type MarginInputs = Record<keyof PageSetup['margin'], string>;

interface PageSetupDialogProps {
  open: boolean;
  pageSetup: PageSetup;
  onOpenChange: (open: boolean) => void;
  onSave: (pageSetup: PageSetup) => void;
}

const buildMarginInputState = (setup: PageSetup): MarginInputs => ({
  top: setup.margin.top.toString(),
  right: setup.margin.right.toString(),
  bottom: setup.margin.bottom.toString(),
  left: setup.margin.left.toString(),
});

const PageSetupDialog = ({
  open,
  pageSetup,
  onOpenChange,
  onSave,
}: PageSetupDialogProps) => {
  const [pageSetupDraft, setPageSetupDraft] = useState<PageSetup>(pageSetup);
  const [marginInputs, setMarginInputs] = useState<MarginInputs>(() =>
    buildMarginInputState(pageSetup)
  );

  const updateDraft = (next: Partial<PageSetup>) => {
    setPageSetupDraft(current => normalizePageSetup({ ...current, ...next }));
  };

  const updateMarginInput = (
    field: keyof PageSetup['margin'],
    value: string
  ) => {
    setMarginInputs(current => ({ ...current, [field]: value }));

    const parsedValue = Number(value);
    if (Number.isNaN(parsedValue)) {
      return;
    }

    setPageSetupDraft(current =>
      normalizePageSetup({
        ...current,
        margin: {
          ...current.margin,
          [field]: parsedValue,
        },
      })
    );
  };

  const handleApply = () => {
    onSave(normalizePageSetup(pageSetupDraft));
    onOpenChange(false);
  };

  const handleReset = () => {
    setPageSetupDraft(DEFAULT_PAGE_SETUP);
    setMarginInputs(buildMarginInputState(DEFAULT_PAGE_SETUP));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Page setup</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 text-sm">
          <div className="grid gap-2">
            <span className="font-medium text-gray-700">Orientation</span>
            <Select
              value={pageSetupDraft.orientation}
              onValueChange={value =>
                updateDraft({ orientation: value as PageOrientation })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Orientation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <span className="font-medium text-gray-700">Paper size</span>
            <Select
              value={pageSetupDraft.size}
              onValueChange={value =>
                updateDraft({ size: value as PageSizeId })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Paper size" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <span className="font-medium text-gray-700">Page color</span>
            <div className="flex items-center gap-3">
              <Input
                type="color"
                className="h-9 w-20 p-1"
                value={pageSetupDraft.backgroundColor}
                onChange={event =>
                  updateDraft({ backgroundColor: event.target.value })
                }
                aria-label="Page color"
              />
              <span className="text-xs text-gray-500">
                {pageSetupDraft.backgroundColor.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <span className="font-medium text-gray-700">
              Margins (centimeters)
            </span>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500" htmlFor="margin-top">
                  Top
                </label>
                <Input
                  id="margin-top"
                  type="number"
                  step="0.1"
                  min="0"
                  value={marginInputs.top}
                  onChange={event =>
                    updateMarginInput('top', event.target.value)
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500" htmlFor="margin-right">
                  Right
                </label>
                <Input
                  id="margin-right"
                  type="number"
                  step="0.1"
                  min="0"
                  value={marginInputs.right}
                  onChange={event =>
                    updateMarginInput('right', event.target.value)
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  className="text-xs text-gray-500"
                  htmlFor="margin-bottom"
                >
                  Bottom
                </label>
                <Input
                  id="margin-bottom"
                  type="number"
                  step="0.1"
                  min="0"
                  value={marginInputs.bottom}
                  onChange={event =>
                    updateMarginInput('bottom', event.target.value)
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500" htmlFor="margin-left">
                  Left
                </label>
                <Input
                  id="margin-left"
                  type="number"
                  step="0.1"
                  min="0"
                  value={marginInputs.left}
                  onChange={event =>
                    updateMarginInput('left', event.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={handleReset}>
            Reset
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>Apply</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PageSetupDialog;
