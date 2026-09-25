# AuraFlow Supabase

`migrations/0001_auraflow_core.sql` is the first AuraFlow migration for the
Supabase project. It establishes Supabase Auth profiles, role-based access,
projects, private collaboration, AFC, configurable business suites, and
private Storage buckets.

## Apply safely

1. In the intended Supabase project, enable Email and Google authentication.
2. Set the production site URL and allowed redirect URLs before enabling OAuth.
3. Take a Firebase export and record reconciliation counts. Do not delete or
   alter Firebase data during this step.
4. Review and run `migrations/0001_auraflow_core.sql` in the Supabase SQL
   Editor, or apply it with the Supabase CLI after linking this repository.
5. Assign the first owner through the SQL Editor only after their Supabase
   account exists:

   ```sql
   update public.user_roles
   set role = 'admin'
   where user_id = (
     select id from auth.users where email = 'elishaafari0@gmail.com'
   );
   ```

6. Configure private Storage access and test a client account, an admin
   account, and an unauthenticated browser before switching production traffic.

The service-role key belongs only in server-side environment variables. Never
put it in Vite variables, browser code, git, screenshots, or support chats.
