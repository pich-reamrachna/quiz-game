# Quiz Game

A SvelteKit + TypeScript quiz game project.

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+
- Git

Check versions:

```bash
node -v
npm -v
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
npm install
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
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Quality Checks

Run type checks:

```bash
npm run check
```

Run tests:

```bash
npm test
```

Run lint checks:

```bash
npm run lint
```

Auto-format code:

```bash
npm run format
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
npm run check
npm test
npm run lint
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

### Branch Name Rules (Placeholder)

Replace this section with your team policy.

Example template:

- Pattern: `<type>/<issue-number>/<short-description>`
- Allowed `type`:`<feat|fix|chore|docs|test|refactor>`
- Examples:
  - `<feat/#3/type-file>`
  - `<fix/#4/button-bug-fix>`

### Commit Message Rules (Placeholder)

Replace this section with your team policy.

Example template:

- Format: `<type>[issue-number]: <short summary>`
- Allowed `type`:`<feat|fix|docs|style|refactor|test|chore>`
- Keep summary in imperative mood and under 72 characters
- Examples:
  - `<feat[#2]: Create a type.ts file for shared data models>`

## Pull Request Checklist

- Code builds successfully (`npm run build`)
- Checks pass (`npm run check`, `npm test`, `npm run lint`)
- Branch is up to date with `main`
- PR description explains what changed and why
- Screenshots included for UI changes (if applicable)
