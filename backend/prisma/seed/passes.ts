import { SeedPass } from './config';

export const seedPasses: SeedPass[] = [
  // --- Core users passing on core users ---
  // kai passes
  { slug: 'pass-kai-tessa', fromSlug: 'kai', toSlug: 'tessa', dayOffset: 0, hour: 7 },
  { slug: 'pass-kai-sasha', fromSlug: 'kai', toSlug: 'sasha', dayOffset: 1, hour: 9 },
  { slug: 'pass-kai-priya', fromSlug: 'kai', toSlug: 'priya', dayOffset: 3, hour: 14 },
  // leilani passes
  { slug: 'pass-leilani-rowan', fromSlug: 'leilani', toSlug: 'rowan', dayOffset: 0, hour: 8 },
  { slug: 'pass-leilani-cole', fromSlug: 'leilani', toSlug: 'cole', dayOffset: 2, hour: 11 },
  { slug: 'pass-leilani-eli', fromSlug: 'leilani', toSlug: 'eli', dayOffset: 5, hour: 19 },
  // mason passes
  { slug: 'pass-mason-nia', fromSlug: 'mason', toSlug: 'nia', dayOffset: 1, hour: 6 },
  { slug: 'pass-mason-malia', fromSlug: 'mason', toSlug: 'malia', dayOffset: 4, hour: 10 },
  { slug: 'pass-mason-alana', fromSlug: 'mason', toSlug: 'alana', dayOffset: 7, hour: 15 },
  // nia passes
  { slug: 'pass-nia-mason', fromSlug: 'nia', toSlug: 'mason', dayOffset: 1, hour: 12 }, // mutual with mason
  { slug: 'pass-nia-jordan', fromSlug: 'nia', toSlug: 'jordan', dayOffset: 3, hour: 16 },
  { slug: 'pass-nia-keoni', fromSlug: 'nia', toSlug: 'keoni', dayOffset: 6, hour: 20 },
  // jordan passes
  { slug: 'pass-jordan-kai', fromSlug: 'jordan', toSlug: 'kai', dayOffset: 0, hour: 10 },
  { slug: 'pass-jordan-maren', fromSlug: 'jordan', toSlug: 'maren', dayOffset: 2, hour: 13 },
  { slug: 'pass-jordan-devon', fromSlug: 'jordan', toSlug: 'devon', dayOffset: 8, hour: 18 },
  // malia passes
  { slug: 'pass-malia-eli', fromSlug: 'malia', toSlug: 'eli', dayOffset: 1, hour: 7 },
  { slug: 'pass-malia-cole', fromSlug: 'malia', toSlug: 'cole', dayOffset: 5, hour: 11 },
  { slug: 'pass-malia-rowan', fromSlug: 'malia', toSlug: 'rowan', dayOffset: 9, hour: 17 },
  // rowan passes
  { slug: 'pass-rowan-leilani', fromSlug: 'rowan', toSlug: 'leilani', dayOffset: 0, hour: 9 }, // mutual with leilani
  { slug: 'pass-rowan-nia', fromSlug: 'rowan', toSlug: 'nia', dayOffset: 4, hour: 14 },
  { slug: 'pass-rowan-sasha', fromSlug: 'rowan', toSlug: 'sasha', dayOffset: 10, hour: 21 },
  // tessa passes
  { slug: 'pass-tessa-kai', fromSlug: 'tessa', toSlug: 'kai', dayOffset: 2, hour: 8 }, // mutual with kai
  { slug: 'pass-tessa-jordan', fromSlug: 'tessa', toSlug: 'jordan', dayOffset: 6, hour: 12 },
  { slug: 'pass-tessa-mason', fromSlug: 'tessa', toSlug: 'mason', dayOffset: 11, hour: 16 },
  // keoni passes
  { slug: 'pass-keoni-malia', fromSlug: 'keoni', toSlug: 'malia', dayOffset: 1, hour: 10 },
  { slug: 'pass-keoni-alana', fromSlug: 'keoni', toSlug: 'alana', dayOffset: 3, hour: 15 },
  { slug: 'pass-keoni-priya', fromSlug: 'keoni', toSlug: 'priya', dayOffset: 7, hour: 22 },
  // sasha passes
  { slug: 'pass-sasha-rowan', fromSlug: 'sasha', toSlug: 'rowan', dayOffset: 2, hour: 6 }, // mutual with rowan
  { slug: 'pass-sasha-devon', fromSlug: 'sasha', toSlug: 'devon', dayOffset: 5, hour: 13 },
  { slug: 'pass-sasha-maren', fromSlug: 'sasha', toSlug: 'maren', dayOffset: 12, hour: 19 },
  // eli passes
  { slug: 'pass-eli-malia', fromSlug: 'eli', toSlug: 'malia', dayOffset: 3, hour: 7 }, // mutual with malia
  { slug: 'pass-eli-leilani', fromSlug: 'eli', toSlug: 'leilani', dayOffset: 6, hour: 11 }, // mutual with leilani
  { slug: 'pass-eli-tessa', fromSlug: 'eli', toSlug: 'tessa', dayOffset: 13, hour: 17 },
  // alana passes
  { slug: 'pass-alana-keoni', fromSlug: 'alana', toSlug: 'keoni', dayOffset: 0, hour: 11 }, // mutual with keoni
  { slug: 'pass-alana-jordan', fromSlug: 'alana', toSlug: 'jordan', dayOffset: 4, hour: 16 },
  { slug: 'pass-alana-cole', fromSlug: 'alana', toSlug: 'cole', dayOffset: 8, hour: 20 },
  // devon passes
  { slug: 'pass-devon-sasha', fromSlug: 'devon', toSlug: 'sasha', dayOffset: 1, hour: 8 }, // mutual with sasha
  { slug: 'pass-devon-kai', fromSlug: 'devon', toSlug: 'kai', dayOffset: 5, hour: 14 },
  { slug: 'pass-devon-maren', fromSlug: 'devon', toSlug: 'maren', dayOffset: 9, hour: 18 },
  // priya passes
  { slug: 'pass-priya-keoni', fromSlug: 'priya', toSlug: 'keoni', dayOffset: 2, hour: 9 }, // mutual with keoni
  { slug: 'pass-priya-mason', fromSlug: 'priya', toSlug: 'mason', dayOffset: 7, hour: 12 },
  { slug: 'pass-priya-rowan', fromSlug: 'priya', toSlug: 'rowan', dayOffset: 14, hour: 21 },
  // cole passes
  { slug: 'pass-cole-alana', fromSlug: 'cole', toSlug: 'alana', dayOffset: 3, hour: 6 }, // mutual with alana
  { slug: 'pass-cole-leilani', fromSlug: 'cole', toSlug: 'leilani', dayOffset: 6, hour: 10 }, // mutual with leilani
  { slug: 'pass-cole-nia', fromSlug: 'cole', toSlug: 'nia', dayOffset: 10, hour: 15 },
  // maren passes
  { slug: 'pass-maren-jordan', fromSlug: 'maren', toSlug: 'jordan', dayOffset: 0, hour: 12 }, // mutual with jordan
  { slug: 'pass-maren-devon', fromSlug: 'maren', toSlug: 'devon', dayOffset: 4, hour: 17 }, // mutual with devon
  { slug: 'pass-maren-tessa', fromSlug: 'maren', toSlug: 'tessa', dayOffset: 11, hour: 22 },

  // --- Supplemental users passing on others ---
  // noa passes
  { slug: 'pass-noa-cameron', fromSlug: 'noa', toSlug: 'cameron', dayOffset: 0, hour: 13 },
  { slug: 'pass-noa-kai', fromSlug: 'noa', toSlug: 'kai', dayOffset: 3, hour: 18 },
  { slug: 'pass-noa-beck', fromSlug: 'noa', toSlug: 'beck', dayOffset: 15, hour: 8 },
  // cameron passes
  { slug: 'pass-cameron-noa', fromSlug: 'cameron', toSlug: 'noa', dayOffset: 1, hour: 14 }, // mutual with noa
  { slug: 'pass-cameron-isla', fromSlug: 'cameron', toSlug: 'isla', dayOffset: 4, hour: 19 },
  { slug: 'pass-cameron-luca', fromSlug: 'cameron', toSlug: 'luca', dayOffset: 8, hour: 7 },
  // isla passes
  { slug: 'pass-isla-rafael', fromSlug: 'isla', toSlug: 'rafael', dayOffset: 2, hour: 10 },
  { slug: 'pass-isla-mason', fromSlug: 'isla', toSlug: 'mason', dayOffset: 5, hour: 15 },
  { slug: 'pass-isla-hazel', fromSlug: 'isla', toSlug: 'hazel', dayOffset: 12, hour: 20 },
  // rafael passes
  { slug: 'pass-rafael-isla', fromSlug: 'rafael', toSlug: 'isla', dayOffset: 3, hour: 11 }, // mutual with isla
  { slug: 'pass-rafael-ivy', fromSlug: 'rafael', toSlug: 'ivy', dayOffset: 6, hour: 16 },
  { slug: 'pass-rafael-june', fromSlug: 'rafael', toSlug: 'june', dayOffset: 9, hour: 9 },
  // ivy passes
  { slug: 'pass-ivy-beck', fromSlug: 'ivy', toSlug: 'beck', dayOffset: 1, hour: 7 },
  { slug: 'pass-ivy-leilani', fromSlug: 'ivy', toSlug: 'leilani', dayOffset: 4, hour: 13 },
  { slug: 'pass-ivy-arden', fromSlug: 'ivy', toSlug: 'arden', dayOffset: 10, hour: 21 },
  // beck passes
  { slug: 'pass-beck-ivy', fromSlug: 'beck', toSlug: 'ivy', dayOffset: 2, hour: 8 }, // mutual with ivy
  { slug: 'pass-beck-june', fromSlug: 'beck', toSlug: 'june', dayOffset: 7, hour: 14 },
  { slug: 'pass-beck-omar', fromSlug: 'beck', toSlug: 'omar', dayOffset: 13, hour: 18 },
  // june passes
  { slug: 'pass-june-luca', fromSlug: 'june', toSlug: 'luca', dayOffset: 0, hour: 6 },
  { slug: 'pass-june-nia', fromSlug: 'june', toSlug: 'nia', dayOffset: 5, hour: 12 },
  { slug: 'pass-june-celine', fromSlug: 'june', toSlug: 'celine', dayOffset: 11, hour: 17 },
  // luca passes
  { slug: 'pass-luca-june', fromSlug: 'luca', toSlug: 'june', dayOffset: 1, hour: 9 }, // mutual with june
  { slug: 'pass-luca-arden', fromSlug: 'luca', toSlug: 'arden', dayOffset: 6, hour: 15 },
  { slug: 'pass-luca-nora', fromSlug: 'luca', toSlug: 'nora', dayOffset: 14, hour: 22 },
  // arden passes
  { slug: 'pass-arden-hazel', fromSlug: 'arden', toSlug: 'hazel', dayOffset: 2, hour: 10 },
  { slug: 'pass-arden-leo', fromSlug: 'arden', toSlug: 'leo', dayOffset: 8, hour: 16 },
  { slug: 'pass-arden-tessa', fromSlug: 'arden', toSlug: 'tessa', dayOffset: 15, hour: 7 },
  // hazel passes
  { slug: 'pass-hazel-arden', fromSlug: 'hazel', toSlug: 'arden', dayOffset: 3, hour: 11 }, // mutual with arden
  { slug: 'pass-hazel-omar', fromSlug: 'hazel', toSlug: 'omar', dayOffset: 7, hour: 19 },
  { slug: 'pass-hazel-finn', fromSlug: 'hazel', toSlug: 'finn', dayOffset: 16, hour: 8 },
  // omar passes
  { slug: 'pass-omar-celine', fromSlug: 'omar', toSlug: 'celine', dayOffset: 0, hour: 14 },
  { slug: 'pass-omar-malia', fromSlug: 'omar', toSlug: 'malia', dayOffset: 4, hour: 20 },
  { slug: 'pass-omar-mae', fromSlug: 'omar', toSlug: 'mae', dayOffset: 9, hour: 6 },
  // celine passes
  { slug: 'pass-celine-omar', fromSlug: 'celine', toSlug: 'omar', dayOffset: 1, hour: 15 }, // mutual with omar
  { slug: 'pass-celine-leo', fromSlug: 'celine', toSlug: 'leo', dayOffset: 5, hour: 21 },
  { slug: 'pass-celine-remy', fromSlug: 'celine', toSlug: 'remy', dayOffset: 17, hour: 9 },
  // leo passes
  { slug: 'pass-leo-nora', fromSlug: 'leo', toSlug: 'nora', dayOffset: 2, hour: 12 },
  { slug: 'pass-leo-keoni', fromSlug: 'leo', toSlug: 'keoni', dayOffset: 6, hour: 17 },
  { slug: 'pass-leo-yara', fromSlug: 'leo', toSlug: 'yara', dayOffset: 10, hour: 7 },
  // nora passes
  { slug: 'pass-nora-leo', fromSlug: 'nora', toSlug: 'leo', dayOffset: 3, hour: 13 }, // mutual with leo
  { slug: 'pass-nora-finn', fromSlug: 'nora', toSlug: 'finn', dayOffset: 7, hour: 18 },
  { slug: 'pass-nora-sasha', fromSlug: 'nora', toSlug: 'sasha', dayOffset: 18, hour: 10 },
  // finn passes
  { slug: 'pass-finn-mae', fromSlug: 'finn', toSlug: 'mae', dayOffset: 0, hour: 8 },
  { slug: 'pass-finn-alana', fromSlug: 'finn', toSlug: 'alana', dayOffset: 4, hour: 16 },
  { slug: 'pass-finn-remy', fromSlug: 'finn', toSlug: 'remy', dayOffset: 11, hour: 22 },
  // mae passes
  { slug: 'pass-mae-finn', fromSlug: 'mae', toSlug: 'finn', dayOffset: 1, hour: 9 }, // mutual with finn
  { slug: 'pass-mae-jordan', fromSlug: 'mae', toSlug: 'jordan', dayOffset: 5, hour: 14 },
  { slug: 'pass-mae-yara', fromSlug: 'mae', toSlug: 'yara', dayOffset: 12, hour: 19 },
  // remy passes
  { slug: 'pass-remy-noa', fromSlug: 'remy', toSlug: 'noa', dayOffset: 2, hour: 7 },
  { slug: 'pass-remy-cole', fromSlug: 'remy', toSlug: 'cole', dayOffset: 8, hour: 13 },
  { slug: 'pass-remy-isla', fromSlug: 'remy', toSlug: 'isla', dayOffset: 19, hour: 20 },
  // yara passes
  { slug: 'pass-yara-remy', fromSlug: 'yara', toSlug: 'remy', dayOffset: 3, hour: 10 },
  { slug: 'pass-yara-devon', fromSlug: 'yara', toSlug: 'devon', dayOffset: 6, hour: 15 },
  { slug: 'pass-yara-cameron', fromSlug: 'yara', toSlug: 'cameron', dayOffset: 13, hour: 21 },

  // --- New users passing on others ---
  // akira passes
  { slug: 'pass-akira-hana', fromSlug: 'akira', toSlug: 'hana', dayOffset: 0, hour: 9 },
  { slug: 'pass-akira-mika', fromSlug: 'akira', toSlug: 'mika', dayOffset: 4, hour: 17 },
  { slug: 'pass-akira-kai', fromSlug: 'akira', toSlug: 'kai', dayOffset: 20, hour: 11 },
  // hana passes
  { slug: 'pass-hana-akira', fromSlug: 'hana', toSlug: 'akira', dayOffset: 1, hour: 10 }, // mutual with akira
  { slug: 'pass-hana-kenji', fromSlug: 'hana', toSlug: 'kenji', dayOffset: 5, hour: 18 },
  { slug: 'pass-hana-sora', fromSlug: 'hana', toSlug: 'sora', dayOffset: 14, hour: 6 },
  // kenji passes
  { slug: 'pass-kenji-mika', fromSlug: 'kenji', toSlug: 'mika', dayOffset: 2, hour: 11 },
  { slug: 'pass-kenji-yuki', fromSlug: 'kenji', toSlug: 'yuki', dayOffset: 7, hour: 19 },
  { slug: 'pass-kenji-leilani', fromSlug: 'kenji', toSlug: 'leilani', dayOffset: 15, hour: 8 },
  // mika passes
  { slug: 'pass-mika-sora', fromSlug: 'mika', toSlug: 'sora', dayOffset: 0, hour: 12 },
  { slug: 'pass-mika-taro', fromSlug: 'mika', toSlug: 'taro', dayOffset: 3, hour: 20 },
  { slug: 'pass-mika-rowan', fromSlug: 'mika', toSlug: 'rowan', dayOffset: 21, hour: 7 },
  // sora passes
  { slug: 'pass-sora-mika', fromSlug: 'sora', toSlug: 'mika', dayOffset: 1, hour: 13 }, // mutual with mika
  { slug: 'pass-sora-yuki', fromSlug: 'sora', toSlug: 'yuki', dayOffset: 6, hour: 21 },
  { slug: 'pass-sora-riko', fromSlug: 'sora', toSlug: 'riko', dayOffset: 16, hour: 9 },
  // yuki passes
  { slug: 'pass-yuki-taro', fromSlug: 'yuki', toSlug: 'taro', dayOffset: 2, hour: 14 },
  { slug: 'pass-yuki-aiko', fromSlug: 'yuki', toSlug: 'aiko', dayOffset: 8, hour: 22 },
  { slug: 'pass-yuki-mason', fromSlug: 'yuki', toSlug: 'mason', dayOffset: 17, hour: 10 },
  // taro passes
  { slug: 'pass-taro-yuki', fromSlug: 'taro', toSlug: 'yuki', dayOffset: 3, hour: 15 }, // mutual with yuki
  { slug: 'pass-taro-riko', fromSlug: 'taro', toSlug: 'riko', dayOffset: 7, hour: 6 },
  { slug: 'pass-taro-hiroshi', fromSlug: 'taro', toSlug: 'hiroshi', dayOffset: 22, hour: 12 },
  // riko passes
  { slug: 'pass-riko-aiko', fromSlug: 'riko', toSlug: 'aiko', dayOffset: 0, hour: 16 },
  { slug: 'pass-riko-mei', fromSlug: 'riko', toSlug: 'mei', dayOffset: 4, hour: 7 },
  { slug: 'pass-riko-nia', fromSlug: 'riko', toSlug: 'nia', dayOffset: 18, hour: 13 },
  // aiko passes
  { slug: 'pass-aiko-riko', fromSlug: 'aiko', toSlug: 'riko', dayOffset: 1, hour: 17 }, // mutual with riko
  { slug: 'pass-aiko-hiroshi', fromSlug: 'aiko', toSlug: 'hiroshi', dayOffset: 5, hour: 8 },
  { slug: 'pass-aiko-jin', fromSlug: 'aiko', toSlug: 'jin', dayOffset: 23, hour: 14 },
  // hiroshi passes
  { slug: 'pass-hiroshi-mei', fromSlug: 'hiroshi', toSlug: 'mei', dayOffset: 2, hour: 18 },
  { slug: 'pass-hiroshi-jin', fromSlug: 'hiroshi', toSlug: 'jin', dayOffset: 6, hour: 9 },
  { slug: 'pass-hiroshi-priya', fromSlug: 'hiroshi', toSlug: 'priya', dayOffset: 19, hour: 15 },
  // mei passes
  { slug: 'pass-mei-hiroshi', fromSlug: 'mei', toSlug: 'hiroshi', dayOffset: 3, hour: 19 }, // mutual with hiroshi
  { slug: 'pass-mei-jin', fromSlug: 'mei', toSlug: 'jin', dayOffset: 7, hour: 10 },
  { slug: 'pass-mei-sakura', fromSlug: 'mei', toSlug: 'sakura', dayOffset: 24, hour: 16 },
  // jin passes
  { slug: 'pass-jin-sakura', fromSlug: 'jin', toSlug: 'sakura', dayOffset: 0, hour: 20 },
  { slug: 'pass-jin-koa', fromSlug: 'jin', toSlug: 'koa', dayOffset: 4, hour: 11 },
  { slug: 'pass-jin-eli', fromSlug: 'jin', toSlug: 'eli', dayOffset: 20, hour: 17 },
  // sakura passes
  { slug: 'pass-sakura-jin', fromSlug: 'sakura', toSlug: 'jin', dayOffset: 1, hour: 21 }, // mutual with jin
  { slug: 'pass-sakura-koa', fromSlug: 'sakura', toSlug: 'koa', dayOffset: 5, hour: 12 },
  { slug: 'pass-sakura-lani', fromSlug: 'sakura', toSlug: 'lani', dayOffset: 15, hour: 6 },

  // --- Hawaiian/Pacific names ---
  // koa passes
  { slug: 'pass-koa-lani', fromSlug: 'koa', toSlug: 'lani', dayOffset: 2, hour: 22 },
  { slug: 'pass-koa-makoa', fromSlug: 'koa', toSlug: 'makoa', dayOffset: 8, hour: 13 },
  { slug: 'pass-koa-cole', fromSlug: 'koa', toSlug: 'cole', dayOffset: 21, hour: 8 },
  // lani passes
  { slug: 'pass-lani-koa', fromSlug: 'lani', toSlug: 'koa', dayOffset: 3, hour: 6 }, // mutual with koa
  { slug: 'pass-lani-nalani', fromSlug: 'lani', toSlug: 'nalani', dayOffset: 6, hour: 14 },
  { slug: 'pass-lani-hoku', fromSlug: 'lani', toSlug: 'hoku', dayOffset: 16, hour: 19 },
  // makoa passes
  { slug: 'pass-makoa-nalani', fromSlug: 'makoa', toSlug: 'nalani', dayOffset: 0, hour: 7 },
  { slug: 'pass-makoa-kekoa', fromSlug: 'makoa', toSlug: 'kekoa', dayOffset: 4, hour: 15 },
  { slug: 'pass-makoa-jordan', fromSlug: 'makoa', toSlug: 'jordan', dayOffset: 22, hour: 10 },
  // nalani passes
  { slug: 'pass-nalani-makoa', fromSlug: 'nalani', toSlug: 'makoa', dayOffset: 1, hour: 8 }, // mutual with makoa
  { slug: 'pass-nalani-hoku', fromSlug: 'nalani', toSlug: 'hoku', dayOffset: 5, hour: 16 },
  { slug: 'pass-nalani-mahina', fromSlug: 'nalani', toSlug: 'mahina', dayOffset: 17, hour: 21 },
  // kekoa passes
  { slug: 'pass-kekoa-hoku', fromSlug: 'kekoa', toSlug: 'hoku', dayOffset: 2, hour: 9 },
  { slug: 'pass-kekoa-anela', fromSlug: 'kekoa', toSlug: 'anela', dayOffset: 7, hour: 17 },
  { slug: 'pass-kekoa-maren', fromSlug: 'kekoa', toSlug: 'maren', dayOffset: 23, hour: 12 },
  // hoku passes
  { slug: 'pass-hoku-kekoa', fromSlug: 'hoku', toSlug: 'kekoa', dayOffset: 3, hour: 10 }, // mutual with kekoa
  { slug: 'pass-hoku-mahina', fromSlug: 'hoku', toSlug: 'mahina', dayOffset: 6, hour: 18 },
  { slug: 'pass-hoku-ikaika', fromSlug: 'hoku', toSlug: 'ikaika', dayOffset: 18, hour: 7 },
  // mahina passes
  { slug: 'pass-mahina-anela', fromSlug: 'mahina', toSlug: 'anela', dayOffset: 0, hour: 11 },
  { slug: 'pass-mahina-kalani', fromSlug: 'mahina', toSlug: 'kalani', dayOffset: 4, hour: 19 },
  { slug: 'pass-mahina-keoni', fromSlug: 'mahina', toSlug: 'keoni', dayOffset: 24, hour: 14 },
  // anela passes
  { slug: 'pass-anela-mahina', fromSlug: 'anela', toSlug: 'mahina', dayOffset: 1, hour: 12 }, // mutual with mahina
  { slug: 'pass-anela-ikaika', fromSlug: 'anela', toSlug: 'ikaika', dayOffset: 5, hour: 20 },
  { slug: 'pass-anela-keala', fromSlug: 'anela', toSlug: 'keala', dayOffset: 19, hour: 8 },
  // ikaika passes
  { slug: 'pass-ikaika-kalani', fromSlug: 'ikaika', toSlug: 'kalani', dayOffset: 2, hour: 13 },
  { slug: 'pass-ikaika-nalu', fromSlug: 'ikaika', toSlug: 'nalu', dayOffset: 8, hour: 21 },
  { slug: 'pass-ikaika-alana', fromSlug: 'ikaika', toSlug: 'alana', dayOffset: 25, hour: 9 },
  // kalani passes
  { slug: 'pass-kalani-ikaika', fromSlug: 'kalani', toSlug: 'ikaika', dayOffset: 3, hour: 14 }, // mutual with ikaika
  { slug: 'pass-kalani-keala', fromSlug: 'kalani', toSlug: 'keala', dayOffset: 7, hour: 22 },
  { slug: 'pass-kalani-pua', fromSlug: 'kalani', toSlug: 'pua', dayOffset: 20, hour: 6 },
  // keala passes
  { slug: 'pass-keala-nalu', fromSlug: 'keala', toSlug: 'nalu', dayOffset: 0, hour: 15 },
  { slug: 'pass-keala-pua', fromSlug: 'keala', toSlug: 'pua', dayOffset: 4, hour: 7 },
  { slug: 'pass-keala-sasha', fromSlug: 'keala', toSlug: 'sasha', dayOffset: 21, hour: 11 },
  // nalu passes
  { slug: 'pass-nalu-keala', fromSlug: 'nalu', toSlug: 'keala', dayOffset: 1, hour: 16 }, // mutual with keala
  { slug: 'pass-nalu-pua', fromSlug: 'nalu', toSlug: 'pua', dayOffset: 5, hour: 8 },
  { slug: 'pass-nalu-tessa', fromSlug: 'nalu', toSlug: 'tessa', dayOffset: 22, hour: 13 },
  // pua passes
  { slug: 'pass-pua-nalu', fromSlug: 'pua', toSlug: 'nalu', dayOffset: 2, hour: 17 }, // mutual with nalu
  { slug: 'pass-pua-kai', fromSlug: 'pua', toSlug: 'kai', dayOffset: 6, hour: 9 },

  // --- International/diverse names ---
  // tia passes
  { slug: 'pass-tia-rafa', fromSlug: 'tia', toSlug: 'rafa', dayOffset: 3, hour: 18 },
  { slug: 'pass-tia-nina', fromSlug: 'tia', toSlug: 'nina', dayOffset: 9, hour: 10 },
  { slug: 'pass-tia-mason', fromSlug: 'tia', toSlug: 'mason', dayOffset: 23, hour: 15 },
  // rafa passes
  { slug: 'pass-rafa-tia', fromSlug: 'rafa', toSlug: 'tia', dayOffset: 0, hour: 19 }, // mutual with tia
  { slug: 'pass-rafa-marco', fromSlug: 'rafa', toSlug: 'marco', dayOffset: 4, hour: 11 },
  { slug: 'pass-rafa-dani', fromSlug: 'rafa', toSlug: 'dani', dayOffset: 16, hour: 6 },
  // nina passes
  { slug: 'pass-nina-marco', fromSlug: 'nina', toSlug: 'marco', dayOffset: 1, hour: 20 },
  { slug: 'pass-nina-sol', fromSlug: 'nina', toSlug: 'sol', dayOffset: 5, hour: 12 },
  { slug: 'pass-nina-eli', fromSlug: 'nina', toSlug: 'eli', dayOffset: 24, hour: 17 },
  // marco passes
  { slug: 'pass-marco-nina', fromSlug: 'marco', toSlug: 'nina', dayOffset: 2, hour: 21 }, // mutual with nina
  { slug: 'pass-marco-dani', fromSlug: 'marco', toSlug: 'dani', dayOffset: 6, hour: 13 },
  { slug: 'pass-marco-zara', fromSlug: 'marco', toSlug: 'zara', dayOffset: 17, hour: 8 },
  // dani passes
  { slug: 'pass-dani-sol', fromSlug: 'dani', toSlug: 'sol', dayOffset: 3, hour: 22 },
  { slug: 'pass-dani-jax', fromSlug: 'dani', toSlug: 'jax', dayOffset: 7, hour: 14 },
  { slug: 'pass-dani-nia', fromSlug: 'dani', toSlug: 'nia', dayOffset: 25, hour: 9 },
  // sol passes
  { slug: 'pass-sol-dani', fromSlug: 'sol', toSlug: 'dani', dayOffset: 0, hour: 6 }, // mutual with dani
  { slug: 'pass-sol-zara', fromSlug: 'sol', toSlug: 'zara', dayOffset: 4, hour: 15 },
  { slug: 'pass-sol-sky', fromSlug: 'sol', toSlug: 'sky', dayOffset: 18, hour: 10 },
  // zara passes
  { slug: 'pass-zara-jax', fromSlug: 'zara', toSlug: 'jax', dayOffset: 1, hour: 7 },
  { slug: 'pass-zara-rio', fromSlug: 'zara', toSlug: 'rio', dayOffset: 5, hour: 16 },
  { slug: 'pass-zara-malia', fromSlug: 'zara', toSlug: 'malia', dayOffset: 19, hour: 11 },
  // jax passes
  { slug: 'pass-jax-zara', fromSlug: 'jax', toSlug: 'zara', dayOffset: 2, hour: 8 }, // mutual with zara
  { slug: 'pass-jax-sky', fromSlug: 'jax', toSlug: 'sky', dayOffset: 8, hour: 17 },
  { slug: 'pass-jax-luna', fromSlug: 'jax', toSlug: 'luna', dayOffset: 20, hour: 12 },

  // --- Nature/short names ---
  // sky passes
  { slug: 'pass-sky-rio', fromSlug: 'sky', toSlug: 'rio', dayOffset: 3, hour: 9 },
  { slug: 'pass-sky-luna', fromSlug: 'sky', toSlug: 'luna', dayOffset: 9, hour: 18 },
  { slug: 'pass-sky-keoni', fromSlug: 'sky', toSlug: 'keoni', dayOffset: 21, hour: 14 },
  // rio passes
  { slug: 'pass-rio-sky', fromSlug: 'rio', toSlug: 'sky', dayOffset: 0, hour: 10 }, // mutual with sky
  { slug: 'pass-rio-ash', fromSlug: 'rio', toSlug: 'ash', dayOffset: 4, hour: 19 },
  { slug: 'pass-rio-wren', fromSlug: 'rio', toSlug: 'wren', dayOffset: 22, hour: 7 },
  // luna passes
  { slug: 'pass-luna-ash', fromSlug: 'luna', toSlug: 'ash', dayOffset: 1, hour: 11 },
  { slug: 'pass-luna-sage', fromSlug: 'luna', toSlug: 'sage', dayOffset: 5, hour: 20 },
  { slug: 'pass-luna-jordan', fromSlug: 'luna', toSlug: 'jordan', dayOffset: 23, hour: 15 },
  // ash passes
  { slug: 'pass-ash-luna', fromSlug: 'ash', toSlug: 'luna', dayOffset: 2, hour: 12 }, // mutual with luna
  { slug: 'pass-ash-wren', fromSlug: 'ash', toSlug: 'wren', dayOffset: 6, hour: 21 },
  { slug: 'pass-ash-reed', fromSlug: 'ash', toSlug: 'reed', dayOffset: 24, hour: 8 },
  // wren passes
  { slug: 'pass-wren-sage', fromSlug: 'wren', toSlug: 'sage', dayOffset: 3, hour: 13 },
  { slug: 'pass-wren-blake', fromSlug: 'wren', toSlug: 'blake', dayOffset: 7, hour: 22 },
  { slug: 'pass-wren-devon', fromSlug: 'wren', toSlug: 'devon', dayOffset: 25, hour: 9 },
  // sage passes
  { slug: 'pass-sage-wren', fromSlug: 'sage', toSlug: 'wren', dayOffset: 0, hour: 14 }, // mutual with wren
  { slug: 'pass-sage-reed', fromSlug: 'sage', toSlug: 'reed', dayOffset: 4, hour: 6 },
  { slug: 'pass-sage-quinn', fromSlug: 'sage', toSlug: 'quinn', dayOffset: 14, hour: 10 },
  // reed passes
  { slug: 'pass-reed-blake', fromSlug: 'reed', toSlug: 'blake', dayOffset: 1, hour: 15 },
  { slug: 'pass-reed-quinn', fromSlug: 'reed', toSlug: 'quinn', dayOffset: 5, hour: 7 },
  { slug: 'pass-reed-priya', fromSlug: 'reed', toSlug: 'priya', dayOffset: 15, hour: 11 },
  // blake passes
  { slug: 'pass-blake-reed', fromSlug: 'blake', toSlug: 'reed', dayOffset: 2, hour: 16 }, // mutual with reed
  { slug: 'pass-blake-quinn', fromSlug: 'blake', toSlug: 'quinn', dayOffset: 8, hour: 8 },
  { slug: 'pass-blake-kit', fromSlug: 'blake', toSlug: 'kit', dayOffset: 16, hour: 12 },
  // quinn passes
  { slug: 'pass-quinn-kit', fromSlug: 'quinn', toSlug: 'kit', dayOffset: 3, hour: 17 },
  { slug: 'pass-quinn-nova', fromSlug: 'quinn', toSlug: 'nova', dayOffset: 9, hour: 9 },
  { slug: 'pass-quinn-kai', fromSlug: 'quinn', toSlug: 'kai', dayOffset: 17, hour: 13 },
  // kit passes
  { slug: 'pass-kit-quinn', fromSlug: 'kit', toSlug: 'quinn', dayOffset: 0, hour: 18 }, // mutual with quinn
  { slug: 'pass-kit-nova', fromSlug: 'kit', toSlug: 'nova', dayOffset: 4, hour: 10 },
  { slug: 'pass-kit-kira', fromSlug: 'kit', toSlug: 'kira', dayOffset: 18, hour: 6 },
  // nova passes
  { slug: 'pass-nova-kira', fromSlug: 'nova', toSlug: 'kira', dayOffset: 1, hour: 19 },
  { slug: 'pass-nova-zeke', fromSlug: 'nova', toSlug: 'zeke', dayOffset: 5, hour: 11 },
  { slug: 'pass-nova-rowan', fromSlug: 'nova', toSlug: 'rowan', dayOffset: 19, hour: 14 },
  // kira passes
  { slug: 'pass-kira-nova', fromSlug: 'kira', toSlug: 'nova', dayOffset: 2, hour: 20 }, // mutual with nova
  { slug: 'pass-kira-tate', fromSlug: 'kira', toSlug: 'tate', dayOffset: 6, hour: 12 },
  { slug: 'pass-kira-leilani', fromSlug: 'kira', toSlug: 'leilani', dayOffset: 20, hour: 7 },
  // zeke passes
  { slug: 'pass-zeke-tate', fromSlug: 'zeke', toSlug: 'tate', dayOffset: 3, hour: 21 },
  { slug: 'pass-zeke-beau', fromSlug: 'zeke', toSlug: 'beau', dayOffset: 7, hour: 13 },
  { slug: 'pass-zeke-mason', fromSlug: 'zeke', toSlug: 'mason', dayOffset: 21, hour: 8 },
  // tate passes
  { slug: 'pass-tate-zeke', fromSlug: 'tate', toSlug: 'zeke', dayOffset: 0, hour: 22 }, // mutual with zeke
  { slug: 'pass-tate-beau', fromSlug: 'tate', toSlug: 'beau', dayOffset: 4, hour: 14 },
  { slug: 'pass-tate-jude', fromSlug: 'tate', toSlug: 'jude', dayOffset: 22, hour: 9 },

  // --- Classic/elegant names ---
  // beau passes
  { slug: 'pass-beau-jude', fromSlug: 'beau', toSlug: 'jude', dayOffset: 1, hour: 6 },
  { slug: 'pass-beau-pearl', fromSlug: 'beau', toSlug: 'pearl', dayOffset: 5, hour: 15 },
  { slug: 'pass-beau-malia', fromSlug: 'beau', toSlug: 'malia', dayOffset: 23, hour: 10 },
  // jude passes
  { slug: 'pass-jude-beau', fromSlug: 'jude', toSlug: 'beau', dayOffset: 2, hour: 7 }, // mutual with beau
  { slug: 'pass-jude-fern', fromSlug: 'jude', toSlug: 'fern', dayOffset: 8, hour: 16 },
  { slug: 'pass-jude-dale', fromSlug: 'jude', toSlug: 'dale', dayOffset: 24, hour: 11 },
  // pearl passes
  { slug: 'pass-pearl-fern', fromSlug: 'pearl', toSlug: 'fern', dayOffset: 3, hour: 8 },
  { slug: 'pass-pearl-clay', fromSlug: 'pearl', toSlug: 'clay', dayOffset: 9, hour: 17 },
  { slug: 'pass-pearl-keoni', fromSlug: 'pearl', toSlug: 'keoni', dayOffset: 25, hour: 12 },
  // fern passes
  { slug: 'pass-fern-pearl', fromSlug: 'fern', toSlug: 'pearl', dayOffset: 0, hour: 9 }, // mutual with pearl
  { slug: 'pass-fern-dale', fromSlug: 'fern', toSlug: 'dale', dayOffset: 4, hour: 18 },
  { slug: 'pass-fern-cora', fromSlug: 'fern', toSlug: 'cora', dayOffset: 15, hour: 13 },
  // dale passes
  { slug: 'pass-dale-clay', fromSlug: 'dale', toSlug: 'clay', dayOffset: 1, hour: 10 },
  { slug: 'pass-dale-vera', fromSlug: 'dale', toSlug: 'vera', dayOffset: 5, hour: 19 },
  { slug: 'pass-dale-eli', fromSlug: 'dale', toSlug: 'eli', dayOffset: 16, hour: 7 },
  // clay passes
  { slug: 'pass-clay-dale', fromSlug: 'clay', toSlug: 'dale', dayOffset: 2, hour: 11 }, // mutual with dale
  { slug: 'pass-clay-cora', fromSlug: 'clay', toSlug: 'cora', dayOffset: 6, hour: 20 },
  { slug: 'pass-clay-lark', fromSlug: 'clay', toSlug: 'lark', dayOffset: 17, hour: 8 },
  // cora passes
  { slug: 'pass-cora-vera', fromSlug: 'cora', toSlug: 'vera', dayOffset: 3, hour: 12 },
  { slug: 'pass-cora-opal', fromSlug: 'cora', toSlug: 'opal', dayOffset: 7, hour: 21 },
  { slug: 'pass-cora-alana', fromSlug: 'cora', toSlug: 'alana', dayOffset: 18, hour: 9 },
  // vera passes
  { slug: 'pass-vera-cora', fromSlug: 'vera', toSlug: 'cora', dayOffset: 0, hour: 13 }, // mutual with cora
  { slug: 'pass-vera-lark', fromSlug: 'vera', toSlug: 'lark', dayOffset: 4, hour: 22 },
  { slug: 'pass-vera-ruth', fromSlug: 'vera', toSlug: 'ruth', dayOffset: 19, hour: 10 },
  // lark passes
  { slug: 'pass-lark-opal', fromSlug: 'lark', toSlug: 'opal', dayOffset: 1, hour: 14 },
  { slug: 'pass-lark-nell', fromSlug: 'lark', toSlug: 'nell', dayOffset: 5, hour: 6 },
  { slug: 'pass-lark-sasha', fromSlug: 'lark', toSlug: 'sasha', dayOffset: 20, hour: 11 },
  // opal passes
  { slug: 'pass-opal-lark', fromSlug: 'opal', toSlug: 'lark', dayOffset: 2, hour: 15 }, // mutual with lark
  { slug: 'pass-opal-ruth', fromSlug: 'opal', toSlug: 'ruth', dayOffset: 8, hour: 7 },
  { slug: 'pass-opal-bree', fromSlug: 'opal', toSlug: 'bree', dayOffset: 21, hour: 12 },
  // ruth passes
  { slug: 'pass-ruth-nell', fromSlug: 'ruth', toSlug: 'nell', dayOffset: 3, hour: 16 },
  { slug: 'pass-ruth-shay', fromSlug: 'ruth', toSlug: 'shay', dayOffset: 9, hour: 8 },
  { slug: 'pass-ruth-devon', fromSlug: 'ruth', toSlug: 'devon', dayOffset: 22, hour: 13 },
  // nell passes
  { slug: 'pass-nell-ruth', fromSlug: 'nell', toSlug: 'ruth', dayOffset: 0, hour: 17 }, // mutual with ruth
  { slug: 'pass-nell-bree', fromSlug: 'nell', toSlug: 'bree', dayOffset: 4, hour: 9 },
  { slug: 'pass-nell-cole', fromSlug: 'nell', toSlug: 'cole', dayOffset: 23, hour: 14 },
  // bree passes
  { slug: 'pass-bree-shay', fromSlug: 'bree', toSlug: 'shay', dayOffset: 1, hour: 18 },
  { slug: 'pass-bree-nell', fromSlug: 'bree', toSlug: 'nell', dayOffset: 5, hour: 10 }, // mutual with nell
  { slug: 'pass-bree-maren', fromSlug: 'bree', toSlug: 'maren', dayOffset: 24, hour: 15 },
  // shay passes
  { slug: 'pass-shay-bree', fromSlug: 'shay', toSlug: 'bree', dayOffset: 2, hour: 19 }, // mutual with bree
  { slug: 'pass-shay-emi', fromSlug: 'shay', toSlug: 'emi', dayOffset: 6, hour: 11 },
  { slug: 'pass-shay-rowan', fromSlug: 'shay', toSlug: 'rowan', dayOffset: 25, hour: 16 },

  // --- Japanese-inspired short names ---
  // emi passes
  { slug: 'pass-emi-yuna', fromSlug: 'emi', toSlug: 'yuna', dayOffset: 3, hour: 20 },
  { slug: 'pass-emi-kenzo', fromSlug: 'emi', toSlug: 'kenzo', dayOffset: 7, hour: 12 },
  { slug: 'pass-emi-kai', fromSlug: 'emi', toSlug: 'kai', dayOffset: 14, hour: 7 },
  // yuna passes
  { slug: 'pass-yuna-emi', fromSlug: 'yuna', toSlug: 'emi', dayOffset: 0, hour: 21 }, // mutual with emi
  { slug: 'pass-yuna-ren', fromSlug: 'yuna', toSlug: 'ren', dayOffset: 4, hour: 13 },
  { slug: 'pass-yuna-ami', fromSlug: 'yuna', toSlug: 'ami', dayOffset: 15, hour: 8 },
  // kenzo passes
  { slug: 'pass-kenzo-ren', fromSlug: 'kenzo', toSlug: 'ren', dayOffset: 1, hour: 22 },
  { slug: 'pass-kenzo-toby', fromSlug: 'kenzo', toSlug: 'toby', dayOffset: 5, hour: 14 },
  { slug: 'pass-kenzo-leilani', fromSlug: 'kenzo', toSlug: 'leilani', dayOffset: 16, hour: 9 },
  // ren passes
  { slug: 'pass-ren-kenzo', fromSlug: 'ren', toSlug: 'kenzo', dayOffset: 2, hour: 6 }, // mutual with kenzo
  { slug: 'pass-ren-ami', fromSlug: 'ren', toSlug: 'ami', dayOffset: 8, hour: 15 },
  { slug: 'pass-ren-drew', fromSlug: 'ren', toSlug: 'drew', dayOffset: 17, hour: 10 },
  // ami passes
  { slug: 'pass-ami-toby', fromSlug: 'ami', toSlug: 'toby', dayOffset: 3, hour: 7 },
  { slug: 'pass-ami-lia', fromSlug: 'ami', toSlug: 'lia', dayOffset: 9, hour: 16 },
  { slug: 'pass-ami-priya', fromSlug: 'ami', toSlug: 'priya', dayOffset: 18, hour: 11 },

  // --- Short modern names ---
  // toby passes
  { slug: 'pass-toby-drew', fromSlug: 'toby', toSlug: 'drew', dayOffset: 0, hour: 8 },
  { slug: 'pass-toby-lia', fromSlug: 'toby', toSlug: 'lia', dayOffset: 4, hour: 17 },
  { slug: 'pass-toby-malia', fromSlug: 'toby', toSlug: 'malia', dayOffset: 19, hour: 12 },
  // drew passes
  { slug: 'pass-drew-toby', fromSlug: 'drew', toSlug: 'toby', dayOffset: 1, hour: 9 }, // mutual with toby
  { slug: 'pass-drew-max', fromSlug: 'drew', toSlug: 'max', dayOffset: 5, hour: 18 },
  { slug: 'pass-drew-ada', fromSlug: 'drew', toSlug: 'ada', dayOffset: 20, hour: 13 },
  // lia passes
  { slug: 'pass-lia-max', fromSlug: 'lia', toSlug: 'max', dayOffset: 2, hour: 10 },
  { slug: 'pass-lia-ada', fromSlug: 'lia', toSlug: 'ada', dayOffset: 6, hour: 19 },
  { slug: 'pass-lia-jordan', fromSlug: 'lia', toSlug: 'jordan', dayOffset: 21, hour: 7 },
  // max passes
  { slug: 'pass-max-ada', fromSlug: 'max', toSlug: 'ada', dayOffset: 3, hour: 11 },
  { slug: 'pass-max-lia', fromSlug: 'max', toSlug: 'lia', dayOffset: 7, hour: 20 }, // mutual with lia
  { slug: 'pass-max-cole', fromSlug: 'max', toSlug: 'cole', dayOffset: 22, hour: 8 },
  // ada passes
  { slug: 'pass-ada-max', fromSlug: 'ada', toSlug: 'max', dayOffset: 0, hour: 12 }, // mutual with max
  { slug: 'pass-ada-emi', fromSlug: 'ada', toSlug: 'emi', dayOffset: 4, hour: 21 },
  { slug: 'pass-ada-sasha', fromSlug: 'ada', toSlug: 'sasha', dayOffset: 23, hour: 9 },
];
