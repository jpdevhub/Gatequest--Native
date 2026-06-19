# Engineering Guidelines

These guidelines apply to every change in this repository.

## 1. Think Before Coding

Do not assume or hide uncertainty.

Before implementing:

- State assumptions explicitly.
- Surface multiple valid interpretations instead of choosing silently.
- Prefer the simpler approach when it satisfies the requirement.
- Stop and ask when ambiguity would materially change the implementation.

## 2. Simplicity First

Write the minimum code needed for the requested outcome.

- Do not add unrequested features.
- Do not create abstractions for one-time use.
- Do not add speculative configurability.
- Avoid handling scenarios that cannot occur.
- Simplify code that is materially larger than the problem requires.

## 3. Surgical Changes

Touch only the code required for the current task.

- Do not refactor adjacent code without a direct need.
- Match the existing project style.
- Mention unrelated problems instead of fixing them silently.
- Remove only the unused code created by the current change.

Every changed line should trace directly to the requested outcome.

## 4. Goal-Driven Execution

Define verifiable success criteria before implementation.

For multi-step work, use this format:

1. Step -> verify: concrete check
2. Step -> verify: concrete check
3. Step -> verify: concrete check

For bugs and behavior changes, reproduce the current behavior when practical, implement
the smallest correction, and verify the expected result.
