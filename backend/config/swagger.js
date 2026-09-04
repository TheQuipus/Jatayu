const bearerSecurity = [{ bearerAuth: [] }];

const jsonBody = (description = 'Request payload') => ({
  required: true,
  content: {
    'application/json': {
      schema: { type: 'object', description, additionalProperties: true },
    },
  },
});

const response = (description) => ({ description });

const operation = ({ tag, summary, security, requestBody, parameters, responses }) => ({
  tags: [tag],
  summary,
  ...(security ? { security } : {}),
  ...(requestBody ? { requestBody } : {}),
  ...(parameters ? { parameters } : {}),
  responses: responses || {
    200: response('Successful response'),
    400: response('Invalid request'),
    500: response('Server error'),
  },
});

const idParameter = (name, description) => ({
  in: 'path',
  name,
  required: true,
  description,
  schema: { type: 'string', format: 'uuid' },
});

const authPaths = (prefix, tag) => ({
  [`${prefix}/register`]: {
    post: operation({ tag, summary: 'Register with email or phone', requestBody: jsonBody() }),
  },
  [`${prefix}/verify-otp`]: {
    post: operation({ tag, summary: 'Verify registration OTP', requestBody: jsonBody() }),
  },
  [`${prefix}/resend-otp`]: {
    post: operation({ tag, summary: 'Resend OTP', requestBody: jsonBody() }),
  },
  [`${prefix}/login`]: {
    post: operation({ tag, summary: 'Log in', requestBody: jsonBody() }),
  },
  [`${prefix}/google`]: {
    post: operation({ tag, summary: 'Authenticate with Google', requestBody: jsonBody() }),
  },
  [`${prefix}/linkedin`]: {
    post: operation({ tag, summary: 'Authenticate with LinkedIn', requestBody: jsonBody() }),
  },
  [`${prefix}/config`]: {
    get: operation({ tag, summary: 'Get public authentication configuration' }),
  },
});

