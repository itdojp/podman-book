# Caching Strategy Guide

This document explains the caching implementation for optimizing build times in GitHub Actions.

## Overview

Our caching strategy reduces build times by up to 80% through intelligent caching of:
- NPM dependencies
- Build outputs
- Intermediate processing files

## Cache Layers

### 1. NPM Dependencies Cache

**What's cached:**
- `node_modules/` directory
- `~/.npm` global cache

**Cache key strategy:**
```yaml
key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
```

**Impact:** Saves ~45 seconds on average

### 2. Build Artifacts Cache

**What's cached:**
- `public/` - Final build output
- `.build-meta.json` - Build metadata for incremental builds
- `.cache/` - Intermediate processing cache

**Cache key strategy:**
```yaml
key: ${{ runner.os }}-build-${{ hashFiles('src/**/*', 'book-config.json') }}
```

**Impact:** Enables incremental builds, saves ~30 seconds

### 3. Markdown Processing Cache

**What's cached:**
- `.markdown-cache/` - Parsed markdown AST
- `.textlint-cache/` - Linting results

**Impact:** Speeds up content validation

## Build Strategy Decision Tree

```
┌─────────────────┐
│ Workflow Start  │
└────────┬────────┘
         │
         v
┌─────────────────┐     ┌──────────────────┐
│ NPM Cache Hit?  │────>│ Install from NPM │
└────────┬────────┘ No  └──────────────────┘
         │ Yes
         v
┌─────────────────┐     ┌──────────────────┐
│Build Cache Hit? │────>│   Full Build     │
└────────┬────────┘ No  └──────────────────┘
         │ Yes
         v
┌──────────────────────┐
│ Incremental Build    │
└──────────────────────┘
```

## Cache Optimization Tips

### 1. Cache Key Design

**Good:**
```yaml
key: ${{ runner.os }}-build-${{ hashFiles('src/**/*.md', 'config.json') }}
```

**Better:**
```yaml
key: ${{ runner.os }}-build-${{ hashFiles('src/**/*', 'book-config.json', 'scripts/build*.js') }}
restore-keys: |
  ${{ runner.os }}-build-
```

### 2. Cache Size Management

Keep caches lean by:
- Excluding source maps in production builds
- Cleaning temporary files before caching
- Setting appropriate retention periods

### 3. Cache Warming

For scheduled builds or after major updates:
```bash
# Trigger cache warming
git commit -m "[warm-cache] Preparing for release" --allow-empty
git push
```

## Performance Metrics

### Expected Time Savings

| Scenario | Without Cache | With Cache | Time Saved |
|----------|--------------|------------|------------|
| Clean build | ~120s | ~120s | 0% |
| Dependencies unchanged | ~120s | ~75s | 37.5% |
| No content changes | ~120s | ~45s | 62.5% |
| Minor content changes | ~120s | ~50s | 58.3% |

### Cache Hit Rates

Monitor cache effectiveness in workflow runs:
- NPM cache: Should hit 95%+ of the time
- Build cache: Hits on 60-80% of builds
- Combined effect: 50-80% faster builds

## Troubleshooting

### Cache Misses

Common causes:
1. **package-lock.json changes** - Even whitespace changes invalidate NPM cache
2. **Untracked file changes** - Ensure all relevant files are in cache key
3. **Cache eviction** - GitHub retains caches for 7 days of inactivity

### Debugging Cache Issues

Add to your workflow:
```yaml
- name: Debug cache
  run: |
    echo "Cache restored from key: ${{ steps.cache.outputs.cache-matched-key }}"
    echo "Cache primary key: ${{ steps.cache.outputs.cache-primary-key }}"
```

### Force Cache Refresh

When needed:
```yaml
# Option 1: Change cache version
key: v2-${{ runner.os }}-build-${{ hashFiles('**/*') }}

# Option 2: Clear via API
gh api -X DELETE /repos/:owner/:repo/actions/caches
```

## Best Practices

1. **Incremental by Default**: Always prefer incremental builds when cache hits
2. **Monitor Performance**: Use GitHub Actions summary for tracking
3. **Regular Cleanup**: Remove outdated cache entries monthly
4. **Document Changes**: Update this guide when modifying cache strategy

## Implementation Checklist

- [x] NPM dependencies caching
- [x] Build artifacts caching
- [x] Incremental build integration
- [x] Performance reporting
- [x] Cache warming strategy
- [ ] Cross-workflow cache sharing
- [ ] Cache compression optimization
- [ ] Distributed cache support