Benchmarking: (6 of 6)
 · globstar-basic
 · large-list-globstar
 · long-list-globstar
 · negation-basic
 · not-glob-basic
 · star-basic

# benchmark/fixtures/match/globstar-basic.js (182 bytes)
  minimatch x 31,046 ops/sec ±0.56% (87 runs sampled)
  multimatch x 27,787 ops/sec ±1.02% (88 runs sampled)
  nanomatch x 453,686 ops/sec ±1.11% (89 runs sampled)

  fastest is nanomatch

# benchmark/fixtures/match/large-list-globstar.js (485686 bytes)
  minimatch x 25.23 ops/sec ±0.46% (44 runs sampled)
  multimatch x 25.20 ops/sec ±0.97% (43 runs sampled)
  nanomatch x 735 ops/sec ±0.66% (89 runs sampled)

  fastest is nanomatch

# benchmark/fixtures/match/long-list-globstar.js (194085 bytes)
  minimatch x 258 ops/sec ±0.87% (83 runs sampled)
  multimatch x 264 ops/sec ±0.90% (82 runs sampled)
  nanomatch x 1,858 ops/sec ±0.56% (89 runs sampled)

  fastest is nanomatch

# benchmark/fixtures/match/negation-basic.js (132 bytes)
  minimatch x 74,240 ops/sec ±1.22% (88 runs sampled)
  multimatch x 25,360 ops/sec ±1.18% (89 runs sampled)
  nanomatch x 545,835 ops/sec ±1.12% (88 runs sampled)

  fastest is nanomatch

# benchmark/fixtures/match/not-glob-basic.js (93 bytes)
  minimatch x 92,753 ops/sec ±1.59% (86 runs sampled)
  multimatch x 50,125 ops/sec ±1.43% (87 runs sampled)
  nanomatch x 1,195,648 ops/sec ±1.18% (87 runs sampled)

  fastest is nanomatch

# benchmark/fixtures/match/star-basic.js (93 bytes)
  minimatch x 70,746 ops/sec ±1.51% (86 runs sampled)
  multimatch x 54,317 ops/sec ±1.45% (89 runs sampled)
  nanomatch x 602,748 ops/sec ±1.17% (86 runs sampled)

  fastest is nanomatch
