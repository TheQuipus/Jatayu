import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { DigilockerDocument } from '../models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRIVATE_ROOT = path.resolve(__dirname, '..', 'private-storage', 'digilocker');
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
const IDENTITY_DOCUMENT_PATTERN = /aadhaar|aadhar|adhar|pan|passport|voter|driving|adhar|pancr|drvlic|drvcl/i;

function field(item, ...keys) {
  for (const key of keys) if (item?.[key] !== undefined && item[key] !== null) return String(item[key]);
  return '';
}

export function isIdentityDocument(item) {
  return IDENTITY_DOCUMENT_PATTERN.test([
    field(item, 'doctype', 'type'), field(item, 'name', 'description'),
    field(item, 'issuer', 'issuerid'),
  ].join(' '));
}

function extensionFor(contentType) {
  if (contentType.includes('pdf')) return '.pdf';
  if (contentType.includes('xml')) return '.xml';
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
  return '.bin';
}

function buildFileUrl(template, uri) {
  return template.replace('{uri}', encodeURIComponent(uri));
}

export async function downloadDigilockerDocuments({
  expertId,
  verificationId,
  documents,
  accessToken,
  fileUrlTemplate,
}) {
  if (!fileUrlTemplate) return [];
  const identityDocuments = documents.filter(isIdentityDocument);
  await fs.mkdir(path.join(PRIVATE_ROOT, expertId), { recursive: true, mode: 0o700 });

  return Promise.all(identityDocuments.map(async (item) => {
    const uri = field(item, 'uri', 'document_uri');
    if (!uri) return null;
    const documentKey = crypto.createHash('sha256').update(`${expertId}:${uri}`).digest('hex');
    const base = {
      expertId,
      verificationId,
      documentKey,
      documentUri: uri,
      documentType: field(item, 'doctype', 'type') || null,
      documentName: field(item, 'name', 'description') || null,
      issuerId: field(item, 'issuerid', 'issuer_id') || null,
      issuerName: field(item, 'issuer', 'issuer_name') || null,
    };
    try {
      const response = await fetch(buildFileUrl(fileUrlTemplate, uri), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/pdf, application/xml;q=0.9, image/*;q=0.8',
        },
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error(`DigiLocker file request failed with HTTP ${response.status}`);
      const declaredLength = Number(response.headers.get('content-length') || 0);
      if (declaredLength > MAX_DOCUMENT_BYTES) throw new Error('DigiLocker document exceeds 15 MB');
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length > MAX_DOCUMENT_BYTES) throw new Error('DigiLocker document exceeds 15 MB');
      const mimeType = (response.headers.get('content-type') || 'application/octet-stream').split(';')[0];
      const relativePath = path.join(expertId, `${documentKey}${extensionFor(mimeType)}`);
      await fs.writeFile(path.join(PRIVATE_ROOT, relativePath), buffer, { mode: 0o600 });
      const [record] = await DigilockerDocument.upsert({
        ...base,
        mimeType,
        storagePath: relativePath,
        fileSize: buffer.length,
        sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
        downloadStatus: 'downloaded',
        failureDescription: null,
        fetchedAt: new Date(),
      }, { returning: true });
      return record;
    } catch (error) {
      const [record] = await DigilockerDocument.upsert({
        ...base,
        downloadStatus: 'failed',
        failureDescription: error.message,
      }, { returning: true });
      return record;
    }
  })).then((items) => items.filter(Boolean));
}

export function resolvePrivateDocumentPath(storagePath) {
  const resolved = path.resolve(PRIVATE_ROOT, storagePath || '');
  if (!resolved.startsWith(`${PRIVATE_ROOT}${path.sep}`)) throw new Error('Invalid private document path');
  return resolved;
}
