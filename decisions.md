# Architecture Decision Records

## Prompt Archive

User task prompts are saved in the root `Propmpts` directory with sequential, descriptive filenames, such as `01.scaffolding.md` and `03.writefirstadr.md`.

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
