# Category API Testing Guide

## Prerequisites
- Backend deployed on Railway: `https://expense-v1-production.up.railway.app`
- A registered user account (use the signup endpoint if you don't have one)

## Step 1: Get Authentication Token

```bash
# Login to get JWT token
curl -X POST https://expense-v1-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

**Copy the `accessToken` from the response - you'll need it for all other requests!**

---

## Step 2: Test GET All Categories

```bash
curl -X GET https://expense-v1-production.up.railway.app/categories \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Food & Dining",
      "icon": "🍔",
      "color": "#ff6b6b",
      "type": "expense",
      "isDefault": true
    },
    ...
  ]
}
```

---

## Step 3: Test POST Create Category

```bash
curl -X POST https://expense-v1-production.up.railway.app/categories \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coffee Shops",
    "icon": "☕",
    "color": "#8B4513",
    "type": "expense"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "new-uuid",
    "name": "Coffee Shops",
    "icon": "☕",
    "color": "#8B4513",
    "type": "expense",
    "isDefault": false
  }
}
```

**Save the `id` from the response for the next steps!**

---

## Step 4: Test GET Single Category

```bash
curl -X GET https://expense-v1-production.up.railway.app/categories/CATEGORY_ID_HERE \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

---

## Step 5: Test PUT Update Category

```bash
curl -X PUT https://expense-v1-production.up.railway.app/categories/CATEGORY_ID_HERE \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Coffee Shops",
    "color": "#6F4E37"
  }'
```

---

## Step 6: Test DELETE Category

```bash
curl -X DELETE https://expense-v1-production.up.railway.app/categories/CATEGORY_ID_HERE \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

---

## Common Errors & Solutions

### 401 Unauthorized
- Token expired or invalid
- Solution: Get a new token using Step 1

### 403 Forbidden
- Trying to access/modify another user's category
- Solution: Make sure you're using the correct category ID

### 409 Conflict
- Category name already exists for this user
- Solution: Use a different category name

### 400 Bad Request (Cannot delete)
- Category has expenses associated with it
- Solution: Delete or reassign expenses first, or use a different category

---

## Quick Test Checklist

- [ ] Login and get access token
- [ ] Get all categories (should see seeded categories)
- [ ] Create a new category
- [ ] Get single category by ID
- [ ] Update the category
- [ ] Delete the category
- [ ] Verify it's deleted (GET all categories again)
