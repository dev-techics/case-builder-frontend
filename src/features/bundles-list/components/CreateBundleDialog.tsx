/**
 * New bundle Creation dialog
 *
 * Responsibility:
 * Display the dialog collect the data and dispatch the action
 *
 * Notes:
 *
 * Author: Anik Dey
 */

import { useAppDispatch } from '@/app/hooks';
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
import { createBundleAsync } from '../redux/bundlesListSlice';
import { useState, type FormEvent } from 'react';
import { toast } from 'react-toastify';

interface CreateNewBundleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateNewBundleDialog = ({
  open,
  onOpenChange,
}: CreateNewBundleDialogProps) => {
  const [bundleName, setBundleName] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const dispatch = useAppDispatch();

  // Handle new bundle creation
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!bundleName.trim() || !caseNumber.trim()) {
      return;
    }
    const payload = {
      name: bundleName.trim(),
      case_number: caseNumber.trim(),
    };

    dispatch(createBundleAsync(payload));
    toast.success('New bundle created successfully');
    setBundleName('');
    setCaseNumber('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Bundle</DialogTitle>
          <DialogDescription>
            Enter the details for your new bundle. Click create when you're
            done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={e => handleSubmit(e)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="bundle-name">Bundle Name</Label>
              <Input
                id="bundle-name"
                name="bundleName"
                value={bundleName}
                onChange={e => setBundleName(e.target.value)}
                placeholder="e.g., Smith v. Johnson - Discovery"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="case-number">Case Number</Label>
              <Input
                id="case-number"
                name="caseNumber"
                value={caseNumber}
                onChange={e => setCaseNumber(e.target.value)}
                placeholder="e.g., CV-2024-001234"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button variant="default" type="submit">
              Create Bundle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNewBundleDialog;
