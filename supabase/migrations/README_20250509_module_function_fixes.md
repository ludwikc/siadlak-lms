# Module Function Fixes - May 9, 2025

## Issue Fixed

These migration files address the error:
```
Failed to save module: column reference "is_admin" is ambiguous
```

This error occurred because the SQL functions for module operations (create, update, delete, reorder) were referencing the `is_admin` column without specifying which table it came from, or were using a variable with the same name as a column in the database.

## Changes Made

1. **Fixed variable naming**: Changed the variable name from `is_admin` to `admin_flag` in all module-related functions to avoid ambiguity with the column name.

2. **Updated admin check logic**: Ensured that the admin check logic is consistent across all functions and properly handles the admin flag from JWT metadata.

3. **Created separate migration files** for each function to make the changes easier to review and apply:
   - `20250509_fix_create_module_function.sql`
   - `20250509_fix_update_module_function.sql`
   - `20250509_fix_delete_module_function.sql`
   - `20250509_fix_reorder_modules_function.sql`

## How to Apply

These migrations should be applied to your Supabase project using one of the following methods:

### Option 1: Using Supabase CLI

```bash
supabase db push
```

### Option 2: Manual Application

If you prefer to apply these changes manually, you can:

1. Connect to your Supabase database using psql or another SQL client
2. Execute each SQL file in order:
   ```sql
   \i 20250509_fix_create_module_function.sql
   \i 20250509_fix_update_module_function.sql
   \i 20250509_fix_delete_module_function.sql
   \i 20250509_fix_reorder_modules_function.sql
   ```

## Verification

After applying these changes, you should be able to create, update, delete, and reorder modules without encountering the "column reference is ambiguous" error.
