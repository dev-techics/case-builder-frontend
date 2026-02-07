import axiosInstance from '@/api/axiosInstance';

/*----------------------------
    Upload File to the server
------------------------------*/
export const UploadFile = async (
  bundleId: string,
  formData: FormData,
  uploadProgress: (percent: number) => void
) => {
  const response = await axiosInstance.post(
    `/api/bundles/${bundleId}/documents/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: progressEvent => {
        if (!progressEvent.total) return;

        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );

        uploadProgress(percent);
      },
    }
  );

  return response;
};
