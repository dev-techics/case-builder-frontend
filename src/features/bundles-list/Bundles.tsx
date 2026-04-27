/**
 * This is the entry point of the main bundle list feature
 *
 * Responsibilites: renders all the components required for the bundle list page and crud operations
 *
 * Notes:
 *
 * Author: Anik Dey
 */
import { useState } from 'react';
import {
  BundleCard,
  BundleRow,
  BundlesFilterBar,
  BundlesHeader,
  CreateBundleDialog,
  BundleRenameDialog,
} from '@case-builder/ui';
import { Button } from '@/components/ui/button';
import { FileStack, Plus } from 'lucide-react';
import type { Bundle, BundleStatus, SortOption, ViewMode } from './types';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import {
  bundleListApi,
  useCreateBundleMutation,
  useDeleteBundleMutation,
  useGetBundlesQuery,
  useUpdateBundleStatusMutation,
} from './api';
import { toast } from 'react-toastify';
import { useCreateBundleDialog, useRenameBundle } from './hooks';
import { formatBundleTimestamp } from './utils/formatBundleTimestamp';

/*--------------------------------------------------
  Duplication is still local-only, so we mirror the
  previous behavior by inserting a cloned item into
  the RTK Query cache.
----------------------------------------------------*/
const createDuplicateBundle = (bundle: Bundle): Bundle => ({
  ...bundle,
  id: crypto.randomUUID(),
  name: `${bundle.name} (Copy)`,
  updatedAt: new Date().toISOString().split('T')[0],
  status: 'In Progress',
});

type BundleListItem = {
  bundle: Bundle;
  lastModifiedLabel: string;
  lastModifiedTitle?: string;
};

