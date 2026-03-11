# Quiz Game

A SvelteKit + TypeScript quiz game project.

## Prerequisites

- Node.js 20+ (LTS recommended)
- pnpm 10+
- Git

Check versions:

```bash
node -v
pnpm -v
git --version
```

## Repository Setup

1. Clone the repository:

```bash
git clone <your-repo-url>
cd quiz-game
```

2. Install dependencies:

```bash
pnpm install
```

3. Configure environment variables:

```bash
cp .env.example .env
```

Then set values in `.env`:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

## Run the Project

Start the development server:

```bash
pnpm dev
```

Build for production:

```bash
pnpm build
```

Preview production build:

```bash
pnpm preview
```

## Quality Checks

Run type checks:

```bash
pnpm check
```

Run tests:

```bash
pnpm test
```

Run lint checks:

```bash
pnpm lint
```

Auto-format code:

```bash
pnpm format
```

## Git Workflow

### Typical Flow

1. Sync your local `main`:

```bash
git checkout main
git pull origin main
```

2. Create a feature branch:

```bash
git checkout -b <your-branch-name>
```

3. Make changes and verify quality:

```bash
pnpm check
pnpm test
pnpm lint
```

4. Commit your changes:

```bash
git add .
git commit -m "<your-commit-message>"
```

5. Push and open a pull request:

```bash
git push -u origin <your-branch-name>
```

### Branch Name Rules

Replace this section with your team policy.

Example template:

- Pattern: `<type>/<issue-number>/<short-description>`
- Allowed `type`:`<feat|fix|chore|docs|test|refactor>`
- Examples:
  - `<feat/#3/type-file>`
  - `<fix/#4/button-bug-fix>`

### Commit Message Rules

Replace this section with your team policy.

Example template:

- Format: `<type>[issue-number]: <short summary>`
- Allowed `type`:`<feat|fix|docs|style|refactor|test|chore>`
- Keep summary in imperative mood and under 72 characters
- Examples:
  - `<feat[#2]: Create a type.ts file for shared data models>`

## Pull Request Checklist

- Code builds successfully (`pnpm build`)
- Checks pass (`pnpm check`, `pnpm test`, `pnpm lint`)
- Branch is up to date with `main`
- PR description explains what changed and why
- Screenshots included for UI changes (if applicable)

## Database Setup

Same URL and Token used in the previous project

## SQL Commands used:

`CREATE TABLE scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);`

`CREATE INDEX leaderboard ON scores (score DESC, created_at ASC);`

To use index: `SELECT * FROM scores ORDER BY score DESC, created_at ASC LIMIT 10;`