export const createOpenApiDocument = ({ serverUrl = '/' } = {}) => ({
  openapi: '3.0.3',
  info: {
    title: 'Jatayu API',
    version: '1.0.0',
    description: 'Interactive documentation for the Jatayu backend APIs.',
  },
  servers: [{ url: serverUrl, description: 'Current environment' }],
  tags: [
    { name: 'Health' },
    { name: 'Expert Auth' },
    { name: 'Expert' },
    { name: 'Seeker Auth' },
    { name: 'Seeker' },
    { name: 'Bookings' },
    { name: 'Transcription' },
    { name: 'Public Experts' },
    { name: 'Admin' },
    { name: 'Payments' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the JWT returned by the relevant login endpoint.',
      },
    },
    schemas: {
      TranscriptSegmentInput: {
        type: 'object',
        required: ['speakerUid', 'sequence', 'startMs', 'text', 'isFinal'],
        properties: {
          speakerUid: { type: 'string', example: '1', description: 'Agora RTC UID: 1 for seeker, 2 for expert.' },
          sequence: { type: 'integer', minimum: 0, example: 12 },
          startMs: { type: 'integer', minimum: 0, example: 15300 },
          durationMs: { type: 'integer', minimum: 0, example: 2400 },
          language: { type: 'string', example: 'en-US' },
          text: { type: 'string', maxLength: 10000, example: 'Here is the next step I recommend.' },
          confidence: { type: 'number', nullable: true, example: 0.97 },
          isFinal: { type: 'boolean', enum: [true], example: true },
          providerTimestamp: { type: 'integer', nullable: true, example: 1788515100000 },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: operation({ tag: 'Health', summary: 'Check backend health' }),
    },
    '/health/ws': {
      get: operation({ tag: 'Health', summary: 'Check WebSocket availability' }),
    },
    ...authPaths('/api/auth', 'Expert Auth'),
    ...authPaths('/api/seeker-auth', 'Seeker Auth'),
    '/api/expert/me': {
      get: operation({ tag: 'Expert', summary: 'Get authenticated expert profile', security: bearerSecurity }),
    },
    '/api/expert/profile': {
      put: operation({
        tag: 'Expert', summary: 'Save expert profile or onboarding step', security: bearerSecurity,
        requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', additionalProperties: true } } } },
      }),
    },
    '/api/expert/submit': {
      post: operation({ tag: 'Expert', summary: 'Submit expert onboarding', security: bearerSecurity, requestBody: jsonBody() }),
    },
    '/api/expert/onboarding/ai-suggest': {
      post: operation({ tag: 'Expert', summary: 'Generate AI suggestions for onboarding tagline and bio', security: bearerSecurity, requestBody: jsonBody() }),
    },
    '/api/expert/onboarding/recommend-skills': {
      post: operation({ tag: 'Expert', summary: 'Generate AI skill recommendations for expert onboarding', security: bearerSecurity, requestBody: jsonBody() }),
    },
    '/api/expert/kyc/digilocker/start': {
      post: operation({ tag: 'Expert', summary: 'Start DigiLocker identity verification', security: bearerSecurity }),
    },
    '/api/expert/kyc/digilocker/status': {
      get: operation({ tag: 'Expert', summary: 'Get DigiLocker verification status', security: bearerSecurity }),
    },
    '/api/expert/kyc/digilocker/callback': {
      get: operation({
        tag: 'Expert',
        summary: 'Receive DigiLocker OAuth callback',
        parameters: [
          { in: 'query', name: 'code', schema: { type: 'string' } },
          { in: 'query', name: 'state', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'error', schema: { type: 'string' } },
        ],
      }),
    },
    '/api/expert/requests': {
      get: operation({
        tag: 'Expert', summary: 'List and filter booking requests', security: bearerSecurity,
        parameters: [
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['all', 'new', 'pending', 'accepted', 'declined'] } },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1, default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, default: 20 } },
          { in: 'query', name: 'sort', schema: { type: 'string', enum: ['newest', 'oldest'] } },
        ],
      }),
    },
    '/api/expert/requests/{bookingId}/decision': {
      patch: operation({
        tag: 'Expert', summary: 'Accept or decline a booking request', security: bearerSecurity,
        parameters: [idParameter('bookingId', 'Booking/request ID')], requestBody: jsonBody(),
      }),
    },
    '/api/expert/requests/{bookingId}/transcription/start': {
      post: operation({
        tag: 'Transcription', summary: 'Start Agora live transcription as the assigned expert', security: bearerSecurity,
        parameters: [idParameter('bookingId', 'Confirmed booking ID')],
      }),
    },
    '/api/expert/requests/{bookingId}/transcription/stop': {
      post: operation({
        tag: 'Transcription', summary: 'Stop Agora live transcription as the assigned expert', security: bearerSecurity,
        parameters: [idParameter('bookingId', 'Booking ID')],
      }),
    },
    '/api/expert/requests/{bookingId}/transcription/segments': {
      post: operation({
        tag: 'Transcription', summary: 'Persist a finalized Agora transcript segment as the assigned expert', security: bearerSecurity,
        parameters: [idParameter('bookingId', 'Booking ID')],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TranscriptSegmentInput' } } },
        },
      }),
    },
    '/api/expert/requests/{bookingId}/transcript': {
      get: operation({
        tag: 'Transcription', summary: 'Get the stored booking transcript as the assigned expert', security: bearerSecurity,
        parameters: [idParameter('bookingId', 'Booking ID')],
      }),
    },
    '/api/seeker/me': {
      get: operation({ tag: 'Seeker', summary: 'Get authenticated seeker profile and credits', security: bearerSecurity }),
    },
    '/api/seeker/profile': {
      put: operation({
        tag: 'Seeker', summary: 'Save seeker onboarding step', security: bearerSecurity,
        requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', additionalProperties: true } } } },
      }),
    },
    '/api/seeker/submit': {
      post: operation({
        tag: 'Seeker', summary: 'Submit seeker onboarding', security: bearerSecurity,
        requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', additionalProperties: true } } } },
      }),
    },
    '/api/seeker/featured-matches': {
      get: operation({ tag: 'Seeker', summary: 'Get featured expert matches', security: bearerSecurity }),
    },
    '/api/seeker/ai-improve-needs': {
      post: operation({
        tag: 'Seeker',
        summary: 'Improve seeker consultation request copy with AI across 3 tones based on subject and goals',
        requestBody: jsonBody('Payload with subject, userText/needsText, and selectedGoals'),
      }),
    },

    '/api/seeker/experts/{expertId}/booking-options': {
      get: operation({
        tag: 'Bookings', summary: 'Get expert availability and booking options', security: bearerSecurity,
        parameters: [idParameter('expertId', 'Expert ID')],
      }),
    },
    '/api/seeker/bookings': {
      get: operation({ tag: 'Bookings', summary: 'List seeker bookings', security: bearerSecurity }),
    },
    '/api/seeker/bookings/orders': {
      post: operation({ tag: 'Bookings', summary: 'Create a booking and Razorpay order', security: bearerSecurity, requestBody: jsonBody() }),
    },
    '/api/seeker/bookings/{bookingId}': {
      get: operation({
        tag: 'Bookings', summary: 'Get a booking', security: bearerSecurity,
        parameters: [idParameter('bookingId', 'Booking ID')],
      }),
    },
    '/api/seeker/bookings/{bookingId}/verify-payment': {
      post: operation({
        tag: 'Bookings', summary: 'Verify Razorpay payment and finalize booking payment', security: bearerSecurity,
        parameters: [idParameter('bookingId', 'Booking ID')], requestBody: jsonBody(),
      }),
    },
    '/api/seeker/bookings/{bookingId}/transcription/start': {
      post: operation({
        tag: 'Transcription', summary: 'Start Agora live transcription as the booking seeker', security: bearerSecurity,
        parameters: [idParameter('bookingId', 'Confirmed booking ID')],
      }),
    },
    '/api/seeker/bookings/{bookingId}/transcription/stop': {
      post: operation({
        tag: 'Transcription', summary: 'Stop Agora live transcription as the booking seeker', security: bearerSecurity,
        parameters: [idParameter('bookingId', 'Booking ID')],
      }),
    },
    '/api/seeker/bookings/{bookingId}/transcription/segments': {
      post: operation({
        tag: 'Transcription', summary: 'Persist a finalized Agora transcript segment as the booking seeker', security: bearerSecurity,
        parameters: [idParameter('bookingId', 'Booking ID')],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TranscriptSegmentInput' } } },
        },
      }),
    },
    '/api/seeker/bookings/{bookingId}/transcript': {
      get: operation({
        tag: 'Transcription', summary: 'Get the stored booking transcript as the booking seeker', security: bearerSecurity,
        parameters: [idParameter('bookingId', 'Booking ID')],
      }),
    },
    '/api/public/experts': {
      get: operation({
        tag: 'Public Experts', summary: 'Search and filter experts',
        parameters: [
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'category', schema: { type: 'string' } },
          { in: 'query', name: 'language', schema: { type: 'string' } },
          { in: 'query', name: 'minPrice', schema: { type: 'number' } },
          { in: 'query', name: 'maxPrice', schema: { type: 'number' } },
          { in: 'query', name: 'availability', schema: { type: 'string' } },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1 } },
        ],
      }),
    },
    '/api/public/experts/{expertId}': {
      get: operation({ tag: 'Public Experts', summary: 'Get public expert details', parameters: [idParameter('expertId', 'Expert ID')] }),
    },
    '/api/admin/auth/login': {
      post: operation({ tag: 'Admin', summary: 'Admin login', requestBody: jsonBody() }),
    },
    '/api/admin/auth/me': {
      get: operation({ tag: 'Admin', summary: 'Get authenticated admin', security: bearerSecurity }),
    },
    '/api/admin/settings': {
      get: operation({ tag: 'Admin', summary: 'Get admin settings', security: bearerSecurity }),
      put: operation({ tag: 'Admin', summary: 'Update admin settings', security: bearerSecurity, requestBody: jsonBody() }),
    },
    '/api/admin/applications/stats': {
      get: operation({ tag: 'Admin', summary: 'Get expert application statistics', security: bearerSecurity }),
    },
    '/api/admin/applications': {
      get: operation({
        tag: 'Admin',
        summary: 'List expert applications with server-side pagination',
        security: bearerSecurity,
        parameters: [
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['all', 'pending', 'in_review', 'on_hold', 'approved', 'rejected'] } },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1, default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        ],
      }),
    },
    '/api/admin/applications/{id}': {
      get: operation({ tag: 'Admin', summary: 'Get an expert application', security: bearerSecurity, parameters: [idParameter('id', 'Application ID')] }),
    },
    '/api/admin/applications/{id}/digilocker-documents': {
      get: operation({
        tag: 'Admin', summary: 'List privately stored DigiLocker documents', security: bearerSecurity,
        parameters: [idParameter('id', 'Application UUID or application number')],
      }),
    },
    '/api/admin/applications/{id}/digilocker-documents/{documentId}/file': {
      get: operation({
        tag: 'Admin', summary: 'View a private DigiLocker document', security: bearerSecurity,
        parameters: [
          idParameter('id', 'Application UUID or application number'),
          idParameter('documentId', 'DigiLocker document ID'),
        ],
      }),
    },
    '/api/admin/applications/{id}/status': {
      patch: operation({
        tag: 'Admin', summary: 'Update expert application status', security: bearerSecurity,
        parameters: [idParameter('id', 'Application ID')], requestBody: jsonBody(),
      }),
    },
    '/api/admin/bookings/{bookingId}/transcript': {
      get: operation({
        tag: 'Transcription', summary: 'Get any stored booking transcript as an administrator', security: bearerSecurity,
        parameters: [idParameter('bookingId', 'Booking ID')],
      }),
    },
    '/api/payments/razorpay/config': {
      get: operation({ tag: 'Payments', summary: 'Get public Razorpay Checkout configuration' }),
    },
    '/api/payments/webhooks/razorpay': {
      post: operation({
        tag: 'Payments', summary: 'Receive a signed Razorpay webhook',
        parameters: [{ in: 'header', name: 'X-Razorpay-Signature', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } } },
      }),
    },
  },
});
