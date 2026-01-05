# 🗑️ Audit Trail - Quick Guide

## What Changed?

Transactions are **never permanently deleted** anymore. They're kept in the database with full history.

---

## Where to See Deleted Transactions

**Dashboard → History Tab**

Two sections now:
1. **Active Transactions** - Current items
2. **Deleted Transactions** - Deleted items with full history

---

## What Information is Shown

### For Every Transaction:
```
✅ When added: "Jan 5, 2026 2:30 PM"
✅ Who added: "by John Doe"
```

### For Deleted Transactions:
```
✅ When added: "Jan 5, 2026 2:30 PM"
✅ Who added: "by John Doe"
🗑️ When deleted: "Jan 5, 2026 5:45 PM"
```

---

## How It Works

### Before (Old Way):
```
Delete button → Permanently erased → Gone forever
```

### Now (New Way):
```
Delete button → Marked as deleted → Kept in database
↓
Shows in "Deleted Transactions" section
↓
Full history preserved
```

---

## Visual Appearance

### Active Transaction:
- White background
- Normal appearance
- Delete button available

### Deleted Transaction:
- Red border
- Faded/transparent appearance
- "Deleted" badge
- Shows deletion timestamp
- Read-only (no delete button)

---

## Technical Details

### Database:
Added two new columns to `expenses` table:
- `deleted_at` - Timestamp when deleted
- `deleted_by` - User ID who deleted it

### Migration File:
`backend/prisma/migrations/20260106000000_add_soft_delete_to_expenses/migration.sql`

---

## Deploy

```bash
git add .
git commit -m "Add audit trail for deleted transactions"
git push
```

Railway will automatically run the database migration! 🚀

---

## Benefits

✅ **Never lose data**
✅ **Complete audit trail**
✅ **Compliance-ready**
✅ **Can restore if needed**
✅ **Know who deleted what and when**

---

**Your transactions now have full audit history!** 🎉

