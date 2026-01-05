# 🏗️ Multi-User Architecture - Visual Guide

## Current vs. New Architecture

### BEFORE (Single User):
```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ owns
       ↓
┌─────────────┐      ┌──────────────┐
│ Categories  │      │   Expenses   │
└─────────────┘      └──────────────┘

Simple: Each user owns their own categories and expenses
```

### AFTER (Multi-User):
```
┌─────────────┐
│   User 1    │
└──────┬──────┘
       │ member of
       ↓
┌──────────────────┐     ┌─────────────┐
│   Household      │◄────┤   User 2    │
│   "Family"       │     └─────────────┘
└────────┬─────────┘           │ member of
         │ owns                │
         ↓                     ↓
    ┌─────────────┐      ┌──────────────┐
    │ Categories  │      │   Expenses   │
    └─────────────┘      └──────────────┘

Collaborative: Multiple users share one household's data
```

---

## Data Flow

### Adding an Expense:
```
User (Jane)
    ↓ adds expense
Household (Family)
    ↓ expense belongs to
Expense Table
    ↓ visible to
All Members (Jane, John, Kids)
```

### Viewing Dashboard:
```
User (John) logs in
    ↓
Selects "Family" household
    ↓
System checks: Is John member? ✓
    ↓
Fetch expenses WHERE household_id = "family"
    ↓
Dashboard shows all family expenses
    ↓
John sees expenses from Jane, himself, kids
```

---

## Permission System

### Visual Permission Matrix:

```
Action              │ Owner │ Admin │ Member │ Viewer
────────────────────┼───────┼───────┼────────┼────────
Invite users        │  ✅   │  ✅   │   ❌   │   ❌
Remove members      │  ✅   │  ❌   │   ❌   │   ❌
Add expense         │  ✅   │  ✅   │   ✅   │   ❌
Edit own expense    │  ✅   │  ✅   │   ✅   │   ❌
Edit others' expense│  ✅   │  ✅   │   ❌   │   ❌
Delete own expense  │  ✅   │  ✅   │   ✅   │   ❌
Delete others'      │  ✅   │  ✅   │   ❌   │   ❌
View expenses       │  ✅   │  ✅   │   ✅   │   ✅
View analytics      │  ✅   │  ✅   │   ✅   │   ✅
Manage categories   │  ✅   │  ✅   │   ❌   │   ❌
Delete household    │  ✅   │  ❌   │   ❌   │   ❌
```

---

## Example Scenario: Family Budget

### Setup:
```
┌─────────────────────────────────────┐
│     Household: "Our Family"         │
├─────────────────────────────────────┤
│ Members:                            │
│  • Dad (Owner) ──┐                  │
│  • Mom (Admin)   │                  │
│  • Teen (Member) │  Share same data │
│  • Kid (Viewer)  │                  │
└──────────────────┴──────────────────┘
        │
        ↓
┌─────────────────────────────────────┐
│         Shared Data:                │
│                                     │
│  Categories:                        │
│   • Groceries                       │
│   • Utilities                       │
│   • Entertainment                   │
│                                     │
│  Expenses:                          │
│   • $50 - Groceries (Mom)           │
│   • $100 - Electric (Dad)           │
│   • $20 - Movies (Teen)             │
│                                     │
│  Analytics: $170 total              │
└─────────────────────────────────────┘
```

### What Each Person Can Do:

**👑 Dad (Owner):**
```
✅ Add/edit/delete any expense
✅ Invite family members
✅ Remove members if needed
✅ Delete entire household
✅ Change member roles
✅ Full control
```

**🛡️ Mom (Admin):**
```
✅ Add/edit/delete any expense
✅ Invite new members
✅ Manage categories
✅ View all analytics
❌ Cannot remove Dad (owner)
❌ Cannot delete household
```

**👤 Teen (Member):**
```
✅ Add own expenses ($20 movie)
✅ Edit own expenses
✅ Delete own expenses
✅ View all family expenses
✅ View analytics
❌ Cannot edit Mom's or Dad's expenses
❌ Cannot invite people
```

**👁️ Kid (Viewer):**
```
✅ View all expenses
✅ View analytics
❌ Cannot add expenses
❌ Cannot edit anything
❌ Read-only access
```

---

## Invitation Flow

### Step-by-Step:

```
1. Dad clicks "Invite User"
        ↓
2. Enters Mom's email
   Selects role: Admin
        ↓
3. System creates invitation record
   Sends email to Mom
        ↓
4. Mom receives email
   Clicks "Accept Invitation"
        ↓
5. System checks:
   - Is token valid? ✓
   - Is token expired? ✓
   - Does user exist? ✓
        ↓
6. Creates HouseholdMember record
   Status: Active
   Role: Admin
        ↓
7. Mom logs in
   Sees "Our Family" household
   Can add expenses!
```

