#!/usr/bin/env bash
# Hook PreToolUse déclenché avant Write/Edit.
# Rappelle à Claude de consulter context7 AVANT d'écrire du code qui utilise une
# librairie externe, pour éviter les hallucinations d'API.
#
# Payload JSON fourni sur stdin par Claude Code : contient tool_name et tool_input.
# On regarde l'extension du fichier ciblé pour ne se déclencher que sur du code.

payload=$(cat)

file_path=$(printf '%s' "$payload" | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]+"' | head -n1 | sed -E 's/.*"file_path"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/')

case "$file_path" in
  *.js|*.mjs|*.cjs|*.ts|*.tsx|*.jsx)
    cat <<'EOF'
[context7-reminder] Tu es sur le point d'écrire du code JS/TS. Rappel des règles du projet :

1. Si tu utilises une librairie externe (Express, Fastify, Jest, Vitest, Prisma, Mongoose, Zod, axios, undici, etc.), consulte la doc à jour via MCP context7 AVANT d'écrire :
   - mcp__plugin_context7_context7__resolve-library-id  (nom de la lib)
   - mcp__plugin_context7_context7__query-docs         (ID + question ciblée)
   Ta connaissance d'entraînement peut être obsolète.

2. Si le module contient de la logique métier, prévois un test unitaire (skill unit-test-creation ou sous-agent test-writer).

3. Pas de commentaires triviaux. Pas de sur-abstraction. Lis package.json avant de supposer un framework.
EOF
    ;;
  *)
    # Fichier non-code : rien à rappeler.
    :
    ;;
esac

exit 0
