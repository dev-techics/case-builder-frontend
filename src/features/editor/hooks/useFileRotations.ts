import { useCallback, useState } from 'react';
import { useRotateDocumentMutation } from '@/features/file-explorer/api';

const normalizeRotation = (rotation: number) =>
  ((rotation % 360) + 360) % 360;

type UseFileRotationsOptions = {
  bundleId?: string;
};

export const useFileRotations = ({ bundleId }: UseFileRotationsOptions) => {
  const [rotateDocument] = useRotateDocumentMutation();
  const [fileRotations, setFileRotations] = useState<Record<string, number>>(
    {}
  );

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
  }, []);

  return { fileRotations, handleRotateFile, resetRotations };
};
