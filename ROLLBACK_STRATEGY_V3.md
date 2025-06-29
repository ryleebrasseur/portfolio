# StoryScroller v3 Refactor Rollback Strategy

**Date:** 2025-06-29  
**Purpose:** Comprehensive rollback plan for useDebouncing refactor  
**Risk Level:** Medium (internal changes only, public API preserved)

## Executive Summary

This document provides a complete rollback strategy for the StoryScroller v3 refactor. Since we're maintaining all public APIs and making only internal architectural changes, rollback risk is minimal. However, given the critical nature of this component for narrative portfolios, we need bulletproof rollback procedures.

## Rollback Triggers

### 1. **Automatic Rollback Conditions**
Execute immediate rollback if any of these occur:
- **Performance regression** >20% vs baseline metrics
- **Memory leaks** detected in any browser
- **Test suite** shows <95% pass rate
- **Production errors** in demo app
- **Build failures** in CI/CD pipeline

### 2. **Manual Rollback Conditions**
Consider rollback if:
- **Integration issues** with external consumers
- **Behavioral changes** in scroll navigation
- **Animation timing** disruptions
- **Error boundary** failures increase
- **Developer experience** significantly degraded

## Pre-Rollback Preparation

### 1. **Git Branch Strategy**
```bash
# Current working branch
feature/story-scroller-v3-debouncing

# Baseline preservation branch (CREATE BEFORE STARTING)
git checkout -b v2-baseline-preservation
git push -u origin v2-baseline-preservation

# Development branch
git checkout -b feature/useDebouncing-implementation
```

### 2. **Backup Critical Files**
Before any changes, create timestamped backups:
```bash
# Backup current implementation
cp src/components/StoryScroller.tsx StoryScroller.v2.backup.tsx
cp src/state/scrollReducer.ts scrollReducer.v2.backup.ts
cp src/context/ScrollContext.tsx ScrollContext.v2.backup.tsx

# Backup working test configurations
cp package.json package.v2.backup.json
cp vitest.config.ts vitest.v2.backup.ts
```

### 3. **Document Current State**
- ✅ **Functional audit** completed (STORY_SCROLLER_AUDIT_V2.md)
- ✅ **Performance baseline** captured (PERFORMANCE_BASELINE_V2.md)
- ✅ **Test coverage** analyzed (TEST_COVERAGE_ANALYSIS_V2.md)
- ✅ **Dependency mapping** completed (DEPENDENCY_MAP_V2.md)

## Rollback Procedures

### 1. **Immediate Rollback (Emergency)**
If critical issues are discovered during development:

```bash
# 1. Stop any running processes
pnpm dev:stop

# 2. Reset to baseline
git checkout v2-baseline-preservation
git reset --hard HEAD

# 3. Force clean workspace
git clean -fd
rm -rf node_modules
pnpm install

# 4. Verify functionality
pnpm dev
pnpm test

# 5. Create recovery branch
git checkout -b rollback-recovery-$(date +%Y%m%d-%H%M)
```

### 2. **Partial Rollback (File-Specific)**
If only certain components cause issues:

```bash
# Rollback specific files while preserving working changes
git checkout v2-baseline-preservation -- src/components/StoryScroller.tsx
git checkout v2-baseline-preservation -- src/state/scrollReducer.ts

# Keep working changes in other files
# Commit partial rollback
git add -A
git commit -m "Partial rollback: revert StoryScroller and scrollReducer to v2"
```

### 3. **Staged Rollback (Gradual)**
If issues emerge after deployment:

```bash
# Phase 1: Revert useDebouncing integration
git revert <useDebouncing-integration-commit>

# Phase 2: Remove useDebouncing files if needed
git rm src/hooks/useDebouncing.ts
git rm src/__tests__/unit/useDebouncing.test.ts

# Phase 3: Restore v2 scrollReducer if necessary
git checkout v2-baseline-preservation -- src/state/scrollReducer.ts
```

## File-Specific Rollback Plans

### 1. **StoryScroller.tsx**
**Risk**: HIGH (main component)
**Rollback Plan**:
```bash
# Quick rollback
git checkout v2-baseline-preservation -- src/components/StoryScroller.tsx

# Manual rollback (if git conflicts)
cp StoryScroller.v2.backup.tsx src/components/StoryScroller.tsx
```

**Validation**:
- Demo app loads without errors
- Navigation works correctly
- Performance matches baseline

### 2. **useDebouncing.ts** 
**Risk**: LOW (new file)
**Rollback Plan**:
```bash
# Remove new file
rm src/hooks/useDebouncing.ts
rm src/__tests__/unit/useDebouncing.test.ts

# Remove from exports
git checkout v2-baseline-preservation -- src/index.ts
```

