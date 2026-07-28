export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_UPLOAD_MB = 5;

export const formatFileSize = (bytes) => {
  const size = Number(bytes || 0);
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }
  return `${size} B`;
};

export const validateImageFileSize = (file) => {
  if (!file || file.size <= MAX_IMAGE_UPLOAD_BYTES) {
    return null;
  }
  return `Image must be ${MAX_IMAGE_UPLOAD_MB} MB or smaller (selected file is ${formatFileSize(file.size)}).`;
};