---

## Database Relationships

### Simplified View:

```
User
  ├── HouseholdMember (many)
  │     ├── Household
  │     └── Role (owner/admin/member/viewer)
  │
  └── Expenses (many)
        └── Household (which household it belongs to)

Household
  ├── HouseholdMembers (many)
  ├── Categories (many)
  └── Expenses (many)
```

### Real Example:

```
User: "John Doe"
  ├── Member of "Personal" (owner)
  ├── Member of "Family" (owner)
  └── Member of "Work" (admin)

Household: "Family"
  ├── John Doe (owner)
  ├── Jane Doe (admin)
  ├── Kid 1 (member)
  └── Kid 2 (viewer)
  │
  ├── Categories:
  │   ├── Groceries
  │   ├── Rent
  │   └── Utilities
  │
  └── Expenses:
      ├── $500 Rent (John)
      ├── $150 Groceries (Jane)
      └── $100 Electric (John)
```

---

## Security Model

### Query Pattern:

```sql
-- Before (single user):
SELECT * FROM expenses
WHERE user_id = 'current_user_id';

-- After (multi-user with permission check):
SELECT e.* FROM expenses e
JOIN households h ON e.household_id = h.id
JOIN household_members hm ON h.id = hm.household_id
WHERE hm.user_id = 'current_user_id'
  AND hm.status = 'active'
  AND e.household_id = 'selected_household_id';
```

### Permission Check Flow:

```
1. User tries to delete expense
        ↓
2. System checks:
   - Is user member of this household? ✓
   - Is household_id correct? ✓
   - Is expense in this household? ✓
        ↓
3. Check role permissions:
   - Is user Owner/Admin? ✓ → Allow
   - Is user Member + expense.userId = user.id? ✓ → Allow
   - Otherwise → Deny ❌
        ↓
4. If allowed: Delete expense
   If denied: Return 403 Forbidden
```

---

## State Management (Frontend)

### Context Structure:

```javascript
<AuthContext>
  └── user (current logged-in user)

<HouseholdContext>
  ├── currentHousehold (selected household)
  ├── userHouseholds (list of households user belongs to)
  ├── currentRole (user's role in current household)
  ├── permissions (what user can do)
  └── methods:
      ├── switchHousehold()
      ├── inviteUser()
      └── checkPermission()

<ExpenseContext>
  └── expenses (filtered by current household)
```

### Component Access:

```javascript
function Dashboard() {
  const { user } = useAuth();
  const { currentHousehold, permissions } = useHousehold();
  
  return (
    <div>
      <h1>{currentHousehold.name}</h1>
      
      {permissions.canAddExpense && (
        <button>Add Expense</button>
      )}
      
      {permissions.canInviteUsers && (
        <button>Invite User</button>
      )}
    </div>
  );
}
```

---

## Migration Strategy

### For Existing Users:

```
Before Migration:
User: John
  ├── 50 expenses
  └── 10 categories

Migration Script Runs:
  1. Create household "Personal" for John
  2. Add John as Owner
  3. Move 50 expenses to "Personal" household
  4. Move 10 categories to "Personal" household

After Migration:
User: John
  └── Member of "Personal" (owner)
        ├── 50 expenses
        └── 10 categories

✅ Nothing changes for John!
✅ Can now invite others
```

---

## Performance Considerations

### Optimizations:

1. **Indexes:**
```sql
CREATE INDEX idx_household_members ON household_members(user_id, household_id);
CREATE INDEX idx_expenses_household ON expenses(household_id);
```

2. **Caching:**
```javascript
// Cache user's households
Cache: user_123_households → [household1, household2]

// Cache permissions
Cache: user_123_household_456_permissions → { canAdd: true, ... }
```

3. **Query Optimization:**
```javascript
// Single query instead of multiple
SELECT e.*, c.*, u.*
FROM expenses e
JOIN categories c ON e.category_id = c.id
JOIN users u ON e.user_id = u.id
WHERE e.household_id = ?
```

---

## Summary

### Key Concepts:

1. **Household** = Shared workspace
2. **HouseholdMember** = User's role in household
3. **Roles** = Different permission levels
4. **Data Isolation** = Only see your households
5. **Permission Checks** = Enforce on every action

### Benefits:

✅ **Collaborate** - Share expenses with family/friends
✅ **Secure** - Role-based access control
✅ **Flexible** - Multiple households per user
✅ **Scalable** - Supports unlimited members
✅ **Auditable** - Track who did what

---

**Ready to implement this architecture?** 🏗️

