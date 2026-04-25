import camelcaseKeys from 'camelcase-keys';
import { bundleStatuses, type Bundle, type BundleStatus } from '../types';

type BundleRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is BundleRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isBundleStatus = (value: unknown): value is BundleStatus =>
  typeof value === 'string' && bundleStatuses.includes(value as BundleStatus);

const toOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value : undefined;

const toOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
  }

  return undefined;
};

const toStringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : undefined;

const toCamelizedPayload = (value: unknown): unknown =>
  value && typeof value === 'object'
    ? camelcaseKeys(value, { deep: true })
    : value;

/*----------------------------------------------------
    Normalize a single bundle from snake_case or camelCase
------------------------------------------------------*/
export const normalizeBundle = (value: unknown): Bundle => {
  const bundle = isRecord(value) ? value : {};
  const createdAt = toOptionalString(bundle.createdAt ?? bundle.created_at);

  return {
    id:
      typeof bundle.id === 'string' || typeof bundle.id === 'number'
        ? bundle.id
        : '',
    name: toOptionalString(bundle.name) ?? '',
    caseNumber: toOptionalString(bundle.caseNumber ?? bundle.case_number) ?? '',
    totalDocuments:
      toOptionalNumber(
        bundle.totalDocuments ??
          bundle.total_documents ??
          bundle.documentCount ??
          bundle.document_count
      ) ?? 0,
    status: isBundleStatus(bundle.status) ? bundle.status : 'In Progress',
    createdAt,
    updatedAt:
      toOptionalString(
        bundle.updatedAt ??
          bundle.updated_at ??
          bundle.lastModified ??
          bundle.last_modified
      ) ?? createdAt,
    description: toOptionalString(bundle.description),
    tags: toStringArray(bundle.tags),
  };
};

const normalizeBundleArray = (value: unknown): Bundle[] =>
  Array.isArray(value) ? value.map(normalizeBundle) : [];

/*----------------------------------------------------
    Normalize single-item responses such as:
    { bundle: {...} }, { data: {...} }, or {...}
------------------------------------------------------*/
export const normalizeBundleResponse = (response: unknown): Bundle => {
  const camelizedResponse = toCamelizedPayload(response);

  if (!isRecord(camelizedResponse)) {
    return normalizeBundle(camelizedResponse);
  }

  const nestedData = isRecord(camelizedResponse.data)
    ? (camelizedResponse.data.bundle ?? camelizedResponse.data)
    : camelizedResponse.data;

  return normalizeBundle(
    camelizedResponse.bundle ?? nestedData ?? camelizedResponse
  );
};

/*----------------------------------------------------
    Normalize list responses such as:
    [...], { bundles: [...] }, { data: [...] }, or { data: { bundles: [...] } }
------------------------------------------------------*/
export const normalizeBundleListResponse = (response: unknown): Bundle[] => {
  const camelizedResponse = toCamelizedPayload(response);

  if (Array.isArray(camelizedResponse)) {
    return normalizeBundleArray(camelizedResponse);
  }

  if (!isRecord(camelizedResponse)) {
    return [];
  }

  if (Array.isArray(camelizedResponse.bundles)) {
    return normalizeBundleArray(camelizedResponse.bundles);
  }

  if (Array.isArray(camelizedResponse.data)) {
    return normalizeBundleArray(camelizedResponse.data);
  }

  if (
    isRecord(camelizedResponse.data) &&
    Array.isArray(camelizedResponse.data.bundles)
  ) {
    return normalizeBundleArray(camelizedResponse.data.bundles);
  }

  return [];
};
