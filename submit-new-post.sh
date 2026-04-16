#!/bin/bash

# Submit a single new blog post to multiple IndexNow search engines
# Usage: ./submit-new-post.sh "https://fernando-nog.netlify.app/understanding-model-context-protocol-mcp/"

if [ $# -eq 0 ]; then
    echo "❌ Error: Please provide a URL to submit"
    echo "Usage: $0 <URL>"
    echo "Example: $0 https://fernando-nog.netlify.app/my-new-post/"
    exit 1
fi

URL="$1"
KEY="7da7e958279d4584b39e1a298108ea4e"

# IndexNow participating search engines
declare -a ENGINES=(
  "https://api.indexnow.org/indexnow"
  "https://www.bing.com/indexnow" 
  "https://searchadvisor.naver.com/indexnow"
  "https://search.seznam.cz/indexnow"
  "https://yandex.com/indexnow"
  "https://indexnow.yep.com/indexnow"
)

echo "🚀 Submitting URL to multiple search engines: $URL"
echo ""

for engine in "${ENGINES[@]}"; do
  engine_name=$(echo $engine | sed 's/https:\/\///' | sed 's/\/indexnow.*//' | sed 's/api\.//' | sed 's/www\.//' | sed 's/searchadvisor\.//' | sed 's/search\.//' | sed 's/indexnow\.//')
  
  echo "📡 Submitting to: $engine_name"
  
  # Submit using GET method with query parameters
  response=$(curl -s -w "%{http_code}" -o /dev/null "${engine}?url=${URL}&key=${KEY}")
  
  case $response in
    200)
      echo "   ✅ Success: URL submitted successfully"
      ;;
    202)
      echo "   ✅ Accepted: URL received, validation pending"
      ;;
    400)
      echo "   ❌ Error 400: Invalid format"
      ;;
    403)
      echo "   ❌ Error 403: Invalid key"
      ;;
    422)
      echo "   ❌ Error 422: URL doesn't belong to host or key mismatch"
      ;;
    429)
      echo "   ❌ Error 429: Too many requests (potential spam)"
      ;;
    000)
      echo "   ⚠️  No response (connection issue or unsupported endpoint)"
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
echo "📋 Note: IndexNow automatically shares submissions across participating engines."