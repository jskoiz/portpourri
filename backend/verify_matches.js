const crypto = require('crypto');
const { env } = require('./scripts/env');

const BASE_URL = env.apiBaseUrl;

async function request(method, path, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = {
        method,
        headers,
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, options);
    const data = await res.json();
    return { status: res.status, data };
}

async function run() {
    const suffix = crypto.randomBytes(4).toString('hex');
    const userA = {
        email: `userA_${suffix}@test.com`,
        password: 'password123',
        firstName: 'UserA',
        birthdate: '1990-01-01',
        gender: 'male'
    };
    const userB = {
        email: `userB_${suffix}@test.com`,
        password: 'password123',
        firstName: 'UserB',
        birthdate: '1992-01-01',
        gender: 'female'
    };

    console.log('1. Signing up User A...');
    const signupA = await request('POST', '/auth/signup', userA);
    if (signupA.status !== 201) throw new Error(`Signup A failed: ${JSON.stringify(signupA)}`);
    const tokenA = signupA.data.access_token;
    // Decode token to get ID or use /auth/me
    const meA = await request('GET', '/auth/me', null, tokenA);
    console.log('User A Me Response:', JSON.stringify(meA.data));
    const idA = meA.data.id;
    console.log(`   User A ID: ${idA}`);

    console.log('2. Signing up User B...');
    const signupB = await request('POST', '/auth/signup', userB);
    if (signupB.status !== 201) throw new Error(`Signup B failed: ${JSON.stringify(signupB)}`);
    const tokenB = signupB.data.access_token;
    const meB = await request('GET', '/auth/me', null, tokenB);
    const idB = meB.data.id;
    console.log(`   User B ID: ${idB}`);

    console.log('3. User A likes User B...');
    const like1 = await request('POST', '/matches/like', { toUserId: idB }, tokenA);
    console.log(`   Result: ${JSON.stringify(like1.data)}`);
    if (like1.data.isMatch) console.error('   Unexpected match!');

    console.log('4. User B likes User A...');
    const like2 = await request('POST', '/matches/like', { toUserId: idA }, tokenB);
    console.log(`   Result: ${JSON.stringify(like2.data)}`);
    if (!like2.data.isMatch) throw new Error('   Expected match!');

    console.log('5. Verifying Matches for User A...');
    const matchesA = await request('GET', '/matches', null, tokenA);
    console.log(`   Matches: ${JSON.stringify(matchesA.data)}`);
    const matchFoundA = matchesA.data.find(m => m.user.id === idB);
    if (!matchFoundA) throw new Error('   User A should see User B in matches');

    console.log('6. Verifying Matches for User B...');
    const matchesB = await request('GET', '/matches', null, tokenB);
    const matchFoundB = matchesB.data.find(m => m.user.id === idA);
    if (!matchFoundB) throw new Error('   User B should see User A in matches');

    console.log('SUCCESS: Matching logic verified!');
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
