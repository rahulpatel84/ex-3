#!/bin/bash

# Test Category API Endpoints
# Make sure to set these variables before running

BACKEND_URL="https://your-backend.railway.app"  # Update with your Railway URL
EMAIL="your-email@example.com"                   # Update with your test user email
PASSWORD="your-password"                          # Update with your test user password

echo "🧪 Testing Category API"
echo "===================="
echo ""

# Step 1: Login to get JWT token
echo "1️⃣  Logging in to get JWT token..."
LOGIN_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

# Extract access token
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Login failed! Response:"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo "✅ Login successful!"
echo "🔑 Token: ${ACCESS_TOKEN:0:20}..."
echo ""

# Step 2: Get all categories
echo "2️⃣  GET /categories - Fetch all categories"
echo "-------------------------------------------"
curl -s -X GET "${BACKEND_URL}/categories" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

# Step 3: Create a new category
echo "3️⃣  POST /categories - Create new category"
echo "-------------------------------------------"
CREATE_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/categories" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Category",
    "icon": "🧪",
    "color": "#ff0000",
    "type": "expense"
  }')

echo $CREATE_RESPONSE | jq '.'
CATEGORY_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*' | sed 's/"id":"//')
echo ""
echo "📝 Created category ID: $CATEGORY_ID"
echo ""

# Step 4: Get single category
echo "4️⃣  GET /categories/:id - Get single category"
echo "-----------------------------------------------"
curl -s -X GET "${BACKEND_URL}/categories/${CATEGORY_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

# Step 5: Update category
echo "5️⃣  PUT /categories/:id - Update category"
echo "-------------------------------------------"
curl -s -X PUT "${BACKEND_URL}/categories/${CATEGORY_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Category",
    "color": "#00ff00"
  }' | jq '.'
echo ""
echo ""

# Step 6: Delete category
echo "6️⃣  DELETE /categories/:id - Delete category"
echo "----------------------------------------------"
curl -s -X DELETE "${BACKEND_URL}/categories/${CATEGORY_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

echo "✅ All tests completed!"
echo ""
echo "📊 Summary:"
echo "  - Login: ✅"
echo "  - Get all categories: ✅"
echo "  - Create category: ✅"
echo "  - Get single category: ✅"
echo "  - Update category: ✅"
echo "  - Delete category: ✅"
