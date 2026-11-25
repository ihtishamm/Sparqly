#!/usr/bin/env bash
# Fails if a source or config file carries code hidden the way the Feb 2026
# injection did: an obfuscated payload pushed far right of a normal line.
# Looks for the payload's markers and for absurdly long lines in JS/TS files.
set -euo pipefail

files=$(git ls-files '*.js' '*.mjs' '*.cjs' '*.ts' '*.tsx' '*.json' \
  ':!:*lock*' ':!:package-lock.json')

status=0
if grep -nE "global\[['\"]!['\"]\]|_\\\$_[0-9a-f]{4}\b|String\.fromCharCode\(127\)" $files; then
  echo "::error::Known injected-code marker found (see lines above)."
  status=1
fi

# Long lines are where the payload hides. 1000 characters is far above any
# line this codebase writes by hand.
if ! awk 'length($0) > 1000 {
    printf "%s:%d: line is %d characters\n", FILENAME, FNR, length($0); bad = 1
  } END { exit bad }' $files; then
  echo "::error::Suspiciously long line found (see above)."
  status=1
fi

exit $status
