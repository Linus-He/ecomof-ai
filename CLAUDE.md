# CLAUDE.md — Project Guidelines for AI-Assisted Development

## Commit Attribution Rules

All commits to this repository must follow the rules below without exception.

### 1. Author / Committer Identity

Every commit must use the repository owner's configured git identity:

```
git config user.name
git config user.email
```

Do not override `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`, `GIT_COMMITTER_NAME`, or `GIT_COMMITTER_EMAIL` to any AI tool identity.

### 2. Forbidden Strings in Commit Messages

The following strings must never appear anywhere in a commit subject, body, or footer:

- `Co-Authored-By: Claude`
- `Co-Authored-By: Claude Sonnet`
- `noreply@anthropic.com`
- `Generated with Claude`
- `Claude Code`
- `🤖 Generated with`
- Any AI-generated attribution footer of any form

### 3. No AI Co-Author Trailers

Do not add any AI tool (Claude, GPT, Copilot, Gemini, or any other) as a co-author via git trailers. The `Co-Authored-By:` trailer is reserved for human contributors only.

### 4. Acknowledging AI Assistance

If AI assistance is relevant to document, do so in `README.md` or the in-app Acknowledgements section as a plain prose statement. It must not appear in the git commit log.

### 5. Pre-Commit Verification

Before every commit, run the following to confirm the message is clean:

```bash
git log -1 --format='%B'
```

Verify the output contains none of the forbidden strings listed in Rule 2.

---

## Scope

These rules apply to all branches and all contributors (human or automated tooling acting on behalf of a contributor).
