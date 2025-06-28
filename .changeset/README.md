# Changesets

This directory contains changeset files that track changes to packages in this monorepo.

## What are Changesets?

Changesets are a way to manage versioning and changelogs in a multi-package repository. Each changeset describes what packages have changed and how they have changed.

## Creating a Changeset

To create a changeset, run:

```bash
pnpm changeset
```

This will prompt you to:

1. Select which packages have changed
2. Select the type of change (major, minor, patch)
3. Write a summary of the changes

## Changeset Types

- **Major**: Breaking changes that require users to update their code
- **Minor**: New features that are backwards compatible
- **Patch**: Bug fixes and minor improvements

## Examples

### Creating a changeset for a bug fix:

```bash
pnpm changeset
# Select the package(s) that changed
# Select "patch" for the change type
# Write: "Fixed issue with dark mode toggle not persisting state"
```

### Creating a changeset for a new feature:

```bash
pnpm changeset
# Select the package(s) that changed
# Select "minor" for the change type
# Write: "Added new accordion component with keyboard navigation support"
```

### Creating a changeset for a breaking change:

```bash
pnpm changeset
# Select the package(s) that changed
# Select "major" for the change type
# Write: "BREAKING: Changed API for motion system. See migration guide."
```

## Best Practices

1. **Write clear summaries**: Your changeset summary will appear in the changelog
2. **Be specific**: Mention what changed and why it matters to users
3. **Include issue numbers**: Reference GitHub issues when applicable (e.g., "Fixed #123")
4. **Group related changes**: If multiple packages changed for the same feature, include them in one changeset
5. **Don't commit empty changesets**: Only create changesets for user-facing changes

## Release Process

1. Create changesets as you work on features/fixes
2. When ready to release, the CI will create a "Version Packages" PR
3. This PR updates package versions and changelogs based on changesets
4. Merge the PR to trigger the release
5. Changesets are automatically deleted after release

## Troubleshooting

**Q: I forgot to add a changeset with my PR**
A: You can add a changeset in a follow-up PR before the next release

**Q: I need to modify a changeset**
A: Edit the `.md` file in the `.changeset` directory directly

**Q: How do I see pending changesets?**
A: Run `pnpm changeset status`

## Additional Resources

- [Changesets Documentation](https://github.com/changesets/changesets)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
