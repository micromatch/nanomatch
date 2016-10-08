Benchmarking: (4 of 4)
 · globstar-basic
 · negation-basic
 · not-glob-basic
 · star-basic

# benchmark/fixtures/match/globstar-basic.js (182 bytes)
  minimatch x 35,521 ops/sec ±0.99% (82 runs sampled)
  multimatch x 29,662 ops/sec ±1.90% (82 runs sampled)
  nanomatch x 719,866 ops/sec ±1.53% (84 runs sampled)

  fastest is nanomatch

# benchmark/fixtures/match/negation-basic.js (132 bytes)
  minimatch x 65,810 ops/sec ±1.11% (85 runs sampled)
  multimatch x 24,267 ops/sec ±1.40% (85 runs sampled)
  nanomatch x 698,260 ops/sec ±1.42% (84 runs sampled)

  fastest is nanomatch

# benchmark/fixtures/match/not-glob-basic.js (93 bytes)
  minimatch x 91,445 ops/sec ±1.69% (83 runs sampled)
  multimatch x 62,945 ops/sec ±1.20% (84 runs sampled)
  nanomatch x 3,077,100 ops/sec ±1.45% (84 runs sampled)

  fastest is nanomatch

# benchmark/fixtures/match/star-basic.js (93 bytes)
  minimatch x 62,144 ops/sec ±1.67% (85 runs sampled)
  multimatch x 46,133 ops/sec ±1.66% (83 runs sampled)
  nanomatch x 1,039,345 ops/sec ±1.23% (86 runs sampled)

  fastest is nanomatch
