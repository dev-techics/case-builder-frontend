export const formatRelativeTime = (dateString?: string) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 45) return 'just now';

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;

  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;

  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;

  const diffWeek = Math.round(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`;

  const diffMonth = Math.round(diffDay / 30);
  if (diffMonth < 12)
    return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;

  const diffYear = Math.round(diffDay / 365);
  return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
};

export const getSortTimestamp = (updatedAt?: string, createdAt?: string) => {
  const dateValue = updatedAt ?? createdAt;
  if (!dateValue) return 0;
  const ts = new Date(dateValue).getTime();
  return Number.isNaN(ts) ? 0 : ts;
};
