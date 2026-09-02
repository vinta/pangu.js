#!/bin/bash
# Rebuilds dist/ when a source file is edited.
# Called from PostToolUse on Edit|Write, filtered to source paths by the hook's `if` field.

cd "${CLAUDE_PROJECT_DIR}" || exit 0

if ! npm run build >/dev/null 2>&1; then
  echo "npm run build failed" >&2
  exit 2
fi

exit 0
