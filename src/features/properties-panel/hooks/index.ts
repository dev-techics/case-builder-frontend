import { useSaveMetaDataMutation } from '../api';

type PersistMetadataOptions = {
  bundleId: string | null;
  headerLeftText: string;
  headerRightText: string;
  footerText: string;
};

export const usePersistMetadata = () => {
  const [saveMetaData] = useSaveMetaDataMutation();

  const persistMetadata = async ({
    bundleId,
    headerLeftText,
    headerRightText,
    footerText,
  }: PersistMetadataOptions) => {
    if (!bundleId) {
      return;
    }

    try {
      await saveMetaData({
        bundleId,
        payload: {
          header_left: headerLeftText,
          header_right: headerRightText,
          footer: footerText,
        },
      }).unwrap();
    } catch (error) {
      console.error('Failed to save metadata:', error);
    }
  };

  return { persistMetadata };
};

export { default as useExportBundle } from './useExportBundle';

export default usePersistMetadata;
