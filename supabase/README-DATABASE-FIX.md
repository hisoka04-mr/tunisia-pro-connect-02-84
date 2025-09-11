# Database Setup and Permission Fix

This document contains the complete solution to fix all database structure, RLS policies, and permission issues in the application.

## Issues Identified and Fixed

1. **Permission Denied Errors**: Users couldn't access `service_providers` and `services` tables
2. **Missing RLS Policies**: Tables lacked proper Row Level Security policies
3. **Role Detection Problems**: App couldn't properly determine user roles
4. **Table Structure Issues**: Missing proper relationships and columns
5. **Service Creation Failures**: Service providers couldn't post new services

## Quick Fix (Apply This First)

Run the SQL from `supabase/fix-rls-quick.sql` in your Supabase SQL Editor first to immediately resolve permission issues:

```sql
-- This file contains permissive RLS policies that will get the app working immediately
```

## Complete Database Setup (Recommended)

For a complete solution, run the SQL from `supabase/database-setup.sql` in your Supabase SQL Editor:

```sql
-- This file contains complete table structure and comprehensive RLS policies
```

## Application Code Changes Made

### 1. Updated Service Operations (`src/utils/serviceOperations.ts`)
- Fixed `createService` function to properly handle service provider records
- Added `ensureServiceProvider` function to create service provider records when needed
- Updated to work with proper database relationships

### 2. Enhanced User Role Detection (`src/hooks/useUserRole.tsx`)
- Added fallback logic when service_providers table access fails
- Uses user metadata as backup for role determination
- Graceful error handling for permission issues

### 3. Fixed PostServiceForm (`src/components/PostServiceForm.tsx`)
- Updated to use new `createService` function
- Proper error handling and user feedback
- Ensures service provider record exists before service creation

## Database Schema Overview

After running the setup SQL, your database will have:

### Tables Created/Updated:
- `profiles` - Extended user profiles
- `job_categories` - Service categories
- `service_providers` - Service provider records
- `services` - Service listings with proper relationships
- `bookings` - Booking management
- `reviews` - Review system

### Functions Created:
- `is_admin()` - Checks if user is admin
- `get_user_role()` - Returns user role (admin/service_provider/client)
- `set_service_user_fields()` - Automatically sets user fields on service creation

### RLS Policies:
- **Admins** - Full access to all tables
- **Service Providers** - Can manage their own services and profile
- **Clients** - Can view services and manage their bookings
- **Public** - Can read active services and job categories

## Testing the Fix

After applying the SQL changes:

1. **Test Service Provider Login**: 
   - User should be able to access their profile
   - Can view the "Post Service" form
   - Can successfully create services

2. **Test Client Access**:
   - Can browse all active services
   - Can view service provider profiles
   - Can make bookings (if booking system is implemented)

3. **Test Admin Access**:
   - Full access to all data
   - Can manage users and services

## Troubleshooting

If you still see permission errors after applying the fix:

1. **Check RLS is enabled**: Run in SQL Editor:
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. **Verify policies exist**: Run in SQL Editor:
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

3. **Check user permissions**: Run in SQL Editor:
   ```sql
   SELECT has_table_privilege('authenticated', 'service_providers', 'SELECT');
   SELECT has_table_privilege('authenticated', 'services', 'SELECT');
   ```

## Security Features

The implemented RLS policies ensure:
- Users can only access their own data
- Service providers can't see other providers' private information
- Clients can only view active, approved services
- Admins have oversight capabilities
- All sensitive operations are logged and auditable

## Next Steps

1. Apply the SQL fixes in order (quick fix first, then complete setup)
2. Test user registration and login flows
3. Verify service creation and management
4. Test role-based access control
5. Monitor application logs for any remaining issues

The application should now work correctly with proper permission management and database relationships.