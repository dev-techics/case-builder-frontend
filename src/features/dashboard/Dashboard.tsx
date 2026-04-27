import { FilePlus, Upload, Download, Bell, Database } from 'lucide-react';
import {
  Clock01Icon,
  Download01Icon,
  File02Icon,
  FolderLibraryIcon,
} from '@hugeicons/core-free-icons';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/app/hooks';
import { useGetStatsQuery } from './api';
import { StatsCard } from './components/StatsCard';
import { RecentBundles } from './components/RecentBundles';
import { StorageWidget } from './components/StorageWidget';
import { selectDashboardStats } from './redux';
import { useCreateBundleMutation } from '@/features/bundles-list/api';
import { CreateBundleDialog } from '@case-builder/ui';
import { useCreateBundleDialog } from '@/features/bundles-list/hooks';

const Dashboard = () => {
  useGetStatsQuery();
  const stats = useAppSelector(selectDashboardStats);
  const navigate = useNavigate();
  const [createBundle] = useCreateBundleMutation();
  const {
    bundleName,
    canSubmit,
    caseNumber,
    description,
    handleBundleNameChange,
    handleCaseNumberChange,
    handleDescriptionChange,
    handleOpenChange,
    handleSubmit,
    isDialogOpen,
    isSubmitting,
    openCreateDialog,
  } = useCreateBundleDialog({
    createBundle: payload => createBundle(payload).unwrap(),
    onCreated: bundle => navigate(`/dashboard/editor/${bundle.id}`),
  });

  return (
    <div className="p-8 max-w-8xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Control Center</h1>
          <p className="text-muted-foreground">
            Welcome back. Here is what&apos;s happening with your bundles.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
        >
          <FilePlus size={18} /> New Bundle
        </Button>
      </header>

      {/*-------------------------
         1. Quick Stats 
      ---------------------------*/}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Bundles"
          value={stats.totalBundles}
          icon={FolderLibraryIcon}
        />
        <StatsCard
          title="Updated This Week"
          value={stats.updatedThisWeek}
          icon={Clock01Icon}
        />
        <StatsCard
          title="Total Documents"
          value={stats.totalDocuments}
          icon={File02Icon}
        />
        <StatsCard title="Recent Exports" value={5} icon={Download01Icon} />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/*------------------------------------------ 
          2. & 6. Recent Bundles / Continue Working 
        ---------------------------------------------*/}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Continue Working</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentBundles />
          </CardContent>
        </Card>

        {/*----------------------------------- 
          3. & 5. Quick Actions & Storage 
        --------------------------------------*/}
        <div className="col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="justify-start gap-2 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200"
              >
                <Upload size={14} /> Upload Files
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200"
              >
                <Download size={14} /> Export Bundle
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200"
              >
                <Database size={14} /> Import Batch
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200"
              >
                <Bell size={14} /> View Alerts
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Storage Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <StorageWidget
                used={stats.storageUsedGb}
                limit={stats.storageLimitGb}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/*--------------------------- 
        7. Draft Bundles
      ------------------------------*/}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Draft Bundles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground italic">
              You have 3 bundles currently in draft state.
            </p>
            <Button
              variant="link"
              className="p-0 h-auto mt-2 text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
            >
              Review Drafts →
            </Button>
          </CardContent>
        </Card>
      </div>

      <CreateBundleDialog
        bundleName={bundleName}
        canSubmit={canSubmit}
        caseNumber={caseNumber}
        description={description}
        isSubmitting={isSubmitting}
        open={isDialogOpen}
        onBundleNameChange={handleBundleNameChange}
        onCaseNumberChange={handleCaseNumberChange}
        onDescriptionChange={handleDescriptionChange}
        onOpenChange={handleOpenChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default Dashboard;
