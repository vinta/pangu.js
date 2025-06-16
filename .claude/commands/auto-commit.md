# Auto Commit

Follow the instructions precisely. If it wasn't specified, don't do it.

## Git Commit Rules

AUTOMATICALLY execute the following git workflow whenever you:

- Complete a functional stage of development
- Finish implementing a TODO item
- Complete a working feature or fix
- Complete user's request

### Commit Process:

1. RUN: `git add .` to stage all changes
2. RUN: `git commit -m "[message]"` with descriptive commit message
3. Just execute git commands, no need to use git hooks

### Commit Message Format:

Use one of these formats based on the type of change:

- `feat: [feature description]` for new features
- `fix: [fix description]` for bug fixes
- `refactor: [refactor description]` for code refactoring
- `docs: [documentation change]` for documentation updates
- `test: [test description]` for test additions/changes
- `chore: [chore description]` for maintenance tasks

### Examples:

- `feat: add user authentication system`
- `fix: resolve null pointer exception in data parser`
- `refactor: simplify database connection logic`
- `docs: update API endpoint documentation`

### Important:

- Make commits atomic and focused on a single change
- Ensure code is in a working state before committing
- Do NOT commit if tests are failing or code has syntax errors
- Each commit should represent a logical unit of work
