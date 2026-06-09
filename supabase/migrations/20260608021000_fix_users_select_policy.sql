-- Allow all authenticated users to read user profiles (needed for feed author names)
DROP POLICY IF EXISTS "Users read own profile" ON users;
CREATE POLICY "Users read own profile" ON users
  FOR SELECT USING (auth.uid() IS NOT NULL);
