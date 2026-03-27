import { SeedLike } from './config';

export const seedLikes: SeedLike[] = [
  // ── Existing like ────────────────────────────────────────────────
  { slug: 'nia-likes-kai', fromSlug: 'nia', toSlug: 'kai', dayOffset: 0, hour: 8 },

  // ── kai incoming (~20 likes) ─────────────────────────────────────
  { slug: 'like-leilani-kai', fromSlug: 'leilani', toSlug: 'kai', dayOffset: 1, hour: 7 },
  { slug: 'like-malia-kai', fromSlug: 'malia', toSlug: 'kai', dayOffset: 1, hour: 9 },
  { slug: 'like-tessa-kai', fromSlug: 'tessa', toSlug: 'kai', dayOffset: 2, hour: 10 },
  { slug: 'like-jordan-kai', fromSlug: 'jordan', toSlug: 'kai', dayOffset: 2, hour: 14 },
  { slug: 'like-sasha-kai', fromSlug: 'sasha', toSlug: 'kai', dayOffset: 3, hour: 8 },
  { slug: 'like-alana-kai', fromSlug: 'alana', toSlug: 'kai', dayOffset: 3, hour: 18 },
  { slug: 'like-priya-kai', fromSlug: 'priya', toSlug: 'kai', dayOffset: 4, hour: 7 },
  { slug: 'like-maren-kai', fromSlug: 'maren', toSlug: 'kai', dayOffset: 4, hour: 15 },
  { slug: 'like-noa-kai', fromSlug: 'noa', toSlug: 'kai', dayOffset: 5, hour: 11 },
  { slug: 'like-isla-kai', fromSlug: 'isla', toSlug: 'kai', dayOffset: 5, hour: 19 },
  { slug: 'like-ivy-kai', fromSlug: 'ivy', toSlug: 'kai', dayOffset: 6, hour: 9 },
  { slug: 'like-june-kai', fromSlug: 'june', toSlug: 'kai', dayOffset: 7, hour: 12 },
  { slug: 'like-hazel-kai', fromSlug: 'hazel', toSlug: 'kai', dayOffset: 8, hour: 16, isSuperLike: true },
  { slug: 'like-celine-kai', fromSlug: 'celine', toSlug: 'kai', dayOffset: 9, hour: 10 },
  { slug: 'like-nora-kai', fromSlug: 'nora', toSlug: 'kai', dayOffset: 10, hour: 8 },
  { slug: 'like-mae-kai', fromSlug: 'mae', toSlug: 'kai', dayOffset: 11, hour: 20 },
  { slug: 'like-yara-kai', fromSlug: 'yara', toSlug: 'kai', dayOffset: 12, hour: 7 },
  { slug: 'like-hana-kai', fromSlug: 'hana', toSlug: 'kai', dayOffset: 13, hour: 14 },
  { slug: 'like-mika-kai', fromSlug: 'mika', toSlug: 'kai', dayOffset: 14, hour: 9, isSuperLike: true },
  { slug: 'like-aiko-kai', fromSlug: 'aiko', toSlug: 'kai', dayOffset: 15, hour: 17 },

  // ── leilani incoming (~18 likes) ─────────────────────────────────
  { slug: 'like-kai-leilani', fromSlug: 'kai', toSlug: 'leilani', dayOffset: 0, hour: 9 },
  { slug: 'like-mason-leilani', fromSlug: 'mason', toSlug: 'leilani', dayOffset: 1, hour: 11 },
  { slug: 'like-jordan-leilani', fromSlug: 'jordan', toSlug: 'leilani', dayOffset: 1, hour: 16 },
  { slug: 'like-rowan-leilani', fromSlug: 'rowan', toSlug: 'leilani', dayOffset: 2, hour: 8 },
  { slug: 'like-keoni-leilani', fromSlug: 'keoni', toSlug: 'leilani', dayOffset: 3, hour: 10 },
  { slug: 'like-eli-leilani', fromSlug: 'eli', toSlug: 'leilani', dayOffset: 3, hour: 19 },
  { slug: 'like-devon-leilani', fromSlug: 'devon', toSlug: 'leilani', dayOffset: 4, hour: 7 },
  { slug: 'like-cole-leilani', fromSlug: 'cole', toSlug: 'leilani', dayOffset: 5, hour: 13 },
  { slug: 'like-rafael-leilani', fromSlug: 'rafael', toSlug: 'leilani', dayOffset: 6, hour: 8, isSuperLike: true },
  { slug: 'like-beck-leilani', fromSlug: 'beck', toSlug: 'leilani', dayOffset: 7, hour: 15 },
  { slug: 'like-luca-leilani', fromSlug: 'luca', toSlug: 'leilani', dayOffset: 8, hour: 11 },
  { slug: 'like-omar-leilani', fromSlug: 'omar', toSlug: 'leilani', dayOffset: 9, hour: 18 },
  { slug: 'like-leo-leilani', fromSlug: 'leo', toSlug: 'leilani', dayOffset: 10, hour: 9 },
  { slug: 'like-finn-leilani', fromSlug: 'finn', toSlug: 'leilani', dayOffset: 11, hour: 12 },
  { slug: 'like-remy-leilani', fromSlug: 'remy', toSlug: 'leilani', dayOffset: 12, hour: 20 },
  { slug: 'like-kenji-leilani', fromSlug: 'kenji', toSlug: 'leilani', dayOffset: 13, hour: 7 },
  { slug: 'like-taro-leilani', fromSlug: 'taro', toSlug: 'leilani', dayOffset: 14, hour: 14 },
  { slug: 'like-koa-leilani', fromSlug: 'koa', toSlug: 'leilani', dayOffset: 15, hour: 10 },

  // ── nia incoming (~15 likes) ─────────────────────────────────────
  { slug: 'like-kai-nia', fromSlug: 'kai', toSlug: 'nia', dayOffset: 1, hour: 10 },
  { slug: 'like-mason-nia', fromSlug: 'mason', toSlug: 'nia', dayOffset: 2, hour: 8 },
  { slug: 'like-rowan-nia', fromSlug: 'rowan', toSlug: 'nia', dayOffset: 3, hour: 14 },
  { slug: 'like-keoni-nia', fromSlug: 'keoni', toSlug: 'nia', dayOffset: 4, hour: 11 },
  { slug: 'like-eli-nia', fromSlug: 'eli', toSlug: 'nia', dayOffset: 5, hour: 7 },
  { slug: 'like-cole-nia', fromSlug: 'cole', toSlug: 'nia', dayOffset: 6, hour: 16 },
  { slug: 'like-rafael-nia', fromSlug: 'rafael', toSlug: 'nia', dayOffset: 7, hour: 9 },
  { slug: 'like-luca-nia', fromSlug: 'luca', toSlug: 'nia', dayOffset: 8, hour: 18 },
  { slug: 'like-omar-nia', fromSlug: 'omar', toSlug: 'nia', dayOffset: 9, hour: 12, isSuperLike: true },
  { slug: 'like-leo-nia', fromSlug: 'leo', toSlug: 'nia', dayOffset: 10, hour: 15 },
  { slug: 'like-finn-nia', fromSlug: 'finn', toSlug: 'nia', dayOffset: 11, hour: 8 },
  { slug: 'like-kenji-nia', fromSlug: 'kenji', toSlug: 'nia', dayOffset: 12, hour: 20 },
  { slug: 'like-makoa-nia', fromSlug: 'makoa', toSlug: 'nia', dayOffset: 13, hour: 10 },
  { slug: 'like-rafa-nia', fromSlug: 'rafa', toSlug: 'nia', dayOffset: 14, hour: 13 },
  { slug: 'like-jax-nia', fromSlug: 'jax', toSlug: 'nia', dayOffset: 15, hour: 7 },

  // ── tessa incoming (~15 likes) ───────────────────────────────────
  { slug: 'like-kai-tessa', fromSlug: 'kai', toSlug: 'tessa', dayOffset: 1, hour: 12 },
  { slug: 'like-mason-tessa', fromSlug: 'mason', toSlug: 'tessa', dayOffset: 2, hour: 7 },
  { slug: 'like-jordan-tessa', fromSlug: 'jordan', toSlug: 'tessa', dayOffset: 3, hour: 15 },
  { slug: 'like-keoni-tessa', fromSlug: 'keoni', toSlug: 'tessa', dayOffset: 4, hour: 9 },
  { slug: 'like-eli-tessa', fromSlug: 'eli', toSlug: 'tessa', dayOffset: 5, hour: 18 },
  { slug: 'like-devon-tessa', fromSlug: 'devon', toSlug: 'tessa', dayOffset: 6, hour: 11 },
  { slug: 'like-cole-tessa', fromSlug: 'cole', toSlug: 'tessa', dayOffset: 7, hour: 8, isSuperLike: true },
  { slug: 'like-beck-tessa', fromSlug: 'beck', toSlug: 'tessa', dayOffset: 8, hour: 14 },
  { slug: 'like-luca-tessa', fromSlug: 'luca', toSlug: 'tessa', dayOffset: 9, hour: 20 },
  { slug: 'like-omar-tessa', fromSlug: 'omar', toSlug: 'tessa', dayOffset: 10, hour: 7 },
  { slug: 'like-finn-tessa', fromSlug: 'finn', toSlug: 'tessa', dayOffset: 11, hour: 13 },
  { slug: 'like-remy-tessa', fromSlug: 'remy', toSlug: 'tessa', dayOffset: 12, hour: 10 },
  { slug: 'like-sora-tessa', fromSlug: 'sora', toSlug: 'tessa', dayOffset: 13, hour: 16 },
  { slug: 'like-marco-tessa', fromSlug: 'marco', toSlug: 'tessa', dayOffset: 14, hour: 8 },
  { slug: 'like-rio-tessa', fromSlug: 'rio', toSlug: 'tessa', dayOffset: 15, hour: 19 },

  // ── malia incoming (~12 likes) ───────────────────────────────────
  { slug: 'like-kai-malia', fromSlug: 'kai', toSlug: 'malia', dayOffset: 2, hour: 11 },
  { slug: 'like-mason-malia', fromSlug: 'mason', toSlug: 'malia', dayOffset: 3, hour: 9 },
  { slug: 'like-rowan-malia', fromSlug: 'rowan', toSlug: 'malia', dayOffset: 4, hour: 16 },
  { slug: 'like-eli-malia', fromSlug: 'eli', toSlug: 'malia', dayOffset: 5, hour: 8 },
  { slug: 'like-devon-malia', fromSlug: 'devon', toSlug: 'malia', dayOffset: 6, hour: 14 },
  { slug: 'like-cole-malia', fromSlug: 'cole', toSlug: 'malia', dayOffset: 7, hour: 10 },
  { slug: 'like-rafael-malia', fromSlug: 'rafael', toSlug: 'malia', dayOffset: 8, hour: 19 },
  { slug: 'like-leo-malia', fromSlug: 'leo', toSlug: 'malia', dayOffset: 9, hour: 7 },
  { slug: 'like-kenji-malia', fromSlug: 'kenji', toSlug: 'malia', dayOffset: 10, hour: 13 },
  { slug: 'like-hiroshi-malia', fromSlug: 'hiroshi', toSlug: 'malia', dayOffset: 11, hour: 17 },
  { slug: 'like-nalu-malia', fromSlug: 'nalu', toSlug: 'malia', dayOffset: 12, hour: 8, isSuperLike: true },
  { slug: 'like-sol-malia', fromSlug: 'sol', toSlug: 'malia', dayOffset: 13, hour: 15 },

  // ── mason incoming (~8 likes) ────────────────────────────────────
  { slug: 'like-nia-mason', fromSlug: 'nia', toSlug: 'mason', dayOffset: 1, hour: 13 },
  { slug: 'like-leilani-mason', fromSlug: 'leilani', toSlug: 'mason', dayOffset: 2, hour: 9 },
  { slug: 'like-tessa-mason', fromSlug: 'tessa', toSlug: 'mason', dayOffset: 3, hour: 16 },
  { slug: 'like-sasha-mason', fromSlug: 'sasha', toSlug: 'mason', dayOffset: 4, hour: 10 },
  { slug: 'like-alana-mason', fromSlug: 'alana', toSlug: 'mason', dayOffset: 5, hour: 14 },
  { slug: 'like-priya-mason', fromSlug: 'priya', toSlug: 'mason', dayOffset: 6, hour: 8 },
  { slug: 'like-isla-mason', fromSlug: 'isla', toSlug: 'mason', dayOffset: 7, hour: 19 },
  { slug: 'like-hana-mason', fromSlug: 'hana', toSlug: 'mason', dayOffset: 8, hour: 11 },

  // ── jordan incoming (~8 likes) ───────────────────────────────────
  { slug: 'like-nia-jordan', fromSlug: 'nia', toSlug: 'jordan', dayOffset: 2, hour: 15 },
  { slug: 'like-malia-jordan', fromSlug: 'malia', toSlug: 'jordan', dayOffset: 3, hour: 7 },
  { slug: 'like-tessa-jordan', fromSlug: 'tessa', toSlug: 'jordan', dayOffset: 4, hour: 12 },
  { slug: 'like-sasha-jordan', fromSlug: 'sasha', toSlug: 'jordan', dayOffset: 5, hour: 18 },
  { slug: 'like-priya-jordan', fromSlug: 'priya', toSlug: 'jordan', dayOffset: 6, hour: 9 },
  { slug: 'like-maren-jordan', fromSlug: 'maren', toSlug: 'jordan', dayOffset: 7, hour: 14 },
  { slug: 'like-noa-jordan', fromSlug: 'noa', toSlug: 'jordan', dayOffset: 8, hour: 20 },
  { slug: 'like-yara-jordan', fromSlug: 'yara', toSlug: 'jordan', dayOffset: 9, hour: 8, isSuperLike: true },

  // ── rowan incoming (~7 likes) ────────────────────────────────────
  { slug: 'like-leilani-rowan', fromSlug: 'leilani', toSlug: 'rowan', dayOffset: 3, hour: 11 },
  { slug: 'like-nia-rowan', fromSlug: 'nia', toSlug: 'rowan', dayOffset: 4, hour: 8 },
  { slug: 'like-tessa-rowan', fromSlug: 'tessa', toSlug: 'rowan', dayOffset: 5, hour: 16 },
  { slug: 'like-alana-rowan', fromSlug: 'alana', toSlug: 'rowan', dayOffset: 6, hour: 10 },
  { slug: 'like-priya-rowan', fromSlug: 'priya', toSlug: 'rowan', dayOffset: 7, hour: 18 },
  { slug: 'like-maren-rowan', fromSlug: 'maren', toSlug: 'rowan', dayOffset: 8, hour: 7 },
  { slug: 'like-celine-rowan', fromSlug: 'celine', toSlug: 'rowan', dayOffset: 9, hour: 13 },

  // ── keoni incoming (~7 likes) ────────────────────────────────────
  { slug: 'like-leilani-keoni', fromSlug: 'leilani', toSlug: 'keoni', dayOffset: 2, hour: 12 },
  { slug: 'like-malia-keoni', fromSlug: 'malia', toSlug: 'keoni', dayOffset: 3, hour: 9 },
  { slug: 'like-alana-keoni', fromSlug: 'alana', toSlug: 'keoni', dayOffset: 5, hour: 15 },
  { slug: 'like-priya-keoni', fromSlug: 'priya', toSlug: 'keoni', dayOffset: 7, hour: 8 },
  { slug: 'like-noa-keoni', fromSlug: 'noa', toSlug: 'keoni', dayOffset: 9, hour: 17 },
  { slug: 'like-isla-keoni', fromSlug: 'isla', toSlug: 'keoni', dayOffset: 11, hour: 10 },
  { slug: 'like-hazel-keoni', fromSlug: 'hazel', toSlug: 'keoni', dayOffset: 13, hour: 14 },

  // ── sasha incoming (~7 likes) ────────────────────────────────────
  { slug: 'like-kai-sasha', fromSlug: 'kai', toSlug: 'sasha', dayOffset: 3, hour: 10 },
  { slug: 'like-mason-sasha', fromSlug: 'mason', toSlug: 'sasha', dayOffset: 5, hour: 15 },
  { slug: 'like-rowan-sasha', fromSlug: 'rowan', toSlug: 'sasha', dayOffset: 7, hour: 8 },
  { slug: 'like-devon-sasha', fromSlug: 'devon', toSlug: 'sasha', dayOffset: 9, hour: 13 },
  { slug: 'like-rafael-sasha', fromSlug: 'rafael', toSlug: 'sasha', dayOffset: 11, hour: 18 },
  { slug: 'like-luca-sasha', fromSlug: 'luca', toSlug: 'sasha', dayOffset: 13, hour: 7 },
  { slug: 'like-remy-sasha', fromSlug: 'remy', toSlug: 'sasha', dayOffset: 15, hour: 11, isSuperLike: true },

  // ── eli incoming (~6 likes) ──────────────────────────────────────
  { slug: 'like-leilani-eli', fromSlug: 'leilani', toSlug: 'eli', dayOffset: 4, hour: 13 },
  { slug: 'like-malia-eli', fromSlug: 'malia', toSlug: 'eli', dayOffset: 6, hour: 7 },
  { slug: 'like-tessa-eli', fromSlug: 'tessa', toSlug: 'eli', dayOffset: 8, hour: 16 },
  { slug: 'like-alana-eli', fromSlug: 'alana', toSlug: 'eli', dayOffset: 10, hour: 9 },
  { slug: 'like-noa-eli', fromSlug: 'noa', toSlug: 'eli', dayOffset: 12, hour: 19 },
  { slug: 'like-june-eli', fromSlug: 'june', toSlug: 'eli', dayOffset: 14, hour: 11 },

  // ── alana incoming (~6 likes) ────────────────────────────────────
  { slug: 'like-mason-alana', fromSlug: 'mason', toSlug: 'alana', dayOffset: 4, hour: 8 },
  { slug: 'like-jordan-alana', fromSlug: 'jordan', toSlug: 'alana', dayOffset: 6, hour: 14 },
  { slug: 'like-keoni-alana', fromSlug: 'keoni', toSlug: 'alana', dayOffset: 8, hour: 10 },
  { slug: 'like-cole-alana', fromSlug: 'cole', toSlug: 'alana', dayOffset: 10, hour: 17 },
  { slug: 'like-beck-alana', fromSlug: 'beck', toSlug: 'alana', dayOffset: 12, hour: 8 },
  { slug: 'like-omar-alana', fromSlug: 'omar', toSlug: 'alana', dayOffset: 14, hour: 15 },

  // ── devon incoming (~6 likes) ────────────────────────────────────
  { slug: 'like-nia-devon', fromSlug: 'nia', toSlug: 'devon', dayOffset: 3, hour: 9 },
  { slug: 'like-leilani-devon', fromSlug: 'leilani', toSlug: 'devon', dayOffset: 5, hour: 17 },
  { slug: 'like-malia-devon', fromSlug: 'malia', toSlug: 'devon', dayOffset: 7, hour: 12 },
  { slug: 'like-sasha-devon', fromSlug: 'sasha', toSlug: 'devon', dayOffset: 9, hour: 8 },
  { slug: 'like-isla-devon', fromSlug: 'isla', toSlug: 'devon', dayOffset: 11, hour: 14 },
  { slug: 'like-ivy-devon', fromSlug: 'ivy', toSlug: 'devon', dayOffset: 13, hour: 20 },

  // ── priya incoming (~6 likes) ────────────────────────────────────
  { slug: 'like-kai-priya', fromSlug: 'kai', toSlug: 'priya', dayOffset: 5, hour: 8 },
  { slug: 'like-mason-priya', fromSlug: 'mason', toSlug: 'priya', dayOffset: 7, hour: 13 },
  { slug: 'like-rowan-priya', fromSlug: 'rowan', toSlug: 'priya', dayOffset: 9, hour: 10 },
  { slug: 'like-eli-priya', fromSlug: 'eli', toSlug: 'priya', dayOffset: 11, hour: 16 },
  { slug: 'like-cole-priya', fromSlug: 'cole', toSlug: 'priya', dayOffset: 13, hour: 7 },
  { slug: 'like-luca-priya', fromSlug: 'luca', toSlug: 'priya', dayOffset: 15, hour: 18 },

  // ── cole incoming (~6 likes) ─────────────────────────────────────
  { slug: 'like-nia-cole', fromSlug: 'nia', toSlug: 'cole', dayOffset: 4, hour: 14 },
  { slug: 'like-leilani-cole', fromSlug: 'leilani', toSlug: 'cole', dayOffset: 6, hour: 8 },
  { slug: 'like-tessa-cole', fromSlug: 'tessa', toSlug: 'cole', dayOffset: 8, hour: 12 },
  { slug: 'like-sasha-cole', fromSlug: 'sasha', toSlug: 'cole', dayOffset: 10, hour: 18 },
  { slug: 'like-alana-cole', fromSlug: 'alana', toSlug: 'cole', dayOffset: 12, hour: 9 },
  { slug: 'like-hazel-cole', fromSlug: 'hazel', toSlug: 'cole', dayOffset: 14, hour: 15 },

  // ── maren incoming (~5 likes) ────────────────────────────────────
  { slug: 'like-kai-maren', fromSlug: 'kai', toSlug: 'maren', dayOffset: 6, hour: 10 },
  { slug: 'like-jordan-maren', fromSlug: 'jordan', toSlug: 'maren', dayOffset: 8, hour: 15 },
  { slug: 'like-eli-maren', fromSlug: 'eli', toSlug: 'maren', dayOffset: 10, hour: 8 },
  { slug: 'like-devon-maren', fromSlug: 'devon', toSlug: 'maren', dayOffset: 12, hour: 19 },
  { slug: 'like-beck-maren', fromSlug: 'beck', toSlug: 'maren', dayOffset: 14, hour: 11 },

  // ── supplemental user incoming (noa ~5) ──────────────────────────
  { slug: 'like-kai-noa', fromSlug: 'kai', toSlug: 'noa', dayOffset: 4, hour: 17 },
  { slug: 'like-mason-noa', fromSlug: 'mason', toSlug: 'noa', dayOffset: 7, hour: 8 },
  { slug: 'like-rowan-noa', fromSlug: 'rowan', toSlug: 'noa', dayOffset: 10, hour: 13 },
  { slug: 'like-cole-noa', fromSlug: 'cole', toSlug: 'noa', dayOffset: 13, hour: 9 },
  { slug: 'like-finn-noa', fromSlug: 'finn', toSlug: 'noa', dayOffset: 16, hour: 15 },

  // ── cameron incoming (~4) ────────────────────────────────────────
  { slug: 'like-nia-cameron', fromSlug: 'nia', toSlug: 'cameron', dayOffset: 5, hour: 10 },
  { slug: 'like-tessa-cameron', fromSlug: 'tessa', toSlug: 'cameron', dayOffset: 8, hour: 7 },
  { slug: 'like-alana-cameron', fromSlug: 'alana', toSlug: 'cameron', dayOffset: 11, hour: 16 },
  { slug: 'like-priya-cameron', fromSlug: 'priya', toSlug: 'cameron', dayOffset: 14, hour: 12 },

  // ── isla incoming (~4) ───────────────────────────────────────────
  { slug: 'like-mason-isla', fromSlug: 'mason', toSlug: 'isla', dayOffset: 6, hour: 9 },
  { slug: 'like-jordan-isla', fromSlug: 'jordan', toSlug: 'isla', dayOffset: 9, hour: 14 },
  { slug: 'like-keoni-isla', fromSlug: 'keoni', toSlug: 'isla', dayOffset: 12, hour: 8 },
  { slug: 'like-eli-isla', fromSlug: 'eli', toSlug: 'isla', dayOffset: 15, hour: 17 },

  // ── rafael incoming (~4) ─────────────────────────────────────────
  { slug: 'like-leilani-rafael', fromSlug: 'leilani', toSlug: 'rafael', dayOffset: 5, hour: 13 },
  { slug: 'like-tessa-rafael', fromSlug: 'tessa', toSlug: 'rafael', dayOffset: 8, hour: 8 },
  { slug: 'like-malia-rafael', fromSlug: 'malia', toSlug: 'rafael', dayOffset: 11, hour: 18 },
  { slug: 'like-sasha-rafael', fromSlug: 'sasha', toSlug: 'rafael', dayOffset: 14, hour: 10 },

  // ── ivy incoming (~3) ────────────────────────────────────────────
  { slug: 'like-mason-ivy', fromSlug: 'mason', toSlug: 'ivy', dayOffset: 7, hour: 10 },
  { slug: 'like-keoni-ivy', fromSlug: 'keoni', toSlug: 'ivy', dayOffset: 11, hour: 15 },
  { slug: 'like-cole-ivy', fromSlug: 'cole', toSlug: 'ivy', dayOffset: 15, hour: 8 },

  // ── beck incoming (~3) ───────────────────────────────────────────
  { slug: 'like-nia-beck', fromSlug: 'nia', toSlug: 'beck', dayOffset: 6, hour: 12 },
  { slug: 'like-alana-beck', fromSlug: 'alana', toSlug: 'beck', dayOffset: 10, hour: 7 },
  { slug: 'like-malia-beck', fromSlug: 'malia', toSlug: 'beck', dayOffset: 14, hour: 16 },

  // ── june incoming (~3) ───────────────────────────────────────────
  { slug: 'like-kai-june', fromSlug: 'kai', toSlug: 'june', dayOffset: 8, hour: 9 },
  { slug: 'like-rowan-june', fromSlug: 'rowan', toSlug: 'june', dayOffset: 12, hour: 14 },
  { slug: 'like-devon-june', fromSlug: 'devon', toSlug: 'june', dayOffset: 16, hour: 18 },

  // ── luca incoming (~3) ───────────────────────────────────────────
  { slug: 'like-leilani-luca', fromSlug: 'leilani', toSlug: 'luca', dayOffset: 7, hour: 8 },
  { slug: 'like-malia-luca', fromSlug: 'malia', toSlug: 'luca', dayOffset: 11, hour: 12 },
  { slug: 'like-tessa-luca', fromSlug: 'tessa', toSlug: 'luca', dayOffset: 15, hour: 17 },

  // ── arden incoming (~3) ──────────────────────────────────────────
  { slug: 'like-sasha-arden', fromSlug: 'sasha', toSlug: 'arden', dayOffset: 5, hour: 14 },
  { slug: 'like-jordan-arden', fromSlug: 'jordan', toSlug: 'arden', dayOffset: 9, hour: 8 },
  { slug: 'like-maren-arden', fromSlug: 'maren', toSlug: 'arden', dayOffset: 13, hour: 19 },

  // ── hazel incoming (~3) ──────────────────────────────────────────
  { slug: 'like-mason-hazel', fromSlug: 'mason', toSlug: 'hazel', dayOffset: 8, hour: 13 },
  { slug: 'like-eli-hazel', fromSlug: 'eli', toSlug: 'hazel', dayOffset: 12, hour: 7 },
  { slug: 'like-cole-hazel', fromSlug: 'cole', toSlug: 'hazel', dayOffset: 16, hour: 16 },

  // ── omar incoming (~3) ───────────────────────────────────────────
  { slug: 'like-nia-omar', fromSlug: 'nia', toSlug: 'omar', dayOffset: 7, hour: 11 },
  { slug: 'like-alana-omar', fromSlug: 'alana', toSlug: 'omar', dayOffset: 11, hour: 8 },
  { slug: 'like-tessa-omar', fromSlug: 'tessa', toSlug: 'omar', dayOffset: 15, hour: 14 },

  // ── celine incoming (~3) ─────────────────────────────────────────
  { slug: 'like-kai-celine', fromSlug: 'kai', toSlug: 'celine', dayOffset: 9, hour: 7 },
  { slug: 'like-jordan-celine', fromSlug: 'jordan', toSlug: 'celine', dayOffset: 13, hour: 16 },
  { slug: 'like-devon-celine', fromSlug: 'devon', toSlug: 'celine', dayOffset: 17, hour: 10 },

  // ── leo incoming (~3) ────────────────────────────────────────────
  { slug: 'like-leilani-leo', fromSlug: 'leilani', toSlug: 'leo', dayOffset: 8, hour: 15 },
  { slug: 'like-sasha-leo', fromSlug: 'sasha', toSlug: 'leo', dayOffset: 12, hour: 9 },
  { slug: 'like-priya-leo', fromSlug: 'priya', toSlug: 'leo', dayOffset: 16, hour: 20 },

  // ── nora incoming (~3) ───────────────────────────────────────────
  { slug: 'like-mason-nora', fromSlug: 'mason', toSlug: 'nora', dayOffset: 9, hour: 10 },
  { slug: 'like-rowan-nora', fromSlug: 'rowan', toSlug: 'nora', dayOffset: 13, hour: 7 },
  { slug: 'like-keoni-nora', fromSlug: 'keoni', toSlug: 'nora', dayOffset: 17, hour: 14 },

  // ── finn incoming (~3) ───────────────────────────────────────────
  { slug: 'like-leilani-finn', fromSlug: 'leilani', toSlug: 'finn', dayOffset: 9, hour: 12 },
  { slug: 'like-nia-finn', fromSlug: 'nia', toSlug: 'finn', dayOffset: 13, hour: 8 },
  { slug: 'like-malia-finn', fromSlug: 'malia', toSlug: 'finn', dayOffset: 17, hour: 18 },

  // ── mae incoming (~3) ────────────────────────────────────────────
  { slug: 'like-kai-mae', fromSlug: 'kai', toSlug: 'mae', dayOffset: 10, hour: 11 },
  { slug: 'like-jordan-mae', fromSlug: 'jordan', toSlug: 'mae', dayOffset: 14, hour: 7 },
  { slug: 'like-eli-mae', fromSlug: 'eli', toSlug: 'mae', dayOffset: 18, hour: 15 },

  // ── remy incoming (~3) ───────────────────────────────────────────
  { slug: 'like-mason-remy', fromSlug: 'mason', toSlug: 'remy', dayOffset: 10, hour: 14 },
  { slug: 'like-keoni-remy', fromSlug: 'keoni', toSlug: 'remy', dayOffset: 14, hour: 9 },
  { slug: 'like-cole-remy', fromSlug: 'cole', toSlug: 'remy', dayOffset: 18, hour: 17 },

  // ── yara incoming (~2) ───────────────────────────────────────────
  { slug: 'like-rowan-yara', fromSlug: 'rowan', toSlug: 'yara', dayOffset: 11, hour: 8 },
  { slug: 'like-devon-yara', fromSlug: 'devon', toSlug: 'yara', dayOffset: 15, hour: 13 },

  // ── New users: 1-5 incoming each ─────────────────────────────────
  // akira
  { slug: 'like-nia-akira', fromSlug: 'nia', toSlug: 'akira', dayOffset: 6, hour: 18 },
  { slug: 'like-tessa-akira', fromSlug: 'tessa', toSlug: 'akira', dayOffset: 10, hour: 8 },
  { slug: 'like-malia-akira', fromSlug: 'malia', toSlug: 'akira', dayOffset: 14, hour: 13 },

  // hana
  { slug: 'like-jordan-hana', fromSlug: 'jordan', toSlug: 'hana', dayOffset: 7, hour: 9 },
  { slug: 'like-cole-hana', fromSlug: 'cole', toSlug: 'hana', dayOffset: 11, hour: 15 },

  // kenji
  { slug: 'like-leilani-kenji', fromSlug: 'leilani', toSlug: 'kenji', dayOffset: 8, hour: 7 },
  { slug: 'like-alana-kenji', fromSlug: 'alana', toSlug: 'kenji', dayOffset: 12, hour: 14 },

  // mika
  { slug: 'like-mason-mika', fromSlug: 'mason', toSlug: 'mika', dayOffset: 9, hour: 16 },
  { slug: 'like-eli-mika', fromSlug: 'eli', toSlug: 'mika', dayOffset: 13, hour: 8 },
  { slug: 'like-rowan-mika', fromSlug: 'rowan', toSlug: 'mika', dayOffset: 17, hour: 12 },

  // sora
  { slug: 'like-nia-sora', fromSlug: 'nia', toSlug: 'sora', dayOffset: 7, hour: 14 },
  { slug: 'like-priya-sora', fromSlug: 'priya', toSlug: 'sora', dayOffset: 11, hour: 9 },

  // yuki
  { slug: 'like-tessa-yuki', fromSlug: 'tessa', toSlug: 'yuki', dayOffset: 10, hour: 18 },
  { slug: 'like-sasha-yuki', fromSlug: 'sasha', toSlug: 'yuki', dayOffset: 14, hour: 7 },

  // taro
  { slug: 'like-malia-taro', fromSlug: 'malia', toSlug: 'taro', dayOffset: 8, hour: 11 },
  { slug: 'like-alana-taro', fromSlug: 'alana', toSlug: 'taro', dayOffset: 12, hour: 16 },

  // riko
  { slug: 'like-kai-riko', fromSlug: 'kai', toSlug: 'riko', dayOffset: 11, hour: 9 },
  { slug: 'like-jordan-riko', fromSlug: 'jordan', toSlug: 'riko', dayOffset: 15, hour: 14 },

  // aiko
  { slug: 'like-mason-aiko', fromSlug: 'mason', toSlug: 'aiko', dayOffset: 12, hour: 7 },
  { slug: 'like-rowan-aiko', fromSlug: 'rowan', toSlug: 'aiko', dayOffset: 16, hour: 13 },

  // hiroshi
  { slug: 'like-leilani-hiroshi', fromSlug: 'leilani', toSlug: 'hiroshi', dayOffset: 10, hour: 10 },
  { slug: 'like-eli-hiroshi', fromSlug: 'eli', toSlug: 'hiroshi', dayOffset: 14, hour: 17 },

  // mei
  { slug: 'like-keoni-mei', fromSlug: 'keoni', toSlug: 'mei', dayOffset: 9, hour: 8 },
  { slug: 'like-cole-mei', fromSlug: 'cole', toSlug: 'mei', dayOffset: 13, hour: 15 },
  { slug: 'like-devon-mei', fromSlug: 'devon', toSlug: 'mei', dayOffset: 17, hour: 11 },

  // jin
  { slug: 'like-nia-jin', fromSlug: 'nia', toSlug: 'jin', dayOffset: 8, hour: 12 },
  { slug: 'like-tessa-jin', fromSlug: 'tessa', toSlug: 'jin', dayOffset: 12, hour: 7 },

  // sakura
  { slug: 'like-mason-sakura', fromSlug: 'mason', toSlug: 'sakura', dayOffset: 11, hour: 14, isSuperLike: true },
  { slug: 'like-rowan-sakura', fromSlug: 'rowan', toSlug: 'sakura', dayOffset: 15, hour: 9 },

  // koa
  { slug: 'like-malia-koa', fromSlug: 'malia', toSlug: 'koa', dayOffset: 10, hour: 7 },
  { slug: 'like-sasha-koa', fromSlug: 'sasha', toSlug: 'koa', dayOffset: 14, hour: 18 },

  // lani
  { slug: 'like-kai-lani', fromSlug: 'kai', toSlug: 'lani', dayOffset: 12, hour: 10 },
  { slug: 'like-jordan-lani', fromSlug: 'jordan', toSlug: 'lani', dayOffset: 16, hour: 15 },

  // makoa
  { slug: 'like-leilani-makoa', fromSlug: 'leilani', toSlug: 'makoa', dayOffset: 11, hour: 8 },
  { slug: 'like-alana-makoa', fromSlug: 'alana', toSlug: 'makoa', dayOffset: 15, hour: 13 },

  // nalani
  { slug: 'like-eli-nalani', fromSlug: 'eli', toSlug: 'nalani', dayOffset: 10, hour: 16 },
  { slug: 'like-keoni-nalani', fromSlug: 'keoni', toSlug: 'nalani', dayOffset: 14, hour: 8 },

  // kekoa
  { slug: 'like-tessa-kekoa', fromSlug: 'tessa', toSlug: 'kekoa', dayOffset: 13, hour: 11 },
  { slug: 'like-cole-kekoa', fromSlug: 'cole', toSlug: 'kekoa', dayOffset: 17, hour: 7 },

  // hoku
  { slug: 'like-nia-hoku', fromSlug: 'nia', toSlug: 'hoku', dayOffset: 9, hour: 18 },
  { slug: 'like-mason-hoku', fromSlug: 'mason', toSlug: 'hoku', dayOffset: 13, hour: 10 },

  // mahina
  { slug: 'like-malia-mahina', fromSlug: 'malia', toSlug: 'mahina', dayOffset: 12, hour: 14 },
  { slug: 'like-devon-mahina', fromSlug: 'devon', toSlug: 'mahina', dayOffset: 16, hour: 8 },

  // anela
  { slug: 'like-kai-anela', fromSlug: 'kai', toSlug: 'anela', dayOffset: 13, hour: 9 },
  { slug: 'like-rowan-anela', fromSlug: 'rowan', toSlug: 'anela', dayOffset: 17, hour: 16 },

  // ikaika
  { slug: 'like-leilani-ikaika', fromSlug: 'leilani', toSlug: 'ikaika', dayOffset: 14, hour: 11 },
  { slug: 'like-sasha-ikaika', fromSlug: 'sasha', toSlug: 'ikaika', dayOffset: 18, hour: 7 },

  // kalani
  { slug: 'like-tessa-kalani', fromSlug: 'tessa', toSlug: 'kalani', dayOffset: 11, hour: 13 },
  { slug: 'like-priya-kalani', fromSlug: 'priya', toSlug: 'kalani', dayOffset: 15, hour: 8 },

  // keala
  { slug: 'like-jordan-keala', fromSlug: 'jordan', toSlug: 'keala', dayOffset: 12, hour: 17 },
  { slug: 'like-maren-keala', fromSlug: 'maren', toSlug: 'keala', dayOffset: 16, hour: 10 },

  // nalu
  { slug: 'like-mason-nalu', fromSlug: 'mason', toSlug: 'nalu', dayOffset: 14, hour: 12 },

  // pua
  { slug: 'like-eli-pua', fromSlug: 'eli', toSlug: 'pua', dayOffset: 13, hour: 7 },
  { slug: 'like-cole-pua', fromSlug: 'cole', toSlug: 'pua', dayOffset: 17, hour: 14 },

  // tia
  { slug: 'like-kai-tia', fromSlug: 'kai', toSlug: 'tia', dayOffset: 14, hour: 18 },
  { slug: 'like-keoni-tia', fromSlug: 'keoni', toSlug: 'tia', dayOffset: 18, hour: 9 },

  // rafa
  { slug: 'like-leilani-rafa', fromSlug: 'leilani', toSlug: 'rafa', dayOffset: 15, hour: 7 },
  { slug: 'like-alana-rafa', fromSlug: 'alana', toSlug: 'rafa', dayOffset: 19, hour: 13 },

  // nina
  { slug: 'like-mason-nina', fromSlug: 'mason', toSlug: 'nina', dayOffset: 15, hour: 16, isSuperLike: true },
  { slug: 'like-rowan-nina', fromSlug: 'rowan', toSlug: 'nina', dayOffset: 19, hour: 8 },

  // marco
  { slug: 'like-nia-marco', fromSlug: 'nia', toSlug: 'marco', dayOffset: 10, hour: 12 },
  { slug: 'like-malia-marco', fromSlug: 'malia', toSlug: 'marco', dayOffset: 14, hour: 7 },

  // dani
  { slug: 'like-tessa-dani', fromSlug: 'tessa', toSlug: 'dani', dayOffset: 14, hour: 10 },
  { slug: 'like-sasha-dani', fromSlug: 'sasha', toSlug: 'dani', dayOffset: 18, hour: 15 },

  // sol
  { slug: 'like-jordan-sol', fromSlug: 'jordan', toSlug: 'sol', dayOffset: 11, hour: 18 },
  { slug: 'like-eli-sol', fromSlug: 'eli', toSlug: 'sol', dayOffset: 15, hour: 9 },

  // zara
  { slug: 'like-kai-zara', fromSlug: 'kai', toSlug: 'zara', dayOffset: 15, hour: 12 },
  { slug: 'like-devon-zara', fromSlug: 'devon', toSlug: 'zara', dayOffset: 19, hour: 7 },

  // jax
  { slug: 'like-leilani-jax', fromSlug: 'leilani', toSlug: 'jax', dayOffset: 16, hour: 11 },
  { slug: 'like-maren-jax', fromSlug: 'maren', toSlug: 'jax', dayOffset: 20, hour: 14 },

  // sky
  { slug: 'like-mason-sky', fromSlug: 'mason', toSlug: 'sky', dayOffset: 16, hour: 8 },
  { slug: 'like-priya-sky', fromSlug: 'priya', toSlug: 'sky', dayOffset: 20, hour: 17 },

  // rio
  { slug: 'like-nia-rio', fromSlug: 'nia', toSlug: 'rio', dayOffset: 11, hour: 7 },
  { slug: 'like-alana-rio', fromSlug: 'alana', toSlug: 'rio', dayOffset: 15, hour: 12 },

  // luna
  { slug: 'like-keoni-luna', fromSlug: 'keoni', toSlug: 'luna', dayOffset: 16, hour: 10 },
  { slug: 'like-cole-luna', fromSlug: 'cole', toSlug: 'luna', dayOffset: 20, hour: 15, isSuperLike: true },

  // ash
  { slug: 'like-tessa-ash', fromSlug: 'tessa', toSlug: 'ash', dayOffset: 15, hour: 8 },
  { slug: 'like-sasha-ash', fromSlug: 'sasha', toSlug: 'ash', dayOffset: 19, hour: 13 },

  // wren
  { slug: 'like-jordan-wren', fromSlug: 'jordan', toSlug: 'wren', dayOffset: 16, hour: 18 },
  { slug: 'like-malia-wren', fromSlug: 'malia', toSlug: 'wren', dayOffset: 20, hour: 7 },

  // sage
  { slug: 'like-eli-sage', fromSlug: 'eli', toSlug: 'sage', dayOffset: 16, hour: 12 },
  { slug: 'like-devon-sage', fromSlug: 'devon', toSlug: 'sage', dayOffset: 20, hour: 9 },

  // reed
  { slug: 'like-leilani-reed', fromSlug: 'leilani', toSlug: 'reed', dayOffset: 17, hour: 8 },

  // blake
  { slug: 'like-nia-blake', fromSlug: 'nia', toSlug: 'blake', dayOffset: 12, hour: 15 },
  { slug: 'like-priya-blake', fromSlug: 'priya', toSlug: 'blake', dayOffset: 16, hour: 10 },

  // quinn
  { slug: 'like-mason-quinn', fromSlug: 'mason', toSlug: 'quinn', dayOffset: 17, hour: 14 },
  { slug: 'like-rowan-quinn', fromSlug: 'rowan', toSlug: 'quinn', dayOffset: 21, hour: 7 },

  // kit
  { slug: 'like-tessa-kit', fromSlug: 'tessa', toSlug: 'kit', dayOffset: 16, hour: 9 },

  // nova
  { slug: 'like-kai-nova', fromSlug: 'kai', toSlug: 'nova', dayOffset: 16, hour: 14 },
  { slug: 'like-cole-nova', fromSlug: 'cole', toSlug: 'nova', dayOffset: 20, hour: 8 },

  // kira
  { slug: 'like-jordan-kira', fromSlug: 'jordan', toSlug: 'kira', dayOffset: 17, hour: 11 },
  { slug: 'like-eli-kira', fromSlug: 'eli', toSlug: 'kira', dayOffset: 21, hour: 16 },

  // zeke
  { slug: 'like-malia-zeke', fromSlug: 'malia', toSlug: 'zeke', dayOffset: 17, hour: 7 },
  { slug: 'like-alana-zeke', fromSlug: 'alana', toSlug: 'zeke', dayOffset: 21, hour: 13 },

  // tate
  { slug: 'like-sasha-tate', fromSlug: 'sasha', toSlug: 'tate', dayOffset: 17, hour: 18 },
  { slug: 'like-maren-tate', fromSlug: 'maren', toSlug: 'tate', dayOffset: 21, hour: 9 },

  // beau
  { slug: 'like-leilani-beau', fromSlug: 'leilani', toSlug: 'beau', dayOffset: 18, hour: 10, isSuperLike: true },

  // jude
  { slug: 'like-nia-jude', fromSlug: 'nia', toSlug: 'jude', dayOffset: 13, hour: 16 },
  { slug: 'like-tessa-jude', fromSlug: 'tessa', toSlug: 'jude', dayOffset: 17, hour: 8 },

  // pearl
  { slug: 'like-mason-pearl', fromSlug: 'mason', toSlug: 'pearl', dayOffset: 18, hour: 12 },
  { slug: 'like-keoni-pearl', fromSlug: 'keoni', toSlug: 'pearl', dayOffset: 22, hour: 7 },

  // fern
  { slug: 'like-kai-fern', fromSlug: 'kai', toSlug: 'fern', dayOffset: 17, hour: 15 },
  { slug: 'like-devon-fern', fromSlug: 'devon', toSlug: 'fern', dayOffset: 21, hour: 10 },

  // dale
  { slug: 'like-priya-dale', fromSlug: 'priya', toSlug: 'dale', dayOffset: 18, hour: 8 },

  // clay
  { slug: 'like-rowan-clay', fromSlug: 'rowan', toSlug: 'clay', dayOffset: 18, hour: 14 },
  { slug: 'like-malia-clay', fromSlug: 'malia', toSlug: 'clay', dayOffset: 22, hour: 9 },

  // cora
  { slug: 'like-jordan-cora', fromSlug: 'jordan', toSlug: 'cora', dayOffset: 18, hour: 7 },
  { slug: 'like-eli-cora', fromSlug: 'eli', toSlug: 'cora', dayOffset: 22, hour: 15 },

  // vera
  { slug: 'like-cole-vera', fromSlug: 'cole', toSlug: 'vera', dayOffset: 19, hour: 11 },
  { slug: 'like-sasha-vera', fromSlug: 'sasha', toSlug: 'vera', dayOffset: 23, hour: 8 },

  // lark
  { slug: 'like-alana-lark', fromSlug: 'alana', toSlug: 'lark', dayOffset: 19, hour: 16 },

  // opal
  { slug: 'like-mason-opal', fromSlug: 'mason', toSlug: 'opal', dayOffset: 19, hour: 7 },
  { slug: 'like-maren-opal', fromSlug: 'maren', toSlug: 'opal', dayOffset: 23, hour: 12 },

  // ruth
  { slug: 'like-kai-ruth', fromSlug: 'kai', toSlug: 'ruth', dayOffset: 18, hour: 17 },

  // nell
  { slug: 'like-leilani-nell', fromSlug: 'leilani', toSlug: 'nell', dayOffset: 19, hour: 9 },
  { slug: 'like-keoni-nell', fromSlug: 'keoni', toSlug: 'nell', dayOffset: 23, hour: 14 },

  // bree
  { slug: 'like-tessa-bree', fromSlug: 'tessa', toSlug: 'bree', dayOffset: 19, hour: 12 },
  { slug: 'like-devon-bree', fromSlug: 'devon', toSlug: 'bree', dayOffset: 23, hour: 7, isSuperLike: true },

  // shay
  { slug: 'like-nia-shay', fromSlug: 'nia', toSlug: 'shay', dayOffset: 14, hour: 18 },
  { slug: 'like-rowan-shay', fromSlug: 'rowan', toSlug: 'shay', dayOffset: 18, hour: 8 },

  // emi
  { slug: 'like-jordan-emi', fromSlug: 'jordan', toSlug: 'emi', dayOffset: 19, hour: 14 },
  { slug: 'like-cole-emi', fromSlug: 'cole', toSlug: 'emi', dayOffset: 23, hour: 10 },

  // yuna
  { slug: 'like-mason-yuna', fromSlug: 'mason', toSlug: 'yuna', dayOffset: 20, hour: 8 },

  // kenzo
  { slug: 'like-malia-kenzo', fromSlug: 'malia', toSlug: 'kenzo', dayOffset: 20, hour: 13 },
  { slug: 'like-priya-kenzo', fromSlug: 'priya', toSlug: 'kenzo', dayOffset: 24, hour: 7 },

  // ren
  { slug: 'like-eli-ren', fromSlug: 'eli', toSlug: 'ren', dayOffset: 20, hour: 18 },

  // ami
  { slug: 'like-leilani-ami', fromSlug: 'leilani', toSlug: 'ami', dayOffset: 20, hour: 9 },
  { slug: 'like-sasha-ami', fromSlug: 'sasha', toSlug: 'ami', dayOffset: 24, hour: 14 },

  // toby
  { slug: 'like-tessa-toby', fromSlug: 'tessa', toSlug: 'toby', dayOffset: 20, hour: 11, isSuperLike: true },

  // drew
  { slug: 'like-nia-drew', fromSlug: 'nia', toSlug: 'drew', dayOffset: 15, hour: 14 },
  { slug: 'like-alana-drew', fromSlug: 'alana', toSlug: 'drew', dayOffset: 19, hour: 8 },

  // lia
  { slug: 'like-kai-lia', fromSlug: 'kai', toSlug: 'lia', dayOffset: 19, hour: 17 },
  { slug: 'like-rowan-lia', fromSlug: 'rowan', toSlug: 'lia', dayOffset: 23, hour: 10 },

  // max
  { slug: 'like-maren-max', fromSlug: 'maren', toSlug: 'max', dayOffset: 20, hour: 7 },
  { slug: 'like-devon-max', fromSlug: 'devon', toSlug: 'max', dayOffset: 24, hour: 12 },

  // ada
  { slug: 'like-mason-ada', fromSlug: 'mason', toSlug: 'ada', dayOffset: 21, hour: 9 },
  { slug: 'like-keoni-ada', fromSlug: 'keoni', toSlug: 'ada', dayOffset: 25, hour: 15 },

  // ── Cross-likes among new users (variety) ────────────────────────
  { slug: 'like-akira-hana', fromSlug: 'akira', toSlug: 'hana', dayOffset: 8, hour: 10 },
  { slug: 'like-hana-kenji', fromSlug: 'hana', toSlug: 'kenji', dayOffset: 9, hour: 14 },
  { slug: 'like-kenji-mika', fromSlug: 'kenji', toSlug: 'mika', dayOffset: 10, hour: 8 },
  { slug: 'like-mika-sora', fromSlug: 'mika', toSlug: 'sora', dayOffset: 11, hour: 16 },
  { slug: 'like-sora-yuki', fromSlug: 'sora', toSlug: 'yuki', dayOffset: 12, hour: 9 },
  { slug: 'like-yuki-taro', fromSlug: 'yuki', toSlug: 'taro', dayOffset: 13, hour: 13 },
  { slug: 'like-taro-riko', fromSlug: 'taro', toSlug: 'riko', dayOffset: 14, hour: 7 },
  { slug: 'like-riko-aiko', fromSlug: 'riko', toSlug: 'aiko', dayOffset: 15, hour: 18 },
  { slug: 'like-aiko-hiroshi', fromSlug: 'aiko', toSlug: 'hiroshi', dayOffset: 16, hour: 11 },
  { slug: 'like-hiroshi-mei', fromSlug: 'hiroshi', toSlug: 'mei', dayOffset: 17, hour: 8 },
  { slug: 'like-mei-jin', fromSlug: 'mei', toSlug: 'jin', dayOffset: 18, hour: 15 },
  { slug: 'like-jin-sakura', fromSlug: 'jin', toSlug: 'sakura', dayOffset: 19, hour: 10, isSuperLike: true },
  { slug: 'like-sakura-koa', fromSlug: 'sakura', toSlug: 'koa', dayOffset: 20, hour: 7 },
  { slug: 'like-koa-lani', fromSlug: 'koa', toSlug: 'lani', dayOffset: 21, hour: 14 },
  { slug: 'like-lani-makoa', fromSlug: 'lani', toSlug: 'makoa', dayOffset: 22, hour: 9 },
  { slug: 'like-makoa-nalani', fromSlug: 'makoa', toSlug: 'nalani', dayOffset: 23, hour: 16 },
  { slug: 'like-nalani-kekoa', fromSlug: 'nalani', toSlug: 'kekoa', dayOffset: 24, hour: 8 },
  { slug: 'like-kekoa-hoku', fromSlug: 'kekoa', toSlug: 'hoku', dayOffset: 25, hour: 12 },
  { slug: 'like-hoku-mahina', fromSlug: 'hoku', toSlug: 'mahina', dayOffset: 0, hour: 17 },
  { slug: 'like-mahina-anela', fromSlug: 'mahina', toSlug: 'anela', dayOffset: 1, hour: 10 },
  { slug: 'like-anela-ikaika', fromSlug: 'anela', toSlug: 'ikaika', dayOffset: 2, hour: 14 },
  { slug: 'like-ikaika-kalani', fromSlug: 'ikaika', toSlug: 'kalani', dayOffset: 3, hour: 8 },
  { slug: 'like-kalani-keala', fromSlug: 'kalani', toSlug: 'keala', dayOffset: 4, hour: 16 },
  { slug: 'like-keala-nalu', fromSlug: 'keala', toSlug: 'nalu', dayOffset: 5, hour: 9 },
  { slug: 'like-nalu-pua', fromSlug: 'nalu', toSlug: 'pua', dayOffset: 6, hour: 13 },
  { slug: 'like-pua-tia', fromSlug: 'pua', toSlug: 'tia', dayOffset: 7, hour: 7 },
  { slug: 'like-tia-rafa', fromSlug: 'tia', toSlug: 'rafa', dayOffset: 8, hour: 18 },
  { slug: 'like-rafa-nina', fromSlug: 'rafa', toSlug: 'nina', dayOffset: 9, hour: 11 },
  { slug: 'like-nina-marco', fromSlug: 'nina', toSlug: 'marco', dayOffset: 10, hour: 8 },
  { slug: 'like-marco-dani', fromSlug: 'marco', toSlug: 'dani', dayOffset: 11, hour: 15 },
  { slug: 'like-dani-sol', fromSlug: 'dani', toSlug: 'sol', dayOffset: 12, hour: 10 },
  { slug: 'like-sol-zara', fromSlug: 'sol', toSlug: 'zara', dayOffset: 13, hour: 7 },
  { slug: 'like-zara-jax', fromSlug: 'zara', toSlug: 'jax', dayOffset: 14, hour: 14, isSuperLike: true },
  { slug: 'like-jax-sky', fromSlug: 'jax', toSlug: 'sky', dayOffset: 15, hour: 9 },
  { slug: 'like-sky-rio', fromSlug: 'sky', toSlug: 'rio', dayOffset: 16, hour: 16 },
  { slug: 'like-rio-luna', fromSlug: 'rio', toSlug: 'luna', dayOffset: 17, hour: 8 },
  { slug: 'like-luna-ash', fromSlug: 'luna', toSlug: 'ash', dayOffset: 18, hour: 12 },
  { slug: 'like-ash-wren', fromSlug: 'ash', toSlug: 'wren', dayOffset: 19, hour: 7 },
  { slug: 'like-wren-sage', fromSlug: 'wren', toSlug: 'sage', dayOffset: 20, hour: 15 },
  { slug: 'like-sage-reed', fromSlug: 'sage', toSlug: 'reed', dayOffset: 21, hour: 10 },
  { slug: 'like-reed-blake', fromSlug: 'reed', toSlug: 'blake', dayOffset: 22, hour: 8 },
  { slug: 'like-blake-quinn', fromSlug: 'blake', toSlug: 'quinn', dayOffset: 23, hour: 14 },
  { slug: 'like-quinn-kit', fromSlug: 'quinn', toSlug: 'kit', dayOffset: 24, hour: 9, isSuperLike: true },
  { slug: 'like-kit-nova', fromSlug: 'kit', toSlug: 'nova', dayOffset: 25, hour: 13 },
  { slug: 'like-nova-kira', fromSlug: 'nova', toSlug: 'kira', dayOffset: 0, hour: 18 },
  { slug: 'like-kira-zeke', fromSlug: 'kira', toSlug: 'zeke', dayOffset: 1, hour: 8 },
  { slug: 'like-zeke-tate', fromSlug: 'zeke', toSlug: 'tate', dayOffset: 2, hour: 12 },
  { slug: 'like-tate-beau', fromSlug: 'tate', toSlug: 'beau', dayOffset: 3, hour: 16 },
  { slug: 'like-beau-jude', fromSlug: 'beau', toSlug: 'jude', dayOffset: 4, hour: 9 },
  { slug: 'like-jude-pearl', fromSlug: 'jude', toSlug: 'pearl', dayOffset: 5, hour: 14 },
  { slug: 'like-pearl-fern', fromSlug: 'pearl', toSlug: 'fern', dayOffset: 6, hour: 7 },
  { slug: 'like-fern-dale', fromSlug: 'fern', toSlug: 'dale', dayOffset: 7, hour: 17 },
  { slug: 'like-dale-clay', fromSlug: 'dale', toSlug: 'clay', dayOffset: 8, hour: 11 },
  { slug: 'like-clay-cora', fromSlug: 'clay', toSlug: 'cora', dayOffset: 9, hour: 8 },
  { slug: 'like-cora-vera', fromSlug: 'cora', toSlug: 'vera', dayOffset: 10, hour: 15 },
  { slug: 'like-vera-lark', fromSlug: 'vera', toSlug: 'lark', dayOffset: 11, hour: 10 },
  { slug: 'like-lark-opal', fromSlug: 'lark', toSlug: 'opal', dayOffset: 12, hour: 7 },
  { slug: 'like-opal-ruth', fromSlug: 'opal', toSlug: 'ruth', dayOffset: 13, hour: 14 },
  { slug: 'like-ruth-nell', fromSlug: 'ruth', toSlug: 'nell', dayOffset: 14, hour: 9 },
  { slug: 'like-nell-bree', fromSlug: 'nell', toSlug: 'bree', dayOffset: 15, hour: 16 },
  { slug: 'like-bree-shay', fromSlug: 'bree', toSlug: 'shay', dayOffset: 16, hour: 8 },
  { slug: 'like-shay-emi', fromSlug: 'shay', toSlug: 'emi', dayOffset: 17, hour: 12 },
  { slug: 'like-emi-yuna', fromSlug: 'emi', toSlug: 'yuna', dayOffset: 18, hour: 7 },
  { slug: 'like-yuna-kenzo', fromSlug: 'yuna', toSlug: 'kenzo', dayOffset: 19, hour: 15 },
  { slug: 'like-kenzo-ren', fromSlug: 'kenzo', toSlug: 'ren', dayOffset: 20, hour: 10 },
  { slug: 'like-ren-ami', fromSlug: 'ren', toSlug: 'ami', dayOffset: 21, hour: 8 },
  { slug: 'like-ami-toby', fromSlug: 'ami', toSlug: 'toby', dayOffset: 22, hour: 14 },
  { slug: 'like-toby-drew', fromSlug: 'toby', toSlug: 'drew', dayOffset: 23, hour: 9 },
  { slug: 'like-drew-lia', fromSlug: 'drew', toSlug: 'lia', dayOffset: 24, hour: 16 },
  { slug: 'like-lia-max', fromSlug: 'lia', toSlug: 'max', dayOffset: 25, hour: 8 },
  { slug: 'like-max-ada', fromSlug: 'max', toSlug: 'ada', dayOffset: 0, hour: 13 },
  { slug: 'like-ada-akira', fromSlug: 'ada', toSlug: 'akira', dayOffset: 1, hour: 7 },

  // ── Additional cross-likes for variety ───────────────────────────
  { slug: 'like-akira-mason', fromSlug: 'akira', toSlug: 'mason', dayOffset: 16, hour: 8, isSuperLike: true },
  { slug: 'like-hana-jordan', fromSlug: 'hana', toSlug: 'jordan', dayOffset: 16, hour: 13 },
  { slug: 'like-kenji-rowan', fromSlug: 'kenji', toSlug: 'rowan', dayOffset: 16, hour: 18 },
  { slug: 'like-mika-sasha', fromSlug: 'mika', toSlug: 'sasha', dayOffset: 17, hour: 9 },
  { slug: 'like-sora-keoni', fromSlug: 'sora', toSlug: 'keoni', dayOffset: 17, hour: 14 },
  { slug: 'like-yuki-eli', fromSlug: 'yuki', toSlug: 'eli', dayOffset: 17, hour: 19 },
  { slug: 'like-taro-devon', fromSlug: 'taro', toSlug: 'devon', dayOffset: 18, hour: 8 },
  { slug: 'like-riko-priya', fromSlug: 'riko', toSlug: 'priya', dayOffset: 18, hour: 13 },
  { slug: 'like-aiko-cole', fromSlug: 'aiko', toSlug: 'cole', dayOffset: 18, hour: 18 },
  { slug: 'like-hiroshi-maren', fromSlug: 'hiroshi', toSlug: 'maren', dayOffset: 19, hour: 9, isSuperLike: true },
  { slug: 'like-mei-alana', fromSlug: 'mei', toSlug: 'alana', dayOffset: 19, hour: 14 },
  { slug: 'like-jin-noa', fromSlug: 'jin', toSlug: 'noa', dayOffset: 19, hour: 19 },
  { slug: 'like-sakura-cameron', fromSlug: 'sakura', toSlug: 'cameron', dayOffset: 20, hour: 8 },
  { slug: 'like-koa-isla', fromSlug: 'koa', toSlug: 'isla', dayOffset: 20, hour: 13 },
  { slug: 'like-lani-rafael', fromSlug: 'lani', toSlug: 'rafael', dayOffset: 20, hour: 18 },
  { slug: 'like-makoa-ivy', fromSlug: 'makoa', toSlug: 'ivy', dayOffset: 21, hour: 9 },
  { slug: 'like-nalani-beck', fromSlug: 'nalani', toSlug: 'beck', dayOffset: 21, hour: 14 },
  { slug: 'like-kekoa-june', fromSlug: 'kekoa', toSlug: 'june', dayOffset: 21, hour: 19 },
  { slug: 'like-hoku-luca', fromSlug: 'hoku', toSlug: 'luca', dayOffset: 22, hour: 8 },
  { slug: 'like-mahina-arden', fromSlug: 'mahina', toSlug: 'arden', dayOffset: 22, hour: 13 },
  { slug: 'like-anela-hazel', fromSlug: 'anela', toSlug: 'hazel', dayOffset: 22, hour: 18, isSuperLike: true },
  { slug: 'like-ikaika-omar', fromSlug: 'ikaika', toSlug: 'omar', dayOffset: 23, hour: 9 },
  { slug: 'like-kalani-celine', fromSlug: 'kalani', toSlug: 'celine', dayOffset: 23, hour: 14 },
  { slug: 'like-nalu-leo', fromSlug: 'nalu', toSlug: 'leo', dayOffset: 23, hour: 19 },
  { slug: 'like-pua-nora', fromSlug: 'pua', toSlug: 'nora', dayOffset: 24, hour: 8 },
  { slug: 'like-nina-finn', fromSlug: 'nina', toSlug: 'finn', dayOffset: 24, hour: 13 },
  { slug: 'like-dani-mae', fromSlug: 'dani', toSlug: 'mae', dayOffset: 24, hour: 18 },
  { slug: 'like-sol-remy', fromSlug: 'sol', toSlug: 'remy', dayOffset: 25, hour: 9 },
  { slug: 'like-zara-yara', fromSlug: 'zara', toSlug: 'yara', dayOffset: 25, hour: 14 },
  { slug: 'like-luna-mason', fromSlug: 'luna', toSlug: 'mason', dayOffset: 25, hour: 19 },

  // ── Extra variety likes ──────────────────────────────────────────
  { slug: 'like-nova-jordan', fromSlug: 'nova', toSlug: 'jordan', dayOffset: 24, hour: 10 },
  { slug: 'like-wren-rowan', fromSlug: 'wren', toSlug: 'rowan', dayOffset: 24, hour: 16 },
  { slug: 'like-sage-keoni', fromSlug: 'sage', toSlug: 'keoni', dayOffset: 25, hour: 7 },
  { slug: 'like-blake-sasha', fromSlug: 'blake', toSlug: 'sasha', dayOffset: 25, hour: 12 },
  { slug: 'like-quinn-eli', fromSlug: 'quinn', toSlug: 'eli', dayOffset: 25, hour: 17 },
  { slug: 'like-cora-alana', fromSlug: 'cora', toSlug: 'alana', dayOffset: 0, hour: 14 },
  { slug: 'like-vera-devon', fromSlug: 'vera', toSlug: 'devon', dayOffset: 1, hour: 9 },
  { slug: 'like-opal-priya', fromSlug: 'opal', toSlug: 'priya', dayOffset: 2, hour: 16 },
  { slug: 'like-nell-cole', fromSlug: 'nell', toSlug: 'cole', dayOffset: 3, hour: 10 },
  { slug: 'like-bree-maren', fromSlug: 'bree', toSlug: 'maren', dayOffset: 4, hour: 15 },
  { slug: 'like-emi-noa', fromSlug: 'emi', toSlug: 'noa', dayOffset: 5, hour: 8 },
  { slug: 'like-yuna-cameron', fromSlug: 'yuna', toSlug: 'cameron', dayOffset: 6, hour: 13 },
  { slug: 'like-kenzo-isla', fromSlug: 'kenzo', toSlug: 'isla', dayOffset: 7, hour: 18 },
  { slug: 'like-ren-rafael', fromSlug: 'ren', toSlug: 'rafael', dayOffset: 8, hour: 9 },
  { slug: 'like-ami-ivy', fromSlug: 'ami', toSlug: 'ivy', dayOffset: 9, hour: 14 },
  { slug: 'like-toby-beck', fromSlug: 'toby', toSlug: 'beck', dayOffset: 10, hour: 19 },
  { slug: 'like-drew-june', fromSlug: 'drew', toSlug: 'june', dayOffset: 11, hour: 8 },
  { slug: 'like-lia-luca', fromSlug: 'lia', toSlug: 'luca', dayOffset: 12, hour: 13 },
  { slug: 'like-max-arden', fromSlug: 'max', toSlug: 'arden', dayOffset: 13, hour: 18 },
  { slug: 'like-ada-hazel', fromSlug: 'ada', toSlug: 'hazel', dayOffset: 14, hour: 9 },
];
