/**
 * New bundle Creation dialog
 *
 * Responsibility:
 * Display the dialog and collect the input values
 *
 * Notes:
 *
 * Author: Anik Dey
 */

import type { FormEventHandler } from 'react';

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

interface CreateNewBundleDialogProps {
  bundleName: string;
  canSubmit: boolean;
  caseNumber: string;
  description: string;
  isSubmitting: boolean;
  open: boolean;
  onBundleNameChange: (value: string) => void;
  onCaseNumberChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

const CreateNewBundleDialog = ({
  bundleName,
  canSubmit,
  caseNumber,
  description,
  isSubmitting,
  open,
  onBundleNameChange,
  onCaseNumberChange,
  onDescriptionChange,
  onOpenChange,
  onSubmit,
}: CreateNewBundleDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Bundle</DialogTitle>
          <DialogDescription>
            Enter the details for your new bundle. Click create when you&apos;re
            done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="bundle-name">Bundle Name</Label>
              <Input
                autoFocus
                id="bundle-name"
                name="bundleName"
                value={bundleName}
                disabled={isSubmitting}
                onChange={event => onBundleNameChange(event.target.value)}
                placeholder="e.g., Smith v. Johnson - Discovery"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="case-number">Case Number</Label>
              <Input
                id="case-number"
                name="caseNumber"
                value={caseNumber}
                disabled={isSubmitting}
                onChange={event => onCaseNumberChange(event.target.value)}
                placeholder="e.g., CV-2024-001234"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="bundle-description">Description</Label>
              <textarea
                className="min-h-[96px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
                id="bundle-description"
                name="description"
                onChange={event => onDescriptionChange(event.target.value)}
                placeholder="Optional notes about this bundle"
                value={description}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button variant="default" type="submit" disabled={!canSubmit}>
              Create Bundle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNewBundleDialog;
