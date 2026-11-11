# Architecture Decision Records

## Prompt Archive

User task prompts are saved in the root `Propmpts` directory with sequential, descriptive filenames.

This directory exists only as a historical record of submitted prompts. Its contents must not be read for decision-making or reviews, or used as active project instructions.

## ADR-0001: Use a Monorepo

- **Status:** Accepted
- **Date:** 2026-10-24
- **Scope:** Repository organization for the web, admin, API, and shared configuration packages.

### Context

The project contains three TypeScript applications: a Next.js web application, a Vite/React admin application, and a NestJS API. They use different framework configurations and produce different deployment artifacts, while sharing development tooling and code-quality conventions.

The initial requirements call for dependency installation at the repository root and one command to start all three applications. Changes to shared tooling also need to be coordinated across the applications.

### Decision

We use one Git repository containing the three applications and their shared configuration packages: a monorepo.

Each application retains its own package manifest, framework dependencies, TypeScript configuration, build artifact, and production execution model. Cross-application changes can be reviewed and committed together.

### Rationale

A monorepo supports the required unified developer workflow and makes coordinated changes visible in one place. Shared TypeScript and ESLint configurations reduce repeated configuration work, and a single dependency lockfile gives the workspace a reproducible dependency graph.

This fits the project's current scope: three related applications with common tooling. It avoids introducing cross-repository package publishing and version coordination for the existing shared configuration packages.

### Initial Solution

The initial implementation used pnpm workspaces for package linking and dependency installation, with Turborepo coordinating development, builds, linting, and type checking.

- `apps/web` contains the Next.js application.
- `apps/admin` contains the Vite/React application.
- `apps/api` contains the NestJS application.
- `packages/typescript-config` and `packages/eslint-config` contain the shared configuration packages.
- The root `pnpm-workspace.yaml` defines workspace membership, and `pnpm-lock.yaml` records the dependency graph.
- Root scripts provide the common workflow, including `pnpm dev` to start all applications. Workspace filters support running an individual application or task.

The applications remain separate deployment units: Next.js produces a standalone Node server, Vite produces static assets, and NestJS produces compiled Node application code.

### Implementation Update: 2026-10-25

The monorepo decision remains accepted. At the user's request, TypeScript and ESLint configuration now lives within each application, together with its tooling dependencies. The original shared configuration packages have been removed, and pnpm workspace membership now includes only `apps/*`.

This gives each application direct ownership of its configuration and removes cross-package configuration inheritance. The trade-off is duplicated configuration and the effort needed to keep common settings aligned when desired. Root-level repository tooling still coordinates installation, development, and validation.

### Alternatives Considered

**Separate repositories for each application:** This would provide stronger separation of repository access and tooling ownership. However, coordinated changes would span multiple reviews and commits, and shared configurations would need a distribution and versioning mechanism. Reproducing the required unified local workflow would require additional orchestration.

**One repository with a single application package:** This would reduce workspace setup, but combine dependencies and framework-specific configuration in one package. The different browser and server module-resolution and build requirements make separate workspace packages a clearer fit.

### Consequences

#### Benefits

- Developers can install dependencies and run the complete local stack from the repository root.
- Related changes across applications and shared configuration can be delivered in one commit.
- Common tooling can be maintained centrally while application dependencies remain explicit.
- Task filtering and caching can reduce repeated work as the repository grows.

#### Costs and Trade-offs

- **Tooling maintenance:** Engineering time is needed to maintain workspace configuration, task dependencies, cache inputs, and compatible tool versions.
- **Coordination:** Shared configuration and lockfile changes can affect multiple applications, increasing review and validation effort.
- **CI resources:** Broad changes can trigger checks or builds across several packages. Caching and filtering reduce this cost but require correct configuration.
- **Repository access:** Applications share a repository access boundary; separate repositories would offer simpler access separation.
- **Future extraction:** Moving an application to its own repository would require separating its dependencies, shared configuration, and automation.

These are qualitative engineering and operational costs. No monetary or delivery-time estimate has been established for this decision.

### References

- [Project setup and developer workflow](README.md)
- [Michael Nygard: Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) — the basis for the context, decision, status, and consequences structure.

## ADR-0002: Use Fastify as the NestJS HTTP Adapter

- **Status:** Proposed — awaiting user review of this record; the adapter is already implemented in commit `e5af523`.
- **Date:** 2026-11-11
- **Scope:** The HTTP adapter and adapter-specific integrations of the NestJS backend in `apps/api`.

