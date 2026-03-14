jest.mock('../config/app.config', () => ({
  appConfig: {
    jwt: { secret: 'test-secret' },
  },
}));

import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy();
  });

  it('maps JWT payload to user object with id and email', () => {
    const payload = { sub: 'user-1', email: 'alice@example.com' };
    expect(strategy.validate(payload)).toEqual({
      id: 'user-1',
      email: 'alice@example.com',
    });
  });
});
