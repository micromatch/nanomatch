Benchmarking: (6 of 6)
 · globstar-basic
 · large-list-globstar
 · long-list-globstar
 · negation-basic
 · not-glob-basic
 · star-basic

# benchmark/fixtures/match/globstar-basic.js (182 bytes)
  minimatch x 32,012 ops/sec ±0.86% (83 runs sampled)
  multimatch x 29,055 ops/sec ±1.41% (83 runs sampled)
  nanomatch x 479,001 ops/sec ±1.32% (86 runs sampled)

  fastest is nanomatch

# benchmark/fixtures/match/large-list-globstar.js (485686 bytes)
  minimatch x 24.10 ops/sec ±1.28% (42 runs sampled)
  multimatch x 24.33 ops/sec ±0.78% (44 runs sampled)
  nanomatch x 407 ops/sec ±0.86% (83 runs sampled)

  fastest is nanomatch

# benchmark/fixtures/match/long-list-globstar.js (194085 bytes)
  minimatch x 264 ops/sec ±1.13% (82 runs sampled)
  multimatch x 251 ops/sec ±0.96% (82 runs sampled)
  nanomatch x 999 ops/sec ±0.51% (87 runs sampled)

  fastest is nanomatch

# benchmark/fixtures/match/negation-basic.js (132 bytes)
  minimatch x 77,301 ops/sec ±1.68% (85 runs sampled)
  multimatch x 25,492 ops/sec ±1.24% (86 runs sampled)
  nanomatch x 565,552 ops/sec ±1.16% (88 runs sampled)

  fastest is nanomatch

# benchmark/fixtures/match/not-glob-basic.js (93 bytes)
  minimatch x 90,972 ops/sec ±1.02% (86 runs sampled)
  multimatch x 71,725 ops/sec ±1.42% (86 runs sampled)
  nanomatch x 1,446,237 ops/sec ±0.99% (87 runs sampled)

  fastest is nanomatch

# benchmark/fixtures/match/star-basic.js (93 bytes)
  minimatch x 70,011 ops/sec ±1.23% (87 runs sampled)
  multimatch x 53,431 ops/sec ±1.07% (89 runs sampled)
  nanomatch x 650,425 ops/sec ±0.85% (90 runs sampled)

  fastest is nanomatch
