import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BlockUserDto } from './moderation.dto';

describe('BlockUserDto', () => {
  it('maps the legacy blockedUserId alias into targetUserId', async () => {
    const dto = plainToInstance(BlockUserDto, { blockedUserId: ' user-2 ' });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.targetUserId).toBe('user-2');
    expect(dto.blockedUserId).toBe('user-2');
  });

  it('rejects an invalid targetUserId even when blockedUserId is present', async () => {
    const dto = plainToInstance(BlockUserDto, {
      targetUserId: '   ',
      blockedUserId: 'user-2',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('targetUserId');
  });
});
