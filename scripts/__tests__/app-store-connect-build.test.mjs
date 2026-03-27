import test from 'node:test';
import assert from 'node:assert/strict';

import {
  summarizeBuild,
  fetchLatestBuild,
  fetchNextBuildNumber,
  setBuildWhatsNew,
  waitForBuildProcessing,
} from '../app-store-connect-build.mjs';

function buildResponse(data) {
  return {
    ok: true,
    json: async () => data,
  };
}

test('summarizeBuild prefers the ASC version field as the build number', () => {
  assert.deepEqual(summarizeBuild({
    id: 'build-1',
    attributes: {
      version: '14',
      processingState: 'VALID',
      uploadedDate: '2026-03-26T00:00:00Z',
      appVersion: '1.0.0',
    },
  }), {
    id: 'build-1',
    buildNumber: '14',
    processingState: 'VALID',
    uploadedDate: '2026-03-26T00:00:00Z',
    appVersion: '1.0.0',
    expirationDate: null,
  });
});

test('fetchLatestBuild resolves the app id and latest build', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    if (calls.length === 1) {
      return buildResponse({
        data: [{ id: 'app-1' }],
      });
    }
    return buildResponse({
      data: [{
        id: 'build-1',
        attributes: {
          version: '14',
          processingState: 'PROCESSING',
          uploadedDate: '2026-03-26T00:00:00Z',
          appVersion: '1.0.0',
        },
      }],
    });
  };

  const result = await fetchLatestBuild({
    bundleId: 'com.example.brdg',
    fetchImpl,
    authToken: 'token',
    apiBase: 'https://api.appstoreconnect.apple.com/v1',
  });

  assert.equal(result.appId, 'app-1');
  assert.equal(result.latestBuild.buildNumber, '14');
  assert.equal(calls.length, 2);
});

test('fetchNextBuildNumber increments the latest visible build', async () => {
  let callCount = 0;
  const fetchImpl = async () => {
    callCount += 1;
    if (callCount === 1) {
      return buildResponse({ data: [{ id: 'app-1' }] });
    }
    return buildResponse({
      data: [{
        id: 'build-1',
        attributes: {
          version: '21',
          processingState: 'VALID',
          uploadedDate: '2026-03-26T00:00:00Z',
          appVersion: '1.0.0',
        },
      }],
    });
  };

  const result = await fetchNextBuildNumber({
    bundleId: 'com.example.brdg',
    fetchImpl,
    authToken: 'token',
  });

  assert.equal(result.latestBuildNumber, '21');
  assert.equal(result.nextBuildNumber, '22');
});

test('waitForBuildProcessing returns ready when the build leaves PROCESSING', async () => {
  let callCount = 0;
  const fetchImpl = async () => {
    callCount += 1;
    if (callCount % 2 === 1) {
      return buildResponse({ data: [{ id: 'app-1' }] });
    }
    const state = callCount < 4 ? 'PROCESSING' : 'VALID';
    return buildResponse({
      data: [{
        id: 'build-15',
        attributes: {
          version: '15',
          processingState: state,
          uploadedDate: '2026-03-26T00:00:00Z',
          appVersion: '1.0.0',
        },
      }],
    });
  };

  const result = await waitForBuildProcessing({
    bundleId: 'com.example.brdg',
    buildNumber: '15',
    fetchImpl,
    authToken: 'token',
    intervalSeconds: 0,
    timeoutSeconds: 1,
  });

  assert.equal(result.status, 'ready');
  assert.equal(result.build.processingState, 'VALID');
});

test('waitForBuildProcessing returns timeout when the build never becomes ready', async () => {
  let callCount = 0;
  const fetchImpl = async () => {
    callCount += 1;
    if (callCount % 2 === 1) {
      return buildResponse({ data: [{ id: 'app-1' }] });
    }
    return buildResponse({
      data: [{
        id: 'build-15',
        attributes: {
          version: '15',
          processingState: 'PROCESSING',
          uploadedDate: '2026-03-26T00:00:00Z',
          appVersion: '1.0.0',
        },
      }],
    });
  };

  const result = await waitForBuildProcessing({
    bundleId: 'com.example.brdg',
    buildNumber: '15',
    fetchImpl,
    authToken: 'token',
    intervalSeconds: 0,
    timeoutSeconds: 0,
  });

  assert.equal(result.status, 'timeout');
  assert.equal(result.build.processingState, 'PROCESSING');
});

test('setBuildWhatsNew patches the buildBetaDetail for a specific build', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), method: options?.method || 'GET', body: options?.body });
    // 1: resolve app id
    if (calls.length === 1) {
      return buildResponse({ data: [{ id: 'app-1' }] });
    }
    // 2: list builds by number
    if (calls.length === 2) {
      return buildResponse({
        data: [{
          id: 'build-16',
          attributes: {
            version: '16',
            processingState: 'VALID',
            uploadedDate: '2026-03-27T00:00:00Z',
            appVersion: '1.0.0',
          },
        }],
      });
    }
    // 3: fetch buildBetaDetail for the build
    if (calls.length === 3) {
      return buildResponse({
        data: {
          id: 'bbd-1',
          type: 'buildBetaDetails',
          attributes: { whatsNew: '' },
        },
      });
    }
    // 4: PATCH buildBetaDetails
    return buildResponse({
      data: {
        id: 'bbd-1',
        type: 'buildBetaDetails',
        attributes: { whatsNew: 'new notes' },
      },
    });
  };

  const result = await setBuildWhatsNew({
    bundleId: 'com.example.brdg',
    buildNumber: '16',
    whatsNew: 'new notes',
    fetchImpl,
    authToken: 'token',
  });

  assert.equal(result.action, 'updated');
  assert.equal(result.buildNumber, '16');
  assert.equal(result.buildId, 'build-16');
  assert.equal(calls.length, 4);
  assert.equal(calls[3].method, 'PATCH');
  assert.match(calls[3].body, /new notes/);
  assert.match(calls[3].body, /buildBetaDetails/);
});
