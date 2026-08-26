import { DigilockerVerification, Expert } from '../models/index.js';
import {
  createAuthorization,
  exchangeAuthorizationCode,
  fetchDigilockerResource,
  getDigilockerConfig,
  hashState,
  readIdTokenClaims,
  safeAccountDetails,
} from '../services/digilockerService.js';

function redirectWithResult(res, returnUrl, result) {
  const url = new URL(returnUrl);
  url.searchParams.set('kyc', result);
  return res.redirect(302, url.toString());
}

function documentsFromResponse(data) {
  if (Array.isArray(data)) return data;
  for (const key of ['items', 'documents', 'issued_documents', 'issuedDocuments']) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

function publicVerification(record) {
  if (!record) return null;
  return {
    status: record.status,
    accountDetails: record.accountDetails,
    issuedDocuments: record.issuedDocuments || [],
    consentValidTill: record.consentValidTill,
    verifiedAt: record.verifiedAt,
    failureCode: record.failureCode,
    failureDescription: record.failureDescription,
  };
}

export const startDigilockerKyc = async (req, res) => {
  try {
    const config = await getDigilockerConfig();
    if (!config.configured) {
      return res.status(503).json({
        message: 'DigiLocker verification is not configured',
        code: 'DIGILOCKER_NOT_CONFIGURED',
      });
    }
    const auth = createAuthorization(config);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await DigilockerVerification.upsert({
      expertId: req.user.id,
      status: 'authorization_pending',
      stateHash: hashState(auth.state),
      codeVerifier: auth.codeVerifier,
      authorizationExpiresAt: expiresAt,
      failureCode: null,
      failureDescription: null,
    });
    return res.json({ authorizationUrl: auth.authorizationUrl, sandbox: config.sandbox });
  } catch (error) {
    console.error('Start DigiLocker KYC Error:', error.message);
    return res.status(500).json({ message: 'Could not start DigiLocker verification' });
  }
};

export const getDigilockerKycStatus = async (req, res) => {
  try {
    const [config, verification] = await Promise.all([
      getDigilockerConfig(),
      DigilockerVerification.findOne({ where: { expertId: req.user.id } }),
    ]);
    const documents = verification?.issuedDocuments || [];
    const identityDocument = documents.find((item) =>
      /aadhaar|aadhar|pan|passport|voter|driving/i.test(String(item?.doctype || item?.type || item?.name || item?.description || ''))
    );
    return res.json({
      configured: config.configured,
      sandbox: config.sandbox,
      kyc: publicVerification(verification),
      governmentId: identityDocument ? {
        source: 'digilocker',
        type: identityDocument.doctype || identityDocument.type || 'identity',
        uri: identityDocument.uri || identityDocument.document_uri || null,
        issuer: identityDocument.issuer || identityDocument.issuerid || null,
        name: identityDocument.name || identityDocument.description || null,
      } : null,
    });
  } catch (error) {
    console.error('Get DigiLocker KYC Status Error:', error.message);
    return res.status(500).json({ message: 'Could not retrieve DigiLocker verification status' });
  }
};

export const handleDigilockerCallback = async (req, res) => {
  const config = await getDigilockerConfig();
  const { code, state, error: providerError, error_description: providerDescription } = req.query;
  if (!config.frontendReturnUrl) return res.status(500).send('DigiLocker return URL is not configured');
  if (!state) return redirectWithResult(res, config.frontendReturnUrl, 'error');

  const verification = await DigilockerVerification.findOne({ where: { stateHash: hashState(String(state)) } });
  if (!verification || !verification.authorizationExpiresAt || verification.authorizationExpiresAt < new Date()) {
    return redirectWithResult(res, config.frontendReturnUrl, 'error');
  }
  if (providerError || !code) {
    verification.status = providerError === 'access_denied' ? 'denied' : 'failed';
    verification.failureCode = providerError || 'AUTHORIZATION_CODE_MISSING';
    verification.failureDescription = providerDescription || 'DigiLocker authorization was not completed';
    verification.stateHash = null;
    verification.codeVerifier = null;
    await verification.save();
    return redirectWithResult(res, config.frontendReturnUrl, verification.status === 'denied' ? 'denied' : 'error');
  }

  try {
    const token = await exchangeAuthorizationCode(config, String(code), verification.codeVerifier);
    const idTokenClaims = readIdTokenClaims(token.id_token, config.clientId);
    const account = config.accountUrl
      ? await fetchDigilockerResource(config.accountUrl, token.access_token, 'DigiLocker account lookup')
      : idTokenClaims || token;
    const issued = config.issuedDocumentsUrl
      ? await fetchDigilockerResource(config.issuedDocumentsUrl, token.access_token, 'DigiLocker issued documents lookup')
      : [];
    verification.status = 'verified';
    verification.digilockerAccountId = account.digilockerid || account.id || account.sub || null;
    verification.accountDetails = safeAccountDetails(account);
    verification.issuedDocuments = documentsFromResponse(issued);
    verification.consentValidTill = token.consent_valid_till
      ? new Date(Number(token.consent_valid_till) * 1000)
      : null;
    verification.verifiedAt = new Date();
    verification.failureCode = null;
    verification.failureDescription = null;
    verification.stateHash = null;
    verification.codeVerifier = null;
    await verification.save();

    const expert = await Expert.findByPk(verification.expertId);
    if (expert) {
      const metadata = expert.onboardingMetadata && typeof expert.onboardingMetadata === 'object'
        ? expert.onboardingMetadata
        : {};
      expert.onboardingMetadata = {
        ...metadata,
        digilockerKyc: {
          status: 'verified',
          verifiedAt: verification.verifiedAt,
          accountDetails: verification.accountDetails,
        },
      };
      await expert.save();
    }
    return redirectWithResult(res, config.frontendReturnUrl, 'success');
  } catch (error) {
    console.error('DigiLocker callback Error:', error.message);
    verification.status = 'failed';
    verification.failureCode = error.code || 'DIGILOCKER_CALLBACK_FAILED';
    verification.failureDescription = error.providerDescription || error.message;
    verification.stateHash = null;
    verification.codeVerifier = null;
    await verification.save();
    return redirectWithResult(res, config.frontendReturnUrl, 'error');
  }
};
