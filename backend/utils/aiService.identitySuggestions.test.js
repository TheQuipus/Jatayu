import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

let settings = {};

mock.module('./settingsHelper.js', {
  namedExports: {
    getSetting: async (name, fallback) => (
      Object.hasOwn(settings, name) ? settings[name] : fallback
    ),
  },
});

const { suggestExpertIdentityCopy } = await import('./aiService.js');

function configureAi() {
  settings = {
    AI_PROVIDER_NAME: 'OpenAI GPT-4o-mini',
    AI_API_KEY: 'test-key',
  };
}

function openAiResponse(text) {
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify(text) } }],
    }),
  };
}

test('generates each requested field and tone with profile context in a fresh request', async (t) => {
  configureAi();
  const originalFetch = globalThis.fetch;
  const calls = [];
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const field of ['tagLine', 'bio']) {
    for (const tone of ['professional', 'casual', 'concise']) {
      globalThis.fetch = async (_url, options) => {
        const request = JSON.parse(options.body);
        calls.push(request);
        const suggestion = `Fresh ${tone} ${field} ${calls.length}`;
        return openAiResponse({ [field]: suggestion });
      };

      const result = await suggestExpertIdentityCopy({
        field,
        tone,
        intent: 'regenerate',
        variantIndex: calls.length,
        fullName: 'Avery Expert',
        category: 'Design',
        professionalTitle: 'Product Designer',
        skills: ['Research', 'Prototyping'],
        languages: ['English'],
        employment: [{ jobTitle: 'Designer', company: 'Studio', responsibilities: 'Led product research' }],
        education: [{ degree: 'BA', fieldOfStudy: 'Design', institution: 'University' }],
        currentTagLine: 'Existing tagline',
        currentBio: 'Existing introduction',
      });

      assert.equal(result[field], `Fresh ${tone} ${field} ${calls.length}`);
      assert.equal(result[field === 'tagLine' ? 'bio' : 'tagLine'], undefined);
      assert.equal(result.source, 'ai');
      const prompt = calls.at(-1).messages[1].content;
      assert.match(prompt, new RegExp(`Tone: ${tone}`));
      assert.match(prompt, new RegExp(`Field: ${field}`));
      assert.match(prompt, /Avery Expert/);
      assert.match(prompt, /Research, Prototyping/);
      assert.match(prompt, /Led product research/);
      assert.match(prompt, /University/);
      assert.match(prompt, /Existing tagline/);
      assert.match(prompt, /Existing introduction/);
    }
  }

  assert.equal(calls.length, 6);
});

test('repeated requests for one tone make separate provider calls and accept fresh results', async (t) => {
  configureAi();
  const originalFetch = globalThis.fetch;
  let callCount = 0;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => {
    callCount += 1;
    return openAiResponse({ tagLine: `Different tagline ${callCount}` });
  };

  const context = { field: 'tagLine', tone: 'casual', currentTagLine: 'Current tagline' };
  const first = await suggestExpertIdentityCopy({ ...context, variantIndex: 0 });
  const second = await suggestExpertIdentityCopy({ ...context, variantIndex: 1 });

  assert.equal(callCount, 2);
  assert.notEqual(first.tagLine, second.tagLine);
  assert.equal(first.source, 'ai');
  assert.equal(second.source, 'ai');
});

test('fallback is marked and avoids repeating the current field text', async () => {
  settings = {};
  const result = await suggestExpertIdentityCopy({
    field: 'bio',
    tone: 'concise',
    currentBio: 'A manually written introduction that should not repeat.',
    variantIndex: 2,
  });

  assert.equal(result.source, 'fallback');
  assert.match(result.notice, /temporarily unavailable/i);
  assert.notEqual(result.bio, 'A manually written introduction that should not repeat.');
});

test('an AI response identical to the current copy is returned as an explicit fallback', async (t) => {
  configureAi();
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => openAiResponse({ bio: 'The current introduction.' });

  const result = await suggestExpertIdentityCopy({
    field: 'bio',
    tone: 'professional',
    currentBio: 'The current introduction.',
  });

  assert.equal(result.source, 'fallback');
  assert.match(result.notice, /repeated your current text/i);
  assert.notEqual(result.bio, 'The current introduction.');
});

test('legacy multi-tone callers and profile-editor improve requests remain supported', async (t) => {
  configureAi();
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (_url, options) => {
    const prompt = JSON.parse(options.body).messages[1].content;
    if (prompt.includes('Field: bio')) {
      return openAiResponse({ bio: 'An improved profile introduction.' });
    }
    return openAiResponse({
      professional: { tagLine: 'Professional tagline', bio: 'Professional bio' },
      casual: { tagLine: 'Casual tagline', bio: 'Casual bio' },
      concise: { tagLine: 'Concise tagline', bio: 'Concise bio' },
    });
  };

  const improvedBio = await suggestExpertIdentityCopy({
    field: 'bio',
    intent: 'improve',
    currentBio: 'An existing profile introduction.',
  });
  assert.equal(improvedBio.bio, 'An improved profile introduction.');
  assert.equal(improvedBio.source, 'ai');

  const multiTone = await suggestExpertIdentityCopy({});
  assert.equal(multiTone.options.professional.tagLine, 'Professional tagline');
  assert.equal(multiTone.options.casual.bio, 'Casual bio');
  assert.equal(multiTone.options.concise.tagLine, 'Concise tagline');
});
