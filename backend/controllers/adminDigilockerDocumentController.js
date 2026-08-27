import fs from 'fs/promises';
import { Op } from 'sequelize';
import { DigilockerDocument, Expert } from '../models/index.js';
import { resolvePrivateDocumentPath } from '../services/digilockerDocumentService.js';

async function findApplication(id) {
  return Expert.findOne({ where: { [Op.or]: [{ id }, { applicationNumber: id }] } });
}

function serialize(document) {
  return {
    id: document.id,
    documentType: document.documentType,
    documentName: document.documentName,
    issuerId: document.issuerId,
    issuerName: document.issuerName,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
    sha256: document.sha256,
    downloadStatus: document.downloadStatus,
    failureDescription: document.failureDescription,
    fetchedAt: document.fetchedAt,
    available: document.downloadStatus === 'downloaded' && Boolean(document.storagePath),
  };
}

export const listApplicationDigilockerDocuments = async (req, res) => {
  try {
    const expert = await findApplication(req.params.id);
    if (!expert) return res.status(404).json({ message: 'Application not found' });
    const documents = await DigilockerDocument.findAll({
      where: { expertId: expert.id },
      order: [['fetchedAt', 'DESC'], ['createdAt', 'DESC']],
    });
    return res.json({ items: documents.map(serialize) });
  } catch (error) {
    console.error('List DigiLocker Documents Error:', error.message);
    return res.status(500).json({ message: 'Could not retrieve DigiLocker documents' });
  }
};

export const getApplicationDigilockerDocumentFile = async (req, res) => {
  try {
    const expert = await findApplication(req.params.id);
    if (!expert) return res.status(404).json({ message: 'Application not found' });
    const document = await DigilockerDocument.findOne({
      where: { id: req.params.documentId, expertId: expert.id },
    });
    if (!document || document.downloadStatus !== 'downloaded' || !document.storagePath) {
      return res.status(404).json({ message: 'DigiLocker document file is not available' });
    }
    const absolutePath = resolvePrivateDocumentPath(document.storagePath);
    await fs.access(absolutePath);
    const safeName = (document.documentName || document.documentType || 'digilocker-document')
      .replace(/[^a-zA-Z0-9._ -]/g, '_');
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.sendFile(absolutePath);
  } catch (error) {
    if (error.code === 'ENOENT') return res.status(404).json({ message: 'DigiLocker document file is missing' });
    console.error('Get DigiLocker Document File Error:', error.message);
    return res.status(500).json({ message: 'Could not retrieve DigiLocker document file' });
  }
};
