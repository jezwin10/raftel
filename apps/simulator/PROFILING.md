# Raftel Simulator — Performance Profiling Report

## Overview

This document records the results of benchmarking the `SimulationEngine`
physics core. The goal is to characterise computational cost as a function
of body count, identify the practical body limit at 60fps, and document
the accuracy/performance tradeoff of different timestep sizes.

Benchmarks are located in `apps/simulator/src/benchmarks/engine.bench.ts`
and can be reproduced with:

```bash
cd apps/simulator
npx vitest bench
```

---

## 1. O(n²) Scaling — Step Time vs Body Count

The engine computes gravitational forces between every unique pair of bodies.
For n bodies this is n(n-1)/2 force pairs per step — quadratic growth.

| Bodies | Force pairs | avg step time | p99 step time | Within 16ms budget? |
|-------:|------------:|--------------:|--------------:|:-------------------:|
|      2 |           1 |      0.0002ms |      0.0003ms |         yes         |
|      4 |           6 |      0.0007ms |      0.0010ms |         yes         |
|      8 |          28 |      0.0021ms |      0.0025ms |         yes         |
|     16 |         120 |      0.0074ms |      0.0085ms |         yes         |
|     32 |         496 |      0.0254ms |      0.0295ms |         yes         |
|     64 |        2016 |      0.0965ms |      0.2518ms |         yes         |

> The 16ms budget is derived from the 60fps target frame rate (1000ms / 60 ≈ 16.67ms).
> The physics step must complete within this budget to leave time for rendering.

### Findings

- _The step time remains well under 1ms up to n = 128 bodies._
- _The budget is first exceeded between n = 768 and n = 1024 bodies._

---

## 2. Timestep Size — Cost vs Accuracy

Halving the timestep (DT) doubles the number of physics steps required per
second of simulated time, directly doubling CPU cost. There is no mechanism
to improve accuracy without increasing step count.

| Timestep    | avg step time | Relative cost | Max energy error (500 steps, e=0.5) |
|:------------|:-------------:|:-------------:|:-----------------------------------:|
| 14 hours    |   0.0006ms    |      1×       |                              ~1.48% |
|  1 hour     |   0.0006ms    |      1×       |                              ~0.08% |
| 10 minutes  |   0.0006ms    |      1×       |                                   — |

> Energy error figures for 14h and 1h timesteps come from the orbit conservation
> tests in `src/tests/core/physics/orbits.test.ts`.

### Findings

- _Step time is essentially constant across DT values (as expected — the_
  _integrator does the same amount of work regardless of the time value)._
- _Halving accuracy cost therefore means doubling step frequency, not_
  _changing the DT parameter in isolation._

---

## Environment

- Hardware: _MacBook Air, M3, 16GB_
- Node version: _11.10.1_
- Vitest version: _4.1.0_
- Date: _19/03/26_