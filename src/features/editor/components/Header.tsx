import type { KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Bell,
  Cloud,
  Download,
  FolderCog,
  LogOut,
  Pencil,
} from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { useRenameBundleMutation } from '@/features/bundles-list/api';
import { renameTreeRoot } from '@/features/file-explorer/redux/fileTreeSlice';
import { resolveBundleId } from '@/lib/bundleId';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { bundleId: routeBundleId } = useParams<{ bundleId?: string }>();
  const tree = useAppSelector(state => state.fileTree.tree);
  const [renameBundle, { isLoading: isRenaming }] = useRenameBundleMutation();
  const inputRef = useRef<HTMLInputElement>(null);

  const bundleName = tree.projectName || tree.name || 'Untitled bundle';
  const bundleId =
    resolveBundleId({ routeBundleId, treeId: tree.id }) ??
    (tree.id === 'bundle-loading' ? '' : tree.id);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(bundleName);

  useEffect(() => {
    if (!isEditingName) {
      setDraftName(bundleName);
    }
  }, [bundleName, isEditingName]);

  useEffect(() => {
    if (isEditingName) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingName]);

  const handleNavigation = () => {
    navigate('/dashboard/bundles');
  };

  const startEditingName = () => {
    setDraftName(bundleName);
    setIsEditingName(true);
  };

  const cancelEditingName = () => {
    setDraftName(bundleName);
    setIsEditingName(false);
  };

  const submitBundleName = async () => {
    const nextName = draftName.trim();

    if (!nextName || nextName === bundleName.trim()) {
      cancelEditingName();
      return;
    }

    if (!bundleId) {
      return;
    }

    try {
      await renameBundle({ bundleId, name: nextName }).unwrap();
      dispatch(renameTreeRoot(nextName));
      setIsEditingName(false);
    } catch (error) {
      console.error('Failed to rename bundle:', error);
    }
  };

  const handleNameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void submitBundleName();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditingName();
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center border-gray-200 border-b bg-[#f7f8fc] px-6 shadow-sm">
      <div className="flex min-w-0 flex-1 items-center gap-6">
        <div className="flex shrink-0 items-center gap-3 text-indigo-700">
          <FolderCog className="h-7 w-7" />
          <span className="font-semibold text-2xl">Case Builder</span>
        </div>

        <div className="h-7 w-px shrink-0 bg-gray-300" />

        <div className="group/title flex min-w-0 items-center gap-2">
          {isEditingName ? (
            <input
              ref={inputRef}
              className="h-8 w-[min(360px,32vw)] rounded-md border border-indigo-300 bg-white px-3 font-semibold text-gray-950 text-sm outline-none ring-2 ring-indigo-100"
              disabled={isRenaming}
              onBlur={() => void submitBundleName()}
              onChange={event => setDraftName(event.target.value)}
              onKeyDown={handleNameKeyDown}
              value={draftName}
            />
          ) : (
            <>
              <button
                className="max-w-[min(360px,32vw)] truncate rounded-md bg-indigo-50/80 px-3 py-1.5 text-left font-semibold text-gray-950 text-sm"
                onClick={startEditingName}
                type="button"
              >
                {bundleName}
              </button>
              <button
                aria-label="Rename bundle"
                className="rounded-md p-1 text-gray-400 opacity-0 transition hover:bg-indigo-50 hover:text-indigo-700 group-hover/title:opacity-100"
                onClick={startEditingName}
                type="button"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 text-gray-500 text-sm">
          <Cloud className="h-4 w-4" />
          Saved
        </div>
      </div>

      <div className="ml-6 flex shrink-0 items-center gap-5">
        <Button
          aria-label="Exit editor"
          className="h-12 w-12 rounded-md bg-indigo-50 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700"
          onClick={handleNavigation}
          size="icon"
          type="button"
          variant="ghost"
        >
          <LogOut className="h-5 w-5" />
        </Button>

        <div className="h-7 w-px bg-gray-300" />

        <Button
          className="h-12 rounded-lg bg-indigo-700 px-5 font-semibold text-white hover:bg-indigo-800"
          // disabled={!hasFiles || !bundleId || isExporting}
          // onClick={handleExport}
          type="button"
        >
          <Download className="h-5 w-5" />
          {/* {isExporting ? 'Exporting...' : 'Export Bundle'} */}
          Export Bundle
        </Button>

        <Button
          aria-label="Notifications"
          className="h-10 w-10 rounded-full text-gray-700 hover:bg-gray-100"
          size="icon"
          type="button"
          variant="ghost"
        >
          <Bell className="h-5 w-5" />
        </Button>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-slate-900 font-semibold text-sm text-white">
          CB
        </div>
      </div>
    </header>
  );
};


export default Header;
