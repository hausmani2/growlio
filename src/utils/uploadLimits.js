export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_UPLOAD_MB = 5;
export const MAX_FILE_UPLOAD_BYTES = MAX_IMAGE_UPLOAD_BYTES;
export const MAX_FILE_UPLOAD_MB = MAX_IMAGE_UPLOAD_MB;

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

export const validateFileUploadSize = (file) => {
  if (!file || file.size <= MAX_FILE_UPLOAD_BYTES) {
    return null;
  }
  return `File must be ${MAX_FILE_UPLOAD_MB} MB or smaller (selected file is ${formatFileSize(file.size)}).`;
};

export const ACCEPT_IMAGE_OR_PDF =
  '.pdf,.png,.jpg,.jpeg,.webp,.gif,application/pdf,image/png,image/jpeg,image/webp,image/gif';

export const isImageOrPdfFile = (file) => {
  if (!file) return false;
  const name = String(file.name || '').toLowerCase();
  const type = String(file.type || '').toLowerCase();
  if (type === 'application/pdf' || name.endsWith('.pdf')) return true;
  if (type.startsWith('image/')) return true;
  return /\.(png|jpe?g|webp|gif)$/i.test(name);
};