### Context

The repository already contained a NestJS API using the Express adapter. The backend setup request explicitly required `@nestjs/platform-fastify`, an explicit `FastifyAdapter`, and no direct Express application dependency or Express middleware.

The application currently exposes only a lightweight `GET /health` endpoint. Its bootstrap also configures validated runtime settings, shutdown hooks, baseline security headers, and optional CORS. The adapter must support this scope while preserving Nest's application structure and the existing Turborepo workflow.

### Decision

Use Fastify through `@nestjs/platform-fastify` as the API's HTTP adapter. Create the application with `NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), ...)` and remove `@nestjs/platform-express` from the API's direct dependencies.

Use Nest's Fastify-backed APIs or Fastify-native plugins when adapter-specific functionality is needed. Do not introduce Express middleware into this application.

### Rationale

The primary reason for this choice is the user's explicit backend requirement. Nest provides a supported Fastify adapter, allowing the API to retain Nest controllers, modules, and lifecycle handling while using Fastify for HTTP processing.

The current application has no business routes or custom Express middleware to migrate. This limits the immediate migration work to dependencies, bootstrap configuration, and verification of the existing health endpoint and HTTP behavior.

Fastify's plugin ecosystem is available for future HTTP integrations. This is an architectural option, not a reason to add plugins before they are needed. No application benchmark was performed, so this decision does not claim measured latency, throughput, infrastructure savings, or superiority over other adapters.

### Initial Solution

- The API uses `@nestjs/common`, `@nestjs/core`, and `@nestjs/platform-fastify` at version `12.2.0`. The selected platform package supplies its compatible Fastify dependency.
- `apps/api/src/main.ts` explicitly supplies `FastifyAdapter` and uses the `NestFastifyApplication` type. Nest's baseline security headers and optional CORS run through this adapter without Express middleware.
- `GET /health` returns HTTP 200 with `{"status":"ok"}` and performs no external dependency checks.
- The host defaults to `127.0.0.1`; container environments can inject `HOST=0.0.0.0`. The validated port defaults to `4000`.
- Development and compiled production startup were verified, including the health response, CORS behavior, security headers, and nonzero exits for invalid configuration and an occupied listening address. See the README for the verification conditions and Windows limitations.

SWC compilation and Turborepo orchestration were implemented in the same backend task, but they are separate concerns from the HTTP adapter choice and are not justified by this ADR.

### Alternatives Considered

**Retain Express:** This would avoid changing the existing adapter and preserve compatibility with Express middleware. It would conflict with the explicit Fastify requirement for this backend task.

**Use another Nest HTTP adapter:** This would require revisiting the user's specified adapter and validating the alternative against the pinned Nest release and required HTTP integrations. No comparative evaluation was performed in this task.

### Consequences

#### Benefits

- The implementation satisfies the requested Fastify architecture while retaining Nest's controller and module model.
- The HTTP platform is explicit in the bootstrap rather than selected implicitly.
- The current endpoint and bootstrap behavior have been exercised with the chosen adapter in development and production execution.

#### Costs and Trade-offs

- **Migration and verification:** Engineering time is required to replace the adapter dependency and confirm startup, health responses, CORS, security headers, binding behavior, and failure handling.
- **Middleware compatibility:** Express-specific middleware and request/response APIs cannot be assumed to work. Future integrations may require Fastify-native alternatives or adapter-specific code.
- **Dependency maintenance:** Nest, its platform adapter, Fastify, and any future Fastify plugins must remain compatible. Upgrades require checking their supported versions and rerunning HTTP verification.
- **Team familiarity:** Contributors must understand Fastify's plugin and request lifecycle when working below Nest's platform-independent APIs.
- **Future migration:** Switching adapters again would require replacing adapter-specific integrations and validating HTTP behavior. Keeping ordinary route logic in Nest controllers limits, but does not eliminate, this work.
- **Unmeasured operational benefit:** The health smoke checks establish functionality, not capacity. Load tests would be needed before using this choice to justify resource sizing or hosting-cost estimates.

These are qualitative engineering and operational costs. No monetary cost, delivery-time estimate, or hosting-cost reduction has been established for this decision.

### References

- [NestJS HTTP adapters and Fastify integration](https://docs.nestjs.com/techniques/performance)
- [API bootstrap](apps/api/src/main.ts)
- [API dependencies](apps/api/package.json)
- [Project setup and verification](README.md)
