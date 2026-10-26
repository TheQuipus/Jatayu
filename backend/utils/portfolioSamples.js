const MIME_TYPES_BY_EXTENSION = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function decodeDataUrl(dataUrl, expectedMimeType) {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match || match[1].toLowerCase() !== expectedMimeType) {
    throw new TypeError('Portfolio sample must be a valid base64 data URL with a matching MIME type');
  }

  const encoded = match[2];
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.length === 0 || bytes.toString('base64') !== encoded) {
    throw new TypeError('Portfolio sample contains malformed base64 data');
  }
  if (bytes.length > MAX_FILE_BYTES) {
    throw new RangeError('Portfolio files must be 5 MB or smaller');
  }
  return bytes;
}

function hasValidSignature(extension, bytes) {
  if (extension === '.pdf') {
    return bytes.subarray(0, 5).toString('ascii') === '%PDF-';
  }
  if (extension === '.docx') {
    return bytes.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
      && bytes.includes(Buffer.from('[Content_Types].xml'))
      && bytes.includes(Buffer.from('word/document.xml'));
  }
  return false;
}

export function validatePortfolioSamples(samples) {
  if (!Array.isArray(samples)) {
    throw new TypeError('Portfolio samples must be an array');
  }

  for (const sample of samples) {
    if (!sample || typeof sample !== 'object' || Array.isArray(sample)) {
      throw new TypeError('Portfolio sample is invalid');
    }
    if (typeof sample.fileName !== 'string' || typeof sample.url !== 'string') {
      throw new TypeError('Portfolio sample must include a file name and data URL');
    }

    const extension = sample.fileName.slice(sample.fileName.lastIndexOf('.')).toLowerCase();
    const expectedMimeType = MIME_TYPES_BY_EXTENSION[extension];
    if (!expectedMimeType) {
      throw new TypeError('Only PDF and DOCX portfolio files are allowed');
    }

    const bytes = decodeDataUrl(sample.url, expectedMimeType);
    if (!hasValidSignature(extension, bytes)) {
      throw new TypeError('Portfolio sample content does not match its file format');
    }
  }

  return samples;
}