**Validation**:
- Build completes successfully
- No import errors

### 3. **scrollReducer.ts**
**Risk**: MEDIUM (shared state)
**Rollback Plan**:
```bash
# Revert to v2 state shape
git checkout v2-baseline-preservation -- src/state/scrollReducer.ts

# Update dependent files if needed
git checkout v2-baseline-preservation -- src/context/ScrollContext.tsx
```

**Validation**:
- All tests pass
- Context provides expected state shape
- useStoryScroller hook works correctly

## Testing After Rollback

### 1. **Automated Validation**
```bash
# Run full test suite
pnpm test

# Performance regression test
pnpm test performance-baseline.spec.ts

# Demo app functionality
pnpm dev
# Manual verification of all features
```

### 2. **Manual Verification Checklist**
- [ ] Demo app loads without errors
- [ ] All 5 sections render correctly
- [ ] Mouse wheel navigation works
- [ ] Keyboard navigation functions
- [ ] Button navigation operates correctly
- [ ] Smooth scroll animations play
- [ ] No console errors or warnings
- [ ] Memory usage remains stable
- [ ] Performance matches baseline

### 3. **Cross-Browser Testing**
- [ ] Chrome: All functionality works
- [ ] Firefox: Navigation responsive
- [ ] Safari: Touch gestures work
- [ ] Edge: No compatibility issues

## Recovery Planning

### 1. **Root Cause Analysis**
Before attempting refactor again, analyze:
- **What specifically failed?** (performance, functionality, stability)
- **Why did it fail?** (architectural issue, implementation bug, environment)
- **How can it be prevented?** (better testing, different approach, staged implementation)

### 2. **Alternative Approaches**
If useDebouncing approach fails:
- **Minimal fixes**: Address only state closure bugs without full refactor
- **Gradual migration**: Implement changes in smaller, safer steps
- **Different architecture**: Consider alternative solutions to debouncing issues

### 3. **Lessons Learned Documentation**
Create rollback post-mortem:
- **Timeline of issues** that led to rollback
- **Technical details** of what went wrong
- **Process improvements** for future refactors
- **Updated risk assessment** for next attempt

## Stakeholder Communication

### 1. **Internal Team**
- **Immediate notification** of rollback decision
- **Clear timeline** for resolution and next steps
- **Impact assessment** on development schedule
- **Lessons learned** sharing for team growth

### 2. **External Users** (if applicable)
- No communication needed (internal changes only)
- Public API remains stable throughout
- Demo app continues functioning normally

## Prevention Strategies

### 1. **Enhanced Testing**
- **More comprehensive test coverage** before rollback
- **Automated performance testing** in CI/CD
- **Cross-browser testing** automation
- **Memory leak detection** integration

### 2. **Staged Implementation**
- **Smaller, incremental changes** instead of big refactor
- **Feature flags** for gradual rollout
- **A/B testing** for new vs old implementation
- **Continuous monitoring** during deployment

### 3. **Risk Mitigation**
- **Multiple code reviews** before merge
- **Extended testing period** before release
- **Canary releases** for production deployment
- **Quick rollback automation** for faster recovery

## Success Criteria for Rollback

### 1. **Functional Success**
- [ ] All original functionality restored
- [ ] No regressions from pre-refactor state
- [ ] Demo app works identically to before
- [ ] All tests pass at previous levels

### 2. **Performance Success**
- [ ] Performance metrics match baseline exactly
- [ ] Memory usage returns to previous levels
- [ ] Event rates match original measurements
- [ ] Animation timing is identical

### 3. **Stability Success**
- [ ] No crashes or errors in any browser
- [ ] Error boundaries function correctly
- [ ] State synchronization works properly
- [ ] Navigation responds consistently

## Repository State Management

### 1. **Branch Cleanup**
After successful rollback:
```bash
# Archive failed attempt
git tag v3-attempt-failed-$(date +%Y%m%d)
git push origin v3-attempt-failed-$(date +%Y%m%d)

# Clean up working branches
git branch -D feature/useDebouncing-implementation
git push origin --delete feature/useDebouncing-implementation
```

### 2. **Documentation Updates**
- Update CHANGELOG with rollback information
- Document lessons learned for future attempts
- Preserve investigation work for next iteration
- Update project timeline and roadmap

This rollback strategy ensures we can quickly and safely revert any changes if the v3 refactor encounters issues, while preserving all investigation work and learning for future improvement attempts.