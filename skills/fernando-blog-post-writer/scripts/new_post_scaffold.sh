#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  new_post_scaffold.sh \
    --slug <kebab-case-slug> \
    --title <title> \
    --description <description> \
    [--date YYYY-MM-DD] \
    [--tags tag1,tag2,tag3] \
    [--type tutorial|comparison|troubleshooting|concept] \
    [--output-dir path] \
    [--force]
USAGE
}

slug=""
title=""
description=""
date_value="$(date +%F)"
tags_csv=""
post_type="tutorial"
output_dir="content/blog"
force=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --slug) slug="${2:-}"; shift 2 ;;
    --title) title="${2:-}"; shift 2 ;;
    --description) description="${2:-}"; shift 2 ;;
    --date) date_value="${2:-}"; shift 2 ;;
    --tags) tags_csv="${2:-}"; shift 2 ;;
    --type) post_type="${2:-}"; shift 2 ;;
    --output-dir) output_dir="${2:-}"; shift 2 ;;
    --force) force=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1"; usage; exit 1 ;;
  esac
done

if [[ -z "$slug" || -z "$title" || -z "$description" ]]; then
  echo "Error: --slug, --title, and --description are required."
  usage
  exit 1
fi

if ! [[ "$slug" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Error: --slug must be kebab-case (letters, digits, hyphens)."
  exit 1
fi

if ! [[ "$date_value" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  echo "Error: --date must be YYYY-MM-DD."
  exit 1
fi

case "$post_type" in
  tutorial|comparison|troubleshooting|concept) ;;
  *)
    echo "Error: --type must be one of tutorial|comparison|troubleshooting|concept"
    exit 1
    ;;
esac

mkdir -p "$output_dir"
out_file="$output_dir/$slug.md"

if [[ -f "$out_file" && "$force" != true ]]; then
  echo "Error: file already exists: $out_file (use --force to overwrite)"
  exit 1
fi

tags_line=""
if [[ -n "$tags_csv" ]]; then
  IFS=',' read -r -a raw_tags <<< "$tags_csv"
  cleaned=()
  for t in "${raw_tags[@]}"; do
    tt="$(echo "$t" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
    [[ -n "$tt" ]] && cleaned+=("\"$tt\"")
  done
  if [[ ${#cleaned[@]} -gt 0 ]]; then
    joined="$(IFS=', '; echo "${cleaned[*]}")"
    tags_line="tags: [${joined}]"
  fi
fi

cat > "$out_file" <<EOF2
---
title: "$title"
date: "$date_value"
description: "$description"
${tags_line}
---

Picture this: [describe a realistic developer scenario and pain point in 2-4 sentences].

EOF2

append_tutorial() {
  cat >> "$out_file" <<'EOF2'
## Why This Matters

[Explain impact, tradeoffs, and when to apply this approach.]

## Prerequisites

- [Tool/version]
- [Environment requirements]

## Step-by-Step Setup

```bash
# Add setup commands
```

## Implementation Walkthrough

```bash
# Add implementation commands or code snippets
```

## Common Pitfalls

- [Pitfall 1]
- [Pitfall 2]

## Best Practices

- [Recommendation 1]
- [Recommendation 2]

## Conclusion

[Summarize key recommendation and next step.]

## References

- [Official docs](https://example.com)
EOF2
}

append_comparison() {
  cat >> "$out_file" <<'EOF2'
## Understanding the Options

[Define each option and scope of comparison.]

## Quick Comparison Overview

| Dimension | Option A | Option B |
|---|---|---|
| Learning curve | | |
| Performance | | |
| Ecosystem | | |

## Deep-Dive by Dimension

### Performance
[Compare with concrete criteria.]

### Developer Experience
[Compare with practical implications.]

## Real-World Scenarios

- [Scenario 1 -> recommended choice]
- [Scenario 2 -> recommended choice]

## Which One Should You Choose?

[Give decision framework based on constraints.]

## Conclusion

[Give final recommendation with caveats.]

## References

- [Official docs](https://example.com)
EOF2
}

append_troubleshooting() {
  cat >> "$out_file" <<'EOF2'
## What Is Happening

[Describe symptoms and root cause context.]

## Fast Diagnosis

```bash
# Add quick verification commands
```

## Step-by-Step Fix

```bash
# Add remediation commands
```

## Verify the Fix

```bash
# Add validation checks
```

## Prevent Recurrence

- [Preventive action 1]
- [Preventive action 2]

## Conclusion

[Summarize fix and prevention strategy.]

## References

- [Official docs](https://example.com)
EOF2
}

append_concept() {
  cat >> "$out_file" <<'EOF2'
## What Is [Topic]?

[Define clearly in practical terms.]

## Why It Matters

[Explain business and engineering impact.]

## How It Works

[Explain architecture or mechanics with examples.]

## Practical Use Cases

- [Use case 1]
- [Use case 2]

## Best Practices

- [Practice 1]
- [Practice 2]

## Conclusion

[Summarize and recommend next steps.]

## References

- [Official docs](https://example.com)
EOF2
}

case "$post_type" in
  tutorial) append_tutorial ;;
  comparison) append_comparison ;;
  troubleshooting) append_troubleshooting ;;
  concept) append_concept ;;
esac

echo "Created: $out_file"