const BundleList = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [createBundle] = useCreateBundleMutation();
  /*---------- Create new bundle hook call -------------- */
  const {
    bundleName,
    canSubmit: canCreateBundle,
    caseNumber,
    description,
    handleBundleNameChange,
    handleCaseNumberChange,
    handleDescriptionChange,
    handleOpenChange: handleCreateDialogOpenChange,
    handleSubmit: handleCreateBundleSubmit,
    isDialogOpen: isCreateDialogOpen,
    isSubmitting: isCreatingBundle,
    openCreateDialog,
  } = useCreateBundleDialog({
    createBundle: payload => createBundle(payload).unwrap(),
  });
  /*------------ Rename bundle hook call ----------------- */
  const {
    bundleToRename,
    closeRenameDialog,
    isRenameDialogOpen,
    isRenaming,
    openRenameDialog,
    submitRename,
  } = useRenameBundle();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [updatingStatusBundleId, setUpdatingStatusBundleId] = useState<
    Bundle['id'] | null
  >(null);
  const { data: bundles = [], isLoading, error } = useGetBundlesQuery();
  const [deleteBundle] = useDeleteBundleMutation();
  const [updateBundleStatus] = useUpdateBundleStatusMutation();
  // Handle opening a bundle in the editor
  const handleOpenBundle = (bundle: Bundle) => {
    navigate(`/dashboard/editor/${bundle.id}`);
  };
  // Handle bundle delete
  const handleBundleDelete = async (id: string | number) => {
    try {
      await deleteBundle(id).unwrap();
      toast.success('Bundle Deleted Successfully');
    } catch {
      toast.error('Failed to delete bundle');
    }
  };
  const handleBundleDuplicate = (bundle: Bundle) => {
    const duplicatedBundle = createDuplicateBundle(bundle);

    dispatch(
      bundleListApi.util.updateQueryData('getBundles', undefined, draft => {
        const originalBundleIndex = draft.findIndex(
          item => item.id === bundle.id
        );

        if (originalBundleIndex === -1) {
          draft.unshift(duplicatedBundle);
          return;
        }

        draft.splice(originalBundleIndex + 1, 0, duplicatedBundle);
      })
    );

    toast.success('Bundle Duplicated Successfully');
  };

  const handleRenameDialogOpenChange = (open: boolean) => {
    if (!open) {
      closeRenameDialog();
    }
  };

  const handleBundleStatusChange = async (
    bundle: Bundle,
    status: BundleStatus
  ) => {
    if (status === bundle.status) {
      return;
    }

    setUpdatingStatusBundleId(bundle.id);

    try {
      await updateBundleStatus({
        bundleId: bundle.id,
        status,
      }).unwrap();
      toast.success(`Bundle status updated to ${status}`);
    } catch {
      toast.error('Failed to update bundle status');
    } finally {
      setUpdatingStatusBundleId(currentId =>
        currentId === bundle.id ? null : currentId
      );
    }
  };
  const filteredBundles: BundleListItem[] = bundles
    .filter(bundle => {
      if (!bundle?.name || !bundle?.caseNumber) return false;

      return (
        bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bundle.caseNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .map(bundle => {
      const lastModifiedLabel = formatBundleTimestamp(bundle.updatedAt);

      return {
        bundle,
        lastModifiedLabel,
        lastModifiedTitle:
          lastModifiedLabel !== '—' ? lastModifiedLabel : undefined,
      };
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <BundlesHeader onCreateNew={openCreateDialog} />
      <BundlesFilterBar
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">
            Loading bundles...
          </div>
        ) : error && bundles.length === 0 ? (
          <div className="text-center py-12 text-red-500">
            Failed to load bundles. Please try again.
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBundles.map(
              ({ bundle, lastModifiedLabel, lastModifiedTitle }) => (
                <BundleCard
                  key={bundle.id}
                  bundle={bundle}
                  lastModifiedLabel={lastModifiedLabel}
                  lastModifiedTitle={lastModifiedTitle}
                  onOpen={() => handleOpenBundle(bundle)}
                  onStatusChange={status =>
                    void handleBundleStatusChange(bundle, status)
                  }
                  onDelete={handleBundleDelete}
                  onDuplicate={handleBundleDuplicate}
                  onRename={openRenameDialog}
                  isStatusUpdating={updatingStatusBundleId === bundle.id}
                />
              )
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bundle Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                  <th className="w-12 px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBundles.map(
                  ({ bundle, lastModifiedLabel, lastModifiedTitle }) => (
                    <BundleRow
                      key={bundle.id}
                      bundle={bundle}
                      lastModifiedLabel={lastModifiedLabel}
                      lastModifiedTitle={lastModifiedTitle}
                      onOpen={() => handleOpenBundle(bundle)}
                      onStatusChange={status =>
                        void handleBundleStatusChange(bundle, status)
                      }
                      onDelete={handleBundleDelete}
                      onDuplicate={handleBundleDuplicate}
                      onRename={openRenameDialog}
                      isStatusUpdating={updatingStatusBundleId === bundle.id}
                    />
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading &&
          !(error && bundles.length === 0) &&
          filteredBundles.length === 0 && (
            <div className="text-center py-12">
              <FileStack className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No bundles found
              </h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your search or create a new bundle
              </p>
              <Button
                onClick={openCreateDialog}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Your First Bundle
              </Button>
            </div>
          )}
      </div>

      <CreateBundleDialog
        bundleName={bundleName}
        canSubmit={canCreateBundle}
        caseNumber={caseNumber}
        description={description}
        isSubmitting={isCreatingBundle}
        open={isCreateDialogOpen}
        onBundleNameChange={handleBundleNameChange}
        onCaseNumberChange={handleCaseNumberChange}
        onDescriptionChange={handleDescriptionChange}
        onOpenChange={handleCreateDialogOpenChange}
        onSubmit={handleCreateBundleSubmit}
      />
      {/* --------- Rename Dialog ----------- */}
      <BundleRenameDialog
        key={bundleToRename?.id ?? 'rename-dialog'}
        bundle={bundleToRename}
        isSubmitting={isRenaming}
        open={isRenameDialogOpen}
        onOpenChange={handleRenameDialogOpenChange}
        onSubmit={submitRename}
      />
    </div>
  );
};

export default BundleList;
