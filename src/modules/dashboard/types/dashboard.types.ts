import { DocumentType } from '@prisma/client';

export type NearestDocumentRow = {
  vehicleId: string;
  expireDate: Date;
  type: DocumentType;
};
