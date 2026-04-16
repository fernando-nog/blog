#!/bin/bash

# IndexNow submission script for Fernando's blog
# This script submits all your site's URLs to multiple search engines via IndexNow

KEY="7da7e958279d4584b39e1a298108ea4e"
URLS='[
  "https://fernando-nog.netlify.app/",
  "https://fernando-nog.netlify.app/blog/",
  "https://fernando-nog.netlify.app/hello-world-my-first-blog-post/"
]'

# IndexNow participating search engines
declare -a ENGINES=(
  "https://api.indexnow.org/indexnow"
  "https://www.bing.com/indexnow" 
  "https://searchadvisor.naver.com/indexnow"
  "https://search.seznam.cz/indexnow"
  "https://yandex.com/indexnow"
  "https://indexnow.yep.com/indexnow"
)

echo "🚀 Submitting site to multiple search engines via IndexNow..."
echo ""

for engine in "${ENGINES[@]}"; do
  engine_name=$(echo $engine | sed 's/https:\/\///' | sed 's/\/indexnow.*//' | sed 's/api\.//' | sed 's/www\.//' | sed 's/searchadvisor\.//' | sed 's/search\.//' | sed 's/indexnow\.//')
  
  echo "📡 Submitting to: $engine_name"
  
  response=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$engine" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d "{
      \"host\": \"fernando-nog.netlify.app\",
      \"key\": \"$KEY\",
      \"urlList\": $URLS
    }")
  
  case $response in
    200)
      echo "   ✅ Success: URLs submitted successfully"
      ;;
    202)
      echo "   ✅ Accepted: URLs received, validation pending"
      ;;
    400)
      echo "   ❌ Error 400: Invalid format"
      ;;
    403)
      echo "   ❌ Error 403: Invalid key"
      ;;
    422)
      echo "   ❌ Error 422: URL/key mismatch"
      ;;
    429)
      echo "   ❌ Error 429: Too many requests"
      ;;
    000)
      echo "   ⚠️  No response (engine may not support bulk submission)"
      ;;
    *)
      echo "   ❓ Response code: $response"
      ;;
  esac
  
  # Small delay between submissions
  sleep 1
done

echo ""
echo "🎯 Submission complete! All participating search engines have been notified."
echo "📋 Note: Some engines may not respond or support bulk submissions."