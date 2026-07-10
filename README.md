# Migueli Guru Finances

Private app for tracking my investments.

## Technical Tools

Some cool highlighted tools this project uses:

- **Effect**: a powerful TypeScript library designed to help developers easily create complex, synchronous, and asynchronous programs.
- **tRPC**: end-to-end typesafe API layer — procedures live in the BFF services
- **nuqs**: for type-safe URL search params
- **yahoo-finance2**: a community API for Yahoo-Finance, for Stock/ETF market data
- **Coinbase API**: Coinbase official exchange API for real-time crypto market data
- **Vercel BotId** invisible CAPTCHA for bot protection
- **Next.js PWA**: installable as a native app on mobile and desktop
- **NextThemes**: For Light and Dark mode
- **unstable_cache**: Next.js server-side caching with revalidation for services
- **AI Tooling:** Claude Code with Vercel's agent skills

## Code Quality Tools

This project uses automated code quality tools to maintain consistency:

- **vite-plus**: Unified toolchain that bundles linting, formatting and testing:
    - **oxlint**: Rust-based linter (replaces ESLint)
    - **oxfmt**: Rust-based code formatter (replaces Prettier)
    - **Vitest**: Unit testing
- **Knip**: Detects unused files, exports, and dependencies
- **TypeScript**: Provides type safety
- **Husky**: Runs pre-commit hooks automatically
- **SonarQube Cloud**: Continuous code analysis for bugs, vulnerabilities, and code smells
