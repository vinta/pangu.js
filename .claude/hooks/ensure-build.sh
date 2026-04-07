#!/bin/bash
# Rebuilds dist/ when a source file is edited.
# Called from PostToolUse on Edit|Write. Receives tool input via stdin.

cd "$CLAUDE_PROJECT_DIR" || exit 0

FILE=$(jq -r '.tool_input.file_path // .tool_input.path // ""' 2>/dev/null)

case "$FILE" in
  */src/*|*/browser-extensions/*) ;;
  *) exit 0 ;;
esac

npm run build >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "npm run build failed" >&2
  exit 2
fi

exit 0
