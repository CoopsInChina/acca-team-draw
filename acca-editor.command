#!/bin/bash
# ============================================================================
# ACCA DATA EDITOR — double-click launcher
# ----------------------------------------------------------------------------
# Starts the local admin server and opens the week-entry editor in your
# browser. Leave this Terminal window open while you work; closing it (or
# pressing Ctrl+C) stops the server. Saves still write straight to
# stats/data.js on this Mac — nothing is uploaded anywhere by this script.
# ============================================================================

cd "$(dirname "$0")" || exit 1

# Double-clicking launches a non-login shell, so PATH tweaks from your normal
# shell setup (Homebrew, nvm, etc.) may be missing — pull them in if present.
[ -f "$HOME/.zshrc" ]         && source "$HOME/.zshrc" >/dev/null 2>&1
[ -f "$HOME/.bash_profile" ]  && source "$HOME/.bash_profile" >/dev/null 2>&1
[ -f "$HOME/.nvm/nvm.sh" ]    && source "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
[ -d "/opt/homebrew/bin" ]    && export PATH="/opt/homebrew/bin:$PATH"
[ -d "/usr/local/bin" ]       && export PATH="/usr/local/bin:$PATH"

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  ✘ Could not find 'node' on this Mac."
  echo "    Install Node.js from https://nodejs.org, then try again."
  echo ""
  read -n 1 -s -r -p "  Press any key to close this window..."
  echo ""
  exit 1
fi

PORT="${PORT:-4599}"
URL="http://localhost:${PORT}/stats/admin/"

echo ""
echo "  ⚽  Acca Data Editor"
echo "  →  ${URL}"
echo ""
echo "  Leave this window open while you work. Close it (or press Ctrl+C) to stop."
echo ""

# Give the server a moment to start listening, then open the browser.
( sleep 1.5 && open "${URL}" ) &

node stats/admin/serve.js
