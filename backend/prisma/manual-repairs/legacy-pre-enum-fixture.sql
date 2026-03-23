INSERT INTO "users" (
  "id",
  "updated_at",
  "email",
  "has_verified_email",
  "auth_provider",
  "password_hash",
  "first_name",
  "birthdate",
  "gender",
  "is_onboarded"
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP,
    'runner@example.com',
    true,
    'email',
    'hash-a',
    'Ari',
    DATE '1992-01-10',
    'woman',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    CURRENT_TIMESTAMP,
    'climber@example.com',
    true,
    'email',
    'hash-b',
    'Blake',
    DATE '1990-05-02',
    'man',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    CURRENT_TIMESTAMP,
    'coach@example.com',
    true,
    'email',
    'hash-c',
    'Casey',
    DATE '1988-09-21',
    'non-binary',
    true
  );

INSERT INTO "user_profile" (
  "user_id",
  "bio",
  "city",
  "country"
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Sunrise miles and beach cooldowns.',
    'Honolulu',
    'USA'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Mostly climb, occasionally paddle.',
    'Honolulu',
    'USA'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Coaching sessions and recovery walks.',
    'Honolulu',
    'USA'
  );

INSERT INTO "user_fitness_profile" (
  "user_id",
  "intensity_level",
  "favorite_activities"
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'low',
    'Running, Yoga'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'moderate',
    'Climbing, Hiking'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'high',
    'Strength, Endurance'
  );

INSERT INTO "matches" (
  "id",
  "user_a_id",
  "user_b_id"
) VALUES (
  '00000000-0000-0000-0000-000000000100',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
);

INSERT INTO "messages" (
  "id",
  "match_id",
  "sender_id",
  "body",
  "type"
) VALUES (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000100',
  '00000000-0000-0000-0000-000000000001',
  'See you at sunrise.',
  'text'
);

INSERT INTO "reports" (
  "id",
  "reporter_id",
  "reported_user_id",
  "category",
  "description",
  "status"
) VALUES (
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  'harassment',
  'Legacy moderation row for migration rehearsal.',
  'open'
);

INSERT INTO "events" (
  "id",
  "host_id",
  "updated_at",
  "title",
  "location",
  "category",
  "starts_at"
) VALUES
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP,
    'Strength Hour',
    'Kakaako Gym',
    'Strength',
    CURRENT_TIMESTAMP + INTERVAL '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP,
    'Endurance Club',
    'Ala Moana',
    'Endurance',
    CURRENT_TIMESTAMP + INTERVAL '2 days'
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000002',
    CURRENT_TIMESTAMP,
    'Reset Walk',
    'Manoa',
    'Wellness',
    CURRENT_TIMESTAMP + INTERVAL '3 days'
  ),
  (
    '00000000-0000-0000-0000-000000000204',
    '00000000-0000-0000-0000-000000000003',
    CURRENT_TIMESTAMP,
    'Koko Head Hike',
    'Koko Head',
    'Hike',
    CURRENT_TIMESTAMP + INTERVAL '4 days'
  );
