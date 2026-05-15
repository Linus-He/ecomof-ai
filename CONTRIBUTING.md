# Contributing Guidelines

## Commit Attribution

All commits to this repository should use the repository owner's configured git
identity unless a human collaborator is intentionally contributing work.

Check the active identity before committing:

```bash
git config user.name
git config user.email
```

Do not override `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`, `GIT_COMMITTER_NAME`, or
`GIT_COMMITTER_EMAIL` to an automated tool identity.

## Commit Message Rules

Do not add generated attribution footers, tool signatures, or AI tool
co-author trailers to commit messages.

The `Co-Authored-By:` trailer is reserved for human contributors only.

Before pushing a commit, confirm the latest commit message is clean:

```bash
git log -1 --format='%B'
```

## AI Assistance

If AI assistance needs to be documented, describe it in project documentation or
acknowledgements as plain prose. Do not encode it in git author, committer, or
co-author metadata.
