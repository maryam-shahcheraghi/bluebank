# Bluebank monorepo

Minimal framework scaffolding with pnpm workspaces and Turborepo. There are no product features, databases, or authentication modules.

## Prerequisites and installation

Use Node.js **24.22.1** (see `.node-version`; supported range `>=24.22.1 <25`) and pnpm **12.15.0**, pinned in `packageManager`. CI uses these same versions. With the supported Node version active:

```sh
npm install --global pnpm@12.15.0
pnpm install --frozen-lockfile
```

Keep the single root `pnpm-lock.yaml` in source control. Run dependency installation from the root; use `pnpm --filter @bluebank/web add <package>` (or the corresponding application) when adding dependencies. Dependency lifecycle script decisions live in `pnpm-workspace.yaml`; review new scripts rather than allowing every package to execute them. The exact Next.js release entries in `minimumReleaseAgeExclude` permit the selected stable patch through pnpm's default one-day release-age gate; other packages keep the default policy.

## Commit messages

Commitlint uses the standard [Conventional Commits configuration](https://commitlint.js.org/reference/configuration.html), without custom rule overrides. Messages use `<type>[optional scope]: <description>`, for example:

```text
chore: configure commit message linting
docs: explain local setup
fix(api): correct port validation
```

The root installation registers a Husky `commit-msg` hook that validates each commit message. Node.js and pnpm must be available on the committing process's `PATH`, including when committing through an IDE. Hook installation is skipped in CI, production, and source directories without Git metadata.

To check a message manually, run `echo "docs: explain local setup" | pnpm commitlint`. To check the latest commit, run `pnpm commitlint --last --verbose`. CI validates the latest commit on pushes and the full commit range on pull requests.

## Local environment and startup

Copy these safe examples once; the commands work in a POSIX shell or PowerShell:

```sh
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
cp apps/api/.env.example apps/api/.env
pnpm dev
```

- Web: <http://localhost:3000>
- Admin: <http://localhost:3001> (fails if the port is occupied)
- API health: <http://localhost:4000/health>, returning `{"status":"ok"}`

Stop the group with Ctrl+C. On Windows, shutdown signal support is limited by the operating system; deployment supervisors should provide normal termination signals on their target platform.

Next.js loads environment files from `apps/web`, including `.env.local` and mode-specific files. Vite loads them from `apps/admin`, including `.env.local` and `.env.[mode]`. Nest's bootstrap explicitly loads only `apps/api/.env`, relative to the application working directory. Package scripts establish that working directory. Already injected process variables take precedence. A root `.env` is not loaded by this setup.

`NEXT_PUBLIC_API_URL` and `VITE_API_URL` default to `http://localhost:4000` in the examples. They are public configuration embedded into frontend production builds; rebuild when they change. Never put credentials in `NEXT_PUBLIC_*` or `VITE_*` variables. The placeholder pages display their configured API URL without requiring the API to be available during builds.

API `PORT`, `HOST`, `CORS_ORIGINS`, and `NODE_ENV` are server runtime configuration. `PORT` and `CORS_ORIGINS` are required and validated before listening. `PORT` must be an integer from 1 to 65535; `CORS_ORIGINS` is a comma-separated list of exact HTTP(S) origins without paths, trailing slashes, credentials, or wildcards. Local examples allow `http://localhost:3000` and `http://localhost:3001`. Using `127.0.0.1` in a browser requires adding those exact origins too. `HOST` defaults to loopback; inject `0.0.0.0` where deployment networking requires it. `NODE_ENV` defaults to development and accepts development, production, or test. CORS credentials are disabled. CORS controls browser access, not authorization of non-browser clients.

Real environment files are ignored. Only `.env.example` files belong in source control. Secret values for future server functionality must be injected into the server runtime and kept out of client imports, public environment variables, and `next.config`'s `env` option.

## Commands

Run these from the repository root:

- `pnpm dev`: run all three development servers.
- `pnpm dev:web`, `pnpm dev:admin`, `pnpm dev:api`: run one application.
- `pnpm build`: build all three applications.
- `pnpm lint`: independently lint each application using its own configuration.
- `pnpm typecheck`: independently check application and Vite configuration types; Next route types are generated first.
- `pnpm format`: format source, configuration, and documentation.
- `pnpm format:check`: check formatting without modifying files.
- `pnpm commitlint`: validate a commit message from standard input, or accept commitlint CLI arguments such as `--last` and `--edit`.
- `pnpm --filter @bluebank/web start`: run the built Next standalone server.
- `pnpm --filter @bluebank/api start`: run the compiled Nest server.
- `pnpm --filter @bluebank/admin preview`: inspect the static build locally; this is not a production server.

For other filtered tasks, use `pnpm exec turbo run build --filter=@bluebank/web` or change the task/package. Build, lint, and typecheck tasks use local Turbo caching. Development tasks are persistent and never cached. Strict environment handling, declared public variables, and app-local `.env*` inputs prevent reusing frontend builds for a different API URL. When adding environment variables that affect a task, declare them in `turbo.json` as well as the application's example. No remote cache account or credentials are required.

On Windows, Next standalone output can contain absolute directory junctions. In this setup, Turbo 2.11.10 reports `provided value is too long when setting link name` when archiving that output, so the web build succeeds but its build cache is not saved. Admin/API build caching and lint/typecheck caching work. Do not depend on web build-cache reuse on affected Windows hosts; deployment builds should run on their target platform.

## Applications and configuration

```text
apps/web    Next.js App Router; React; standalone Node output
apps/admin  Vite and React; static dist output
apps/api    NestJS with Express; compiled Node ESM output
```

Each application owns its TypeScript and ESLint configuration and the dependencies those configurations import. The pnpm workspace includes only `apps/*`; there is no separate shared configuration package directory. Configuration inheritance is local to an application, such as Nest's build configuration extending its own TypeScript configuration.

Next and Vite resolve `@/*` to each application's `src` directory. API code uses relative `.js` import specifiers so emitted ESM runs directly in Node without an alias loader. Browser TypeScript uses bundler resolution; Nest uses NodeNext resolution with decorator metadata. Repository-wide orchestration, formatting, and commit tooling remain at the root. pnpm's workspace settings enforce the declared Node.js engine requirements.

## Production execution

Set public frontend URLs to their externally reachable deployment values **before** building:

```sh
# POSIX example; use injected environment variables on your deployment platform.
NEXT_PUBLIC_API_URL=https://api.example.com VITE_API_URL=https://api.example.com pnpm build
```

**Web:** `pnpm build` creates `apps/web/.next/standalone`. The build's Node packaging script copies `.next/static` and `public` (when present) into the nested application directory. Deploy the **entire standalone directory**, including its root `node_modules`, and run `node apps/web/server.js` from that directory. From the source workspace, `pnpm --filter @bluebank/web start` runs the equivalent server. Inject `PORT=3000` and `HOSTNAME=0.0.0.0` as appropriate. Build artifacts must match the target OS/architecture; Windows junction-based outputs may not be relocatable, so build deployment artifacts on the target platform. [Next.js standalone documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)

**API:** after building, run `pnpm --filter @bluebank/api start` from an installed workspace. For a separate deployment, provision the API's production dependencies with the root lockfile and workspace resolution, preserve its `package.json` (`type: module`), deploy `dist`, and run `node dist/main.js` from the API directory. Do not assume `dist` bundles its dependencies. Inject `NODE_ENV=production`, `PORT=4000`, `HOST=0.0.0.0`, and the exact deployed frontend origins in `CORS_ORIGINS`. A local `.env` is optional when these values are injected. Graceful shutdown hooks and baseline security headers are enabled.

**Admin:** publish `apps/admin/dist` to a static host/CDN. Serve the generated assets with correct MIME types, cache hashed assets immutably, and avoid long-lived caching of `index.html`. Configure an `index.html` fallback for future client-side routes while preserving real asset responses and 404s. No client router is included yet. If hosting under a subpath, set Vite's `base` accordingly before building. [Vite static deployment documentation](https://vite.dev/guide/static-deploy)

The CI workflow performs frozen-lockfile installation, linting, type checking, formatting checks, and builds using safe public configuration without secrets. Local smoke verification should start `pnpm dev`, poll all three URLs above, and stop all started processes.

Repository configuration is a foundation, not a guarantee of production readiness. Deployments still need TLS termination, ingress/routing, secret injection and rotation, process supervision and restart policy, resource limits, logs/metrics/traces, alerting, and a shutdown/drain policy. The health endpoint proves process responsiveness only; it is not a dependency readiness check. No external infrastructure is provisioned here.
