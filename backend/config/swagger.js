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
    { name: 'Calendar Sync' },
    { name: 'Seeker Auth' },
    { name: 'Seeker' },
    { name: 'Bookings' },
    { name: 'Transcription' },
    { name: 'Public Experts' },
    { name: 'Admin' },
    { name: 'Payments' },
    { name: 'Notifications' },
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
    '/api/seeker/bookings/{bookingId}/review': {
      get: operation({ tag: 'Reviews', summary: 'Get own booking review and eligibility', security: bearerSecurity, parameters: [idParameter('bookingId', 'Booking ID')] }),
      post: operation({ tag: 'Reviews', summary: 'Review a completed booking once; identical retries return existing review', security: bearerSecurity, parameters: [idParameter('bookingId', 'Booking ID')], requestBody: jsonBody('rating: integer 1–5; comment: optional string, maximum 5000 characters'), responses: { 201: response('Saved; creditsAwarded: 15 and creditBalance returned'), 200: response('Identical retry; creditsAwarded: 0'), 404: response('Booking not owned or missing'), 409: response('Incomplete booking or already reviewed'), 422: response('Invalid input') } }),
    },
    '/api/expert/reviews': {
      get: operation({ tag: 'Reviews', summary: 'Own reviews, summary and rating trends', security: bearerSecurity, parameters: ['page', 'limit', 'filter', 'sort'].map((name) => ({ in: 'query', name, schema: { type: 'string' }, description: name === 'filter' ? 'all | needsReply | fiveStar | recent (30 days)' : name === 'sort' ? 'recent | highest | lowest' : 'Pagination; limit at most 100' })) }),
    },
    '/api/expert/reviews/{reviewId}/reply': {
      put: operation({ tag: 'Reviews', summary: 'Save reply to own review', security: bearerSecurity, parameters: [idParameter('reviewId', 'Review ID')], requestBody: jsonBody('reply: string, 1–5000 characters') }),
    },
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
    '/api/expert/security': {
      get: operation({ tag: 'Expert Security', summary: 'Get account security, sessions, and login history', security: bearerSecurity }),
    },
    '/api/expert/security/two-factor': {
      patch: operation({ tag: 'Expert Security', summary: 'Enable or disable login OTP', security: bearerSecurity, requestBody: jsonBody() }),
    },
    '/api/expert/security/password': {
      patch: operation({ tag: 'Expert Security', summary: 'Set or change account password', security: bearerSecurity, requestBody: jsonBody() }),
    },
    '/api/expert/security/sessions/logout-others': {
      post: operation({ tag: 'Expert Security', summary: 'Revoke all sessions except the current session', security: bearerSecurity }),
    },
    '/api/expert/security/sessions/{sessionId}': {
      delete: operation({ tag: 'Expert Security', summary: 'Revoke one active session', security: bearerSecurity, parameters: [{ in: 'path', name: 'sessionId', required: true, schema: { type: 'string', format: 'uuid' } }] }),
    },
    '/api/expert/security/contact/request': {
      post: operation({ tag: 'Expert Security', summary: 'Send verification OTP to a new email or phone', security: bearerSecurity, requestBody: jsonBody() }),
    },
    '/api/expert/security/contact/verify': {
      post: operation({ tag: 'Expert Security', summary: 'Verify and save a new email or phone', security: bearerSecurity, requestBody: jsonBody() }),
    },
    '/api/expert/notification-preferences': {
      get: operation({ tag: 'Expert Notifications', summary: 'Get expert channel preferences', security: bearerSecurity }),
      put: operation({ tag: 'Expert Notifications', summary: 'Save expert channel preferences', security: bearerSecurity, requestBody: jsonBody() }),
    },
    '/api/expert/account/export': {
      get: operation({ tag: 'Expert Account', summary: 'Export authenticated expert account data', security: bearerSecurity }),
    },
    '/api/expert/account/logout': {
      post: operation({ tag: 'Expert Account', summary: 'Revoke the current expert session', security: bearerSecurity }),
    },
    '/api/expert/account': {
      delete: operation({ tag: 'Expert Account', summary: 'Soft-delete the authenticated expert account', security: bearerSecurity, requestBody: jsonBody() }),
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
          { in: 'query', name: 'status', description: 'Upcoming/accepted and cancelled/declined are compatible aliases.', schema: { type: 'string', enum: ['all', 'new', 'pending', 'upcoming', 'completed', 'cancelled', 'accepted', 'declined'] } },
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
    '/api/expert/requests/{bookingId}/messages': {
      get: operation({ tag: 'Bookings', summary: 'Get persisted booking chat history as expert', security: bearerSecurity, parameters: [idParameter('bookingId', 'Booking ID')] }),
      post: operation({ tag: 'Bookings', summary: 'Persist and deliver a booking chat message as expert', security: bearerSecurity, parameters: [idParameter('bookingId', 'Booking ID')], requestBody: jsonBody('message and unique clientMessageId') }),
    },
    '/api/expert/requests/{bookingId}/messages/read': {
      patch: operation({ tag: 'Bookings', summary: 'Mark seeker booking messages read by expert', security: bearerSecurity, parameters: [idParameter('bookingId', 'Booking ID')] }),
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
        parameters: [
          idParameter('expertId', 'Expert ID'),
          { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 90, default: 28 }, description: 'Requested availability range. The expert advance-booking window may reduce it.' },
        ],
      }),
    },
    '/api/seeker/bookings': {
      get: operation({ tag: 'Bookings', summary: 'List seeker bookings', security: bearerSecurity }),
    },
    '/api/seeker/bookings/orders': {
      post: operation({
        tag: 'Bookings',
        summary: 'Create a booking and Razorpay order',
        security: bearerSecurity,
        requestBody: jsonBody('Include durationMinutes as a whole number from 1 to 360. It defaults to 30 for backward compatibility.'),
      }),
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
    '/api/seeker/bookings/{bookingId}/extension/verify-payment': {
      post: operation({
        tag: 'Bookings', summary: 'Verify extension Razorpay payment and activate extended time', security: bearerSecurity,
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
    '/api/seeker/bookings/{bookingId}/messages': {
      get: operation({ tag: 'Bookings', summary: 'Get persisted booking chat history as seeker', security: bearerSecurity, parameters: [idParameter('bookingId', 'Booking ID')] }),
      post: operation({ tag: 'Bookings', summary: 'Persist and deliver a booking chat message as seeker', security: bearerSecurity, parameters: [idParameter('bookingId', 'Booking ID')], requestBody: jsonBody('message and unique clientMessageId') }),
    },
    '/api/seeker/bookings/{bookingId}/messages/read': {
      patch: operation({ tag: 'Bookings', summary: 'Mark expert booking messages read by seeker', security: bearerSecurity, parameters: [idParameter('bookingId', 'Booking ID')] }),
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
    '/api/expert/calendar-connections': {
      get: operation({ tag: 'Calendar Sync', summary: 'List Google and Microsoft calendar connection status', security: bearerSecurity }),
    },
    '/api/expert/requests/{bookingId}': {
      get: operation({ tag: 'Bookings', summary: 'Get one assigned booking request with dynamic seeker, schedule, payment, and status details', security: bearerSecurity,
        parameters: [idParameter('bookingId', 'Booking ID')] }),
    },
    '/api/expert/earnings': {
      get: operation({ tag: 'Bookings', summary: 'Get dynamic expert earnings, revenue charts, transactions, invoices, and payout configuration', security: bearerSecurity }),
    },
    '/api/expert/calendar-connections/{provider}/connect': {
      post: operation({ tag: 'Calendar Sync', summary: 'Start delegated calendar OAuth connection', security: bearerSecurity,
        parameters: [{ in: 'path', name: 'provider', required: true, schema: { type: 'string', enum: ['google', 'microsoft'] } }] }),
    },
    '/api/expert/calendar-connections/{provider}/callback': {
      get: operation({ tag: 'Calendar Sync', summary: 'OAuth provider callback (redirect URI)',
        parameters: [{ in: 'path', name: 'provider', required: true, schema: { type: 'string', enum: ['google', 'microsoft'] } }, { in: 'query', name: 'code', schema: { type: 'string' } }, { in: 'query', name: 'state', schema: { type: 'string' } }] }),
    },
    '/api/expert/calendar-connections/{provider}/sync': {
      post: operation({ tag: 'Calendar Sync', summary: 'Synchronize future confirmed bookings now', security: bearerSecurity,
        parameters: [{ in: 'path', name: 'provider', required: true, schema: { type: 'string', enum: ['google', 'microsoft'] } }] }),
    },
    '/api/expert/calendar-connections/{provider}': {
      delete: operation({ tag: 'Calendar Sync', summary: 'Disconnect an external calendar', security: bearerSecurity,
        parameters: [{ in: 'path', name: 'provider', required: true, schema: { type: 'string', enum: ['google', 'microsoft'] } }] }),
    },
    '/api/payments/razorpay/config': {
      get: operation({ tag: 'Payments', summary: 'Get public Razorpay Checkout configuration' }),
    },
    '/api/notifications': {
      get: operation({ tag: 'Notifications', summary: 'List persisted notifications for the authenticated user', security: bearerSecurity,
        parameters: [{ in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } }, { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100 } }] }),
    },
    '/api/notifications/read-all': {
      patch: operation({ tag: 'Notifications', summary: 'Mark all notifications as read', security: bearerSecurity }),
    },
    '/api/notifications/{id}/read': {
      patch: operation({ tag: 'Notifications', summary: 'Mark one notification as read', security: bearerSecurity, parameters: [idParameter('id', 'Notification ID')] }),
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
