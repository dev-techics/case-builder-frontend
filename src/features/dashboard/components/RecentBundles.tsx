import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { Folder02Icon, Share05Icon } from '@hugeicons/core-free-icons';
import { useGetBundlesQuery } from '@/features/bundles-list/api';
import { formatRelativeTime, getSortTimestamp } from '../utils';
import { useNavigate } from 'react-router-dom';

export const RecentBundles = () => {
  const { data: bundles = [], isLoading, error } = useGetBundlesQuery();
  const navigate = useNavigate();

  const recentBundles = useMemo(
    () =>
      [...bundles]
        .sort(
          (a, b) =>
            getSortTimestamp(b.updatedAt, b.createdAt) -
            getSortTimestamp(a.updatedAt, a.createdAt)
        )
        .slice(0, 3),
    [bundles]
  );

  if (isLoading && bundles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Loading recent bundles...</p>
    );
  }

  if (error && bundles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Failed to load recent bundles.
      </p>
    );
  }

  if (recentBundles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No recent bundles yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      {recentBundles.map(bundle => (
        <div
          key={bundle.id}
          className="flex items-center justify-between p-3 border rounded-lg transition-colors hover:bg-emerald-50/70 hover:border-emerald-200 dark:hover:bg-emerald-950/20 dark:hover:border-emerald-900/40"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-emerald-500 text-emerald-50 dark:bg-emerald-500/20 dark:text-emerald-300">
              {/* <HugeiconsIcon size={20} strokeWidth={2} icon={File02Icon} /> */}
              <HugeiconsIcon size={20} strokeWidth={2} icon={Folder02Icon} />
            </div>
            <div>
              <p className="text-sm font-medium">{bundle.name}</p>
              <p className="text-xs text-muted-foreground">
                Updated{' '}
                {formatRelativeTime(bundle.updatedAt ?? bundle.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`editor/${bundle.id}`)}
              className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:text-emerald-200 dark:hover:bg-emerald-950/30"
            >
              Continue
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                window.open(`/dashboard/editor/${bundle.id}`, '_blank')
              }
              className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:text-emerald-200 dark:hover:bg-emerald-950/30"
            >
              <HugeiconsIcon size={18} icon={Share05Icon} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
