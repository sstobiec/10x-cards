#!/bin/bash
# Test script for flashcard generation endpoint
# Make sure the dev server is running (npm run dev) before executing this script

API_URL="http://localhost:4321/api/flashcards/generate"

echo "🧪 Testing Flashcard Generation Endpoint"
echo "=========================================="
echo ""

# Test 1: Simple programming concept
echo "📝 Test 1: REST API Concept"
echo "---"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "REST is an architectural style for designing networked applications. It uses HTTP methods like GET, POST, PUT, and DELETE to perform operations on resources. REST APIs are stateless, meaning each request contains all the information needed to process it."
  }' \
  -w "\n\nStatus Code: %{http_code}\n" \
  -s | jq .

echo ""
echo "---"
echo ""

# Test 2: JavaScript concept
echo "📝 Test 2: JavaScript Concept"
echo "---"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "JavaScript is a high-level, interpreted programming language. It is a core technology of the World Wide Web. JavaScript enables interactive web pages and is an essential part of web applications. TypeScript is a superset of JavaScript that adds static typing."
  }' \
  -w "\n\nStatus Code: %{http_code}\n" \
  -s | jq .

echo ""
echo "---"
echo ""

# Test 3: Validation error (empty text)
echo "📝 Test 3: Validation Error (empty text)"
echo "---"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "text": ""
  }' \
  -w "\n\nStatus Code: %{http_code}\n" \
  -s | jq .

echo ""
echo "---"
echo ""

# Test 4: Invalid JSON
echo "📝 Test 4: Invalid JSON"
echo "---"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d 'invalid json' \
  -w "\n\nStatus Code: %{http_code}\n" \
  -s | jq .

echo ""
echo "=========================================="
echo "✅ Tests completed!"
echo ""
echo "💡 Tip: Use 'jq' for prettier JSON output"
echo "    Install with: brew install jq (macOS)"

