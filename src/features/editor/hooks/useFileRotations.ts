import { useCallback, useState } from 'react';
import { useRotateDocumentMutation } from '@/features/file-explorer/api';

const normalizeRotation = (rotation: number) => ((rotation % 360) + 360) % 360;

type UseFileRotationsOptions = {
  bundleId?: string;
};

export const useFileRotations = ({ bundleId }: UseFileRotationsOptions) => {
  const [rotateDocument] = useRotateDocumentMutation();
  const [fileRotations, setFileRotations] = useState<Record<string, number>>(
    {}
  );
  const [fileUrlOverrides, setFileUrlOverrides] = useState<
    Record<string, string>
  >({});

  const handleRotateFile = useCallback(
    (fileId: string, delta: number) => {
      let nextRotation = 0;

      setFileRotations(prev => {
        const currentRotation = prev[fileId] ?? 0;
        nextRotation = normalizeRotation(currentRotation + delta);
        return {
          ...prev,
          [fileId]: nextRotation,
        };
      });

      rotateDocument({
        documentId: fileId,
        rotation: nextRotation,
        bundleId: bundleId || undefined,
      })
        .unwrap()
        .then(response => {
          if (!response.documentUrl) {
            return;
          }

          setFileUrlOverrides(prev => ({
            ...prev,
            [fileId]: response.documentUrl as string,
          }));

          setFileRotations(prev => {
            const currentRotation = prev[fileId];

            if (currentRotation === undefined) {
              return prev;
            }

            const remainingRotation = normalizeRotation(
              currentRotation - delta
            );

            if (remainingRotation === 0) {
              const { [fileId]: _removed, ...rest } = prev;
              return rest;
            }

            return {
              ...prev,
              [fileId]: remainingRotation,
            };
          });
        })
        .catch(error => {
          console.warn(
            'Rotate API call failed. Local rotation remains applied.',
            error
          );
        });
    },
    [bundleId, rotateDocument]
  );

  const resetRotations = useCallback(() => {
    setFileRotations({});
    setFileUrlOverrides({});
  }, []);

  return {
    fileRotations,
    fileUrlOverrides,
    handleRotateFile,
    resetRotations,
  };
};
