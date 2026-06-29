import { auditImage } from '@/generated';
import type { AuditImageResp, StorageObject } from '@/generated/arca_apiComponents';

import { uploadPersonaAvatarToTos } from '@/features/chat/lib/tos-upload';

function isAuditPassed(audit: AuditImageResp | null | undefined): boolean {
  if (audit == null) return true;
  return audit.passed !== false;
}

export class PersonaAvatarAuditError extends Error {
  constructor(message?: string) {
    super(message ?? 'Image audit failed');
    this.name = 'PersonaAvatarAuditError';
  }
}

export async function uploadPersonaAvatar(fileUri: string): Promise<StorageObject> {
  const upload = await uploadPersonaAvatarToTos(fileUri);
  const audit = await auditImage({ audit_url: upload.url });

  if (!isAuditPassed(audit)) {
    throw new PersonaAvatarAuditError(audit?.msg);
  }

  return upload.storageObject;
}
