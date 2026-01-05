# 👥 Multi-User Collaboration System - Complete Plan

## 🎯 Goal
Allow users to invite partners/family members to share expense management with role-based permissions.

---

## 📊 Architecture Overview

### Concept: **Households (Workspaces)**
- Each user starts with a **Personal Household**
- Users can create **Shared Households** (Family, Business, etc.)
- Invite others to join households
- Switch between households
- Role-based permissions

---

## 🗄️ Database Schema Changes

### New Tables:

#### 1. **Household** (Workspace for shared expenses)
```prisma
model Household {
  id          String   @id @default(uuid())
  name        String   // "My Family", "Business", "Roommates"
  description String?
  createdBy   String   // Owner user ID
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  members     HouseholdMember[]
  categories  Category[]
  expenses    Expense[]
}
```

#### 2. **HouseholdMember** (User-Household relationship with roles)
```prisma
model HouseholdMember {
  id           String   @id @default(uuid())
  householdId  String
  userId       String
  role         String   // "owner", "admin", "member", "viewer"
  invitedBy    String?  // Who invited them
  invitedAt    DateTime @default(now())
  acceptedAt   DateTime?
  status       String   @default("pending") // "pending", "active", "declined"
  
  household    Household @relation(fields: [householdId])
  user         User      @relation(fields: [userId])
}
```

#### 3. **Invitation** (Email invitations for non-users)
```prisma
model Invitation {
  id           String    @id @default(uuid())
  householdId  String
  email        String
  role         String    @default("member")
  invitedBy    String    // User ID
  token        String    @unique
  expiresAt    DateTime
  acceptedAt   DateTime?
  createdAt    DateTime  @default(now())
}
```

### Updated Tables:

#### **Category** - Add householdId
```prisma
model Category {
  // ... existing fields
  householdId  String   // Belongs to household
  household    Household @relation(fields: [householdId])
}
```

#### **Expense** - Add householdId
```prisma
model Expense {
  // ... existing fields
  householdId  String   // Belongs to household
  household    Household @relation(fields: [householdId])
}
```

---

## 🎭 Role-Based Permissions

### Roles & Capabilities:

#### 1. **Owner** (Creator)
- ✅ Full access
- ✅ Add/remove members
- ✅ Change member roles
- ✅ Delete household
- ✅ All admin permissions

#### 2. **Admin**
- ✅ Add/edit/delete expenses
- ✅ Add/edit/delete categories
- ✅ Invite new members
- ✅ View analytics
- ❌ Cannot remove owner
- ❌ Cannot delete household

#### 3. **Member**
- ✅ Add/edit own expenses
- ✅ Delete own expenses
- ✅ View all expenses
- ✅ View analytics
- ❌ Cannot manage users
- ❌ Cannot edit others' expenses

#### 4. **Viewer** (Read-only)
- ✅ View expenses
- ✅ View analytics
- ❌ Cannot add/edit/delete
- ❌ Cannot manage users

---

## 🎨 UI/UX Design

### 1. **Sidebar Updates**
```
┌─────────────────────────┐
│ 🏠 Personal             │ ← Current household
│    ↓ Switch             │
├─────────────────────────┤
│ 📊 Dashboard            │
│ 👥 Users                │ ← NEW
│ ⚙️  Settings            │
├─────────────────────────┤
│ 💼 My Households        │ ← NEW
│    • Personal           │
│    • Family             │
│    • + Create New       │
└─────────────────────────┘
```

### 2. **User Management Page**
```
Users
─────────────────────────────────────
[+ Invite User]

Current Members:
┌─────────────────────────────────┐
│ 👤 John Doe (You)        Owner  │
│ 👤 Jane Smith           Admin   │ [Change Role ▼] [Remove]
│ 👤 Bob Johnson          Member  │ [Change Role ▼] [Remove]
└─────────────────────────────────┘

Pending Invitations:
┌─────────────────────────────────┐
│ 📧 alice@example.com    Member  │ [Resend] [Cancel]
└─────────────────────────────────┘
```

### 3. **Household Switcher**
```
┌─────────────────────────────────┐
│ Current Household:              │
│ 🏠 Family                   ▼   │
├─────────────────────────────────┤
│ • Personal                      │
│ • Family                 ✓      │
│ • Business                      │
├─────────────────────────────────┤
│ + Create New Household          │
└─────────────────────────────────┘
```

### 4. **Invite User Modal**
```
┌─────────────────────────────────┐
│ Invite User to Family           │
├─────────────────────────────────┤
│ Email: [____________]           │
│ Role:  [Member     ▼]           │
│                                 │
│ Permissions Preview:            │
│ ✅ Add/edit own expenses        │
│ ✅ View all expenses            │
│ ❌ Manage users                 │
│                                 │
│ [Cancel]  [Send Invitation]     │
└─────────────────────────────────┘
```

---

## 🚀 Implementation Phases

### **Phase 1: Core Multi-User (Week 1)**
1. ✅ Create database schema (Household, HouseholdMember)
2. ✅ Migrate existing data (create personal household for each user)
3. ✅ Update Category & Expense to use householdId
4. ✅ Household context/switcher
5. ✅ Basic user management page

### **Phase 2: Invitations (Week 2)**
1. ✅ Email invitation system
2. ✅ Accept/decline invitations
3. ✅ Invite existing users
4. ✅ Invite new users (signup flow)

### **Phase 3: Permissions (Week 3)**
1. ✅ Role-based access control
2. ✅ Permission checks on all endpoints
3. ✅ UI adapts based on role
4. ✅ Activity log (who did what)

