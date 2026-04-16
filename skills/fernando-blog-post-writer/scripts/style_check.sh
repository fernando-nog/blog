#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: style_check.sh <markdown-file>"
  exit 1
fi

file="$1"
if [[ ! -f "$file" ]]; then
  echo "Error: file not found: $file"
  exit 1
fi

has_title=$(rg -n '^title:\s*".+"$' "$file" >/dev/null && echo yes || echo no)
has_date=$(rg -n '^date:\s*"[0-9]{4}-[0-9]{2}-[0-9]{2}"$' "$file" >/dev/null && echo yes || echo no)
has_description=$(rg -n '^description:\s*".+"$' "$file" >/dev/null && echo yes || echo no)
has_tags=$(rg -n '^tags:\s*\[.*\]$' "$file" >/dev/null && echo yes || echo no)

h1_count=$(awk '
BEGIN{fm=0;fence=0;h1=0}
/^---$/ {if(fm==0){fm=1;next}else if(fm==1){fm=2;next}}
fm<2{next}
/^```/{fence=!fence;next}
fence{next}
/^# /{h1++}
END{print h1}
' "$file")

h2_count=$(awk '
BEGIN{fm=0;fence=0;h2=0}
/^---$/ {if(fm==0){fm=1;next}else if(fm==1){fm=2;next}}
fm<2{next}
/^```/{fence=!fence;next}
fence{next}
/^## /{h2++}
END{print h2}
' "$file")

has_conclusion=$(rg -n '^## (Conclusion|Final Thoughts|The Bottom Line|Conclusion:)' "$file" >/dev/null && echo yes || echo no)
has_references=$(rg -n '^## (References|Official References and Resources)$' "$file" >/dev/null && echo yes || echo no)
has_hook=$(awk '
BEGIN{fm=0;fence=0}
/^---$/ {if(fm==0){fm=1;next}else if(fm==1){fm=2;next}}
fm<2{next}
/^```/{fence=!fence;next}
fence{next}
{if($0 !~ /^[[:space:]]*$/){print; exit}}
' "$file" | rg -qi '^(Picture this:|If you\x27ve|\*\*TL;DR:\*\*|## Summary)' && echo yes || echo no)

echo "File: $file"
echo "frontmatter.title: $has_title"
echo "frontmatter.date: $has_date"
echo "frontmatter.description: $has_description"
echo "frontmatter.tags: $has_tags (recommended)"
echo "body.h1_count: $h1_count (preferred: 0)"
echo "body.h2_count: $h2_count (typical: 8-16)"
echo "has_hook_paragraph: $has_hook"
echo "has_conclusion_section: $has_conclusion"
echo "has_references_section: $has_references"

status=0
[[ "$has_title" == "yes" ]] || status=1
[[ "$has_date" == "yes" ]] || status=1
[[ "$has_description" == "yes" ]] || status=1
[[ "$has_conclusion" == "yes" ]] || status=1
[[ "$has_references" == "yes" ]] || status=1
[[ "$h1_count" -eq 0 ]] || status=1

if [[ $status -eq 0 ]]; then
  echo "RESULT: PASS (matches core repository style checks)"
else
  echo "RESULT: FAIL (does not match core repository style checks)"
fi

exit $status
