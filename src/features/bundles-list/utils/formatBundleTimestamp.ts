const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const toLocalDateFromDateOnly = (dateValue: string) => {
  const [year, month, day] = dateValue.split('-').map(Number);

  return new Date(year, month - 1, day);
};

export const formatBundleTimestamp = (dateValue?: string) => {
  if (!dateValue) {
    return '—';
  }

  const parsedDate = DATE_ONLY_PATTERN.test(dateValue)
    ? toLocalDateFromDateOnly(dateValue)
    : new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return '—';
  }

  if (DATE_ONLY_PATTERN.test(dateValue)) {
    return parsedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return parsedDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};