### **Phase 4: Advanced Features (Week 4+)**
1. ✅ Multiple households
2. ✅ Household settings
3. ✅ Budget limits per household
4. ✅ Split expenses
5. ✅ Notifications

---

## 🎁 Extra Features (Future-Proof)

### 1. **Budget Management**
- Set monthly budget per category
- Alert when approaching limit
- Budget vs. actual comparison

### 2. **Expense Splitting**
- Split expenses between members
- Track who owes whom
- Settlement suggestions

### 3. **Recurring Expenses**
- Auto-create monthly expenses
- Rent, subscriptions, etc.
- Reminders

### 4. **Reports & Exports**
- Monthly/yearly reports
- Export to CSV/PDF
- Tax reports

### 5. **Notifications**
- Email notifications
- Push notifications
- Expense reminders

### 6. **Tags & Labels**
- Custom tags for expenses
- Filter by tags
- Advanced search

### 7. **Attachments**
- Upload receipts
- Image attachments
- File storage

### 8. **Mobile App**
- React Native app
- Share same backend
- Push notifications

---

## 📊 API Endpoints

### Households
```
POST   /households              - Create household
GET    /households              - List my households
GET    /households/:id          - Get household details
PUT    /households/:id          - Update household
DELETE /households/:id          - Delete household
POST   /households/:id/switch   - Switch active household
```

### Members
```
GET    /households/:id/members           - List members
POST   /households/:id/members/invite    - Invite user
PUT    /households/:id/members/:userId   - Update role
DELETE /households/:id/members/:userId   - Remove member
GET    /households/:id/invitations       - List pending invitations
POST   /invitations/:token/accept        - Accept invitation
POST   /invitations/:token/decline       - Decline invitation
```

### Permissions
```
GET    /households/:id/permissions       - Get my permissions
```

---

## 🔒 Security Considerations

### 1. **Access Control**
- Always check householdId in queries
- Verify user has permission for action
- Prevent data leakage between households

### 2. **Invitation Security**
- Time-limited tokens (7 days)
- One-time use tokens
- Email verification

### 3. **Data Isolation**
- Users only see data from their households
- Categories scoped to household
- Expenses scoped to household

---

## 📱 User Experience Flow

### New User Journey:
```
1. Sign up
   ↓
2. Welcome screen
   ↓
3. Create first household (auto: "Personal")
   ↓
4. Add categories
   ↓
5. Add first expense
   ↓
6. (Optional) Invite partner
```

### Existing User Adding Partner:
```
1. Go to Users page
   ↓
2. Click "Invite User"
   ↓
3. Enter email + role
   ↓
4. Send invitation
   ↓
5. Partner receives email
   ↓
6. Partner accepts (or signs up first)
   ↓
7. Partner joins household
   ↓
8. Both see shared dashboard
```

---

## 🎯 Success Metrics

### Technical:
- ✅ Zero data leakage between households
- ✅ Sub-100ms query performance
- ✅ Proper role enforcement

### User:
- ✅ < 2 minutes to invite partner
- ✅ Clear permission indicators
- ✅ Intuitive household switching

---

## 🏗️ Migration Strategy

### For Existing Users:
```sql
-- 1. Create personal household for each user
INSERT INTO households (id, name, created_by)
SELECT uuid(), 'Personal', id FROM users;

-- 2. Add user as owner to their household
INSERT INTO household_members (household_id, user_id, role, status)
SELECT h.id, u.id, 'owner', 'active'
FROM users u
JOIN households h ON h.created_by = u.id;

-- 3. Update categories to belong to household
UPDATE categories c
SET household_id = (
  SELECT h.id FROM households h WHERE h.created_by = c.user_id
);

-- 4. Update expenses to belong to household
UPDATE expenses e
SET household_id = (
  SELECT h.id FROM households h WHERE h.created_by = e.user_id
);
```

---

## 🎨 Design Principles

1. **Progressive Disclosure**
   - Simple by default
   - Advanced features discoverable
   - Don't overwhelm new users

2. **Clear Permissions**
   - Show what user can/cannot do
   - Disable actions if no permission
   - Clear error messages

3. **Collaboration First**
   - Easy to invite
   - Clear who did what
   - Team transparency

4. **Future-Proof**
   - Extensible architecture
   - Easy to add features
   - Scalable design

---

## 📚 Tech Stack

### Backend:
- ✅ NestJS (existing)
- ✅ Prisma ORM (existing)
- ✅ PostgreSQL (existing)
- 🆕 Guards for permissions

### Frontend:
- ✅ React (existing)
- ✅ Context API (existing)
- 🆕 Household context
- 🆕 Permission hooks

---

## ⏱️ Time Estimates

### Phase 1 (Core): **2-3 days**
- Database schema & migration
- Basic household management
- User list page

### Phase 2 (Invitations): **2 days**
- Invitation system
- Email notifications
- Accept/decline flow

### Phase 3 (Permissions): **2 days**
- Role-based access
- Permission checks
- UI updates

### Phase 4 (Polish): **1-2 days**
- Activity log
- UI refinements
- Testing

**Total: 7-9 days for full implementation**

---

## 🎉 End Result

Users will be able to:
1. ✅ Create multiple households (Family, Business, etc.)
2. ✅ Invite partners/family by email
3. ✅ Assign roles (Owner, Admin, Member, Viewer)
4. ✅ Switch between households
5. ✅ See who added each expense
6. ✅ Manage permissions
7. ✅ Future-ready for advanced features

---

**Ready to implement? Let's start with Phase 1!** 🚀

