export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface ValidateFileParams {
  allowedMimeTypes: string[];
  maxSizeBytes: number;
}
