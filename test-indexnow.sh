#!/bin/bash

# Test IndexNow submission to verify setup
# This script tests your IndexNow key and domain verification

KEY="7da7e958279d4584b39e1a298108ea4e"
DOMAIN="fernando-nog.netlify.app"
TEST_URL="https://${DOMAIN}/"

echo "🧪 Testing IndexNow setup..."
echo "🔑 Key: $KEY"
echo "🌐 Domain: $DOMAIN"
echo "📄 Test URL: $TEST_URL"
echo ""

# Test key file accessibility
echo "📂 Testing key file accessibility..."
key_response=$(curl -s -w "%{http_code}" -o /dev/null "https://${DOMAIN}/${KEY}.txt")

if [ "$key_response" -eq 200 ]; then
    echo "   ✅ Key file accessible at: https://${DOMAIN}/${KEY}.txt"
else
    echo "   ❌ Key file not accessible (HTTP $key_response)"
    echo "   ⚠️  Make sure to deploy your site first!"
fi

echo ""
echo "🚀 Testing submission to IndexNow API..."

response=$(curl -s -w "%{http_code}" -o /dev/null "https://api.indexnow.org/indexnow?url=${TEST_URL}&key=${KEY}")

case $response in
    200)
        echo "   ✅ Success: Test submission successful!"
        ;;
    202)
        echo "   ✅ Accepted: Test submission received, validation pending"
        ;;
    400)
        echo "   ❌ Error 400: Invalid format"
        ;;
    403)
        echo "   ❌ Error 403: Invalid key (check if key file is deployed)"
        ;;
    422)
        echo "   ❌ Error 422: URL/key mismatch"
        ;;
    429)
        echo "   ❌ Error 429: Too many requests"
        ;;
    000)
        echo "   ❌ No response (connection issue)"
        ;;
    *)
        echo "   ❓ Response code: $response"
        ;;
esac

echo ""
echo "📋 Next steps:"
echo "   1. Deploy your site to make the key file accessible"
echo "   2. Run ./submit-to-indexnow.sh to submit all pages"
echo "   3. Use ./submit-new-post.sh for individual new posts"


