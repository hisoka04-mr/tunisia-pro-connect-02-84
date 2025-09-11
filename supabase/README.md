# Supabase RLS Setup Instructions

## How to Apply Row-Level Security Policies

To implement the RLS policies for the services table, follow these steps:

### 1. Access Supabase Dashboard
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to the **SQL Editor** from the left sidebar

### 2. Run the RLS Policies
1. Copy the entire content from `supabase/rls-policies.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute all the policies

### 3. What This Setup Does

**Security Policies Created:**
- ✅ **Service Providers** can insert new services (automatically linked to their account)
- ✅ **Service Providers** can update/delete only their own services  
- ✅ **Clients** can view all active services (read-only)
- ✅ **Admins** have full access to all services

**Automatic Features:**
- 🔄 When a service provider creates a service, their `service_provider_id` is automatically set
- 🛡️ Users can only access services according to their role permissions
- 🚫 Prevents unauthorized access to other users' services

### 4. Admin Configuration
The admin emails are configured in `src/utils/adminConfig.ts`:
- admin@sevigo.com
- admin@admin.com
- support@sevigo.com

To add more admin emails, update the `ADMIN_EMAILS` array in that file and re-run the SQL.

### 5. Testing the Policies
After running the SQL:
1. Test service creation as a service provider
2. Test service viewing as a client
3. Verify admin access works correctly
4. Confirm users cannot access others' services

### 6. Troubleshooting
If you encounter permission errors:
1. Ensure RLS is enabled on the services table
2. Check that the user has the correct role in your application
3. Verify the service_provider record exists for service providers
4. Check the Supabase logs for detailed error messages

## Database Schema Note
This setup works with your existing schema where:
- `auth.users` → `profiles` → `service_providers` → `services`
- Services are linked via `service_provider_id` (not directly to `user_id`)