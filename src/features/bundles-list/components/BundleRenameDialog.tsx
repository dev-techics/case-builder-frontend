import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { Bundle } from '../types';

type BundleRenameDialogProps = {
  bundle: Bundle | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void>;
  open: boolean;
};

const BundleRenameDialog = ({
  bundle,
  isSubmitting,
  onOpenChange,
  onSubmit,
  open,
}: BundleRenameDialogProps) => {
  const [bundleName, setBundleName] = useState(bundle?.name ?? '');
  const currentName = bundle?.name ?? '';

  const trimmedName = bundleName.trim();
  const hasChanges = trimmedName !== currentName.trim();
  const canSubmit = Boolean(trimmedName) && hasChanges && !isSubmitting;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isSubmitting) {
      return;
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    void onSubmit(trimmedName);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl w-full">
        <DialogHeader>
          <DialogTitle>Rename bundle</DialogTitle>
          <DialogDescription>
            {bundle
              ? `Update the name for ${bundle.caseNumber}.`
              : 'Enter a new bundle name.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="bundle-name">Bundle Name</Label>
              <Input
                autoFocus
                disabled={isSubmitting}
                id="bundle-name"
                name="bundleName"
                onChange={event => setBundleName(event.target.value)}
                placeholder="e.g., Smith v. Johnson - Discovery"
                value={bundleName}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!canSubmit}>
              Rename Bundle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BundleRenameDialog;
