# 🔐 Railway Session Fix - PostgreSQL Session Store

## ✅ Solution Implemented

The session persistence issue has been fixed by implementing PostgreSQL session store using `connect-pg-simple` with Supabase.

## 🎯 What Was Fixed

### Problem:
- Express-session was using **MemoryStore** (in-memory storage)
- Sessions were lost on server restart
- Cookie session ID couldn't be resolved after restart
- Auth status check always returned `false`

### Solution:
- **PostgreSQL session store** using `connect-pg-simple`
- Sessions stored in Supabase PostgreSQL database
- Sessions persist across server restarts
- Automatic table creation (`session` table)
- Automatic cleanup of expired sessions

## 📋 Setup Instructions

### Step 1: Get Supabase PostgreSQL Connection String

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll down to **Connection string**
5. Select **URI** tab
6. Copy the connection string

**Format:**
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

**OR use the Transaction Pooler (recommended for Railway):**
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Step 2: Add Environment Variables in Railway

1. Go to **Railway Dashboard** → Your Project → Your Service
2. Click **"Variables"** tab
3. Add/Update these variables:

#### Required Variables:

**`DATABASE_URL`**
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```
- Value: Your Supabase PostgreSQL connection string (from Step 1)
- **Important**: Use the **Transaction Pooler** connection string for better performance

**`USE_DATABASE`**
```
true
```
- Value: `true` (must be exactly "true" as a string)
- This enables database storage for sessions

### Step 3: Verify Configuration

After adding the variables, Railway will automatically redeploy. Check the logs for:

**✅ Success:**
```
✅ Using PostgreSQL session store (Supabase) - Sessions will persist across restarts
✅ PostgreSQL session store connection verified
```

**❌ Error (if DATABASE_URL is wrong):**
```
⚠️  PostgreSQL connection test failed: [error message]
⚠️  Sessions may not persist correctly
```

### Step 4: Test Session Persistence

1. **Login with OTP**
2. **Check Railway logs** - Should see session creation
3. **Restart the server** (or wait for Railway to restart)
4. **Check auth status** - Should still be authenticated
5. **Session should persist** across restarts

## 🔍 How It Works

### Before (MemoryStore):
```
1. User logs in → Session created in MemoryStore
2. Cookie set with session ID
3. Server restarts → MemoryStore cleared
4. Cookie sent with session ID → MemoryStore doesn't have it
5. Auth fails → User redirected to login
```

### After (PostgreSQL Store):
```
1. User logs in → Session created in PostgreSQL
2. Cookie set with session ID
3. Server restarts → PostgreSQL still has the session
4. Cookie sent with session ID → PostgreSQL finds it
5. Auth succeeds → User stays logged in
```

## 📊 Session Table

The `session` table is automatically created by `connect-pg-simple` with this structure:

```sql
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALIy IMMEDIATE;

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
```

## 🛠️ Troubleshooting

### Issue: "DATABASE_URL not set"
**Solution:**
- Add `DATABASE_URL` environment variable in Railway
- Use Supabase PostgreSQL connection string

### Issue: "USE_DATABASE is not 'true'"
**Solution:**
- Set `USE_DATABASE=true` in Railway environment variables
- Must be exactly "true" (lowercase, as a string)

### Issue: "PostgreSQL connection test failed"
**Solutions:**
1. **Check connection string format** - Must be valid PostgreSQL URI
2. **Check Supabase password** - Make sure password is correct
3. **Check Supabase network settings** - Allow connections from Railway
4. **Use Transaction Pooler** - Better for connection pooling

### Issue: Sessions still not persisting
**Solutions:**
1. **Check Railway logs** - Look for PostgreSQL connection errors
2. **Verify table exists** - Check Supabase dashboard for `session` table
3. **Check cookie settings** - Ensure `secure`, `httpOnly`, `sameSite` are correct
4. **Verify trust proxy** - Railway proxy must be trusted

## 🔒 Security Notes

1. **DATABASE_URL is sensitive** - Contains database password
2. **Never commit DATABASE_URL** - Keep it in environment variables only
3. **Use Transaction Pooler** - Better security and performance
4. **Session cleanup** - Expired sessions are automatically cleaned up
5. **SSL connections** - Enabled in production for secure connections

## ✅ Expected Results

After setup, you should see:

1. ✅ **No MemoryStore warning** in logs
2. ✅ **PostgreSQL session store** initialized
3. ✅ **Sessions persist** across server restarts
4. ✅ **Auth status** returns `true` after login
5. ✅ **Users stay logged in** after page refresh/restart

## 📝 Environment Variables Checklist

- [ ] `DATABASE_URL` - Supabase PostgreSQL connection string
- [ ] `USE_DATABASE=true` - Enable database storage
- [ ] `SUPABASE_URL` - Supabase project URL (for other features)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- [ ] `SESSION_SECRET` - Session secret key (for signing cookies)

## 🚀 Next Steps

1. **Add DATABASE_URL** to Railway environment variables
2. **Set USE_DATABASE=true** in Railway
3. **Redeploy** (automatic on variable change)
4. **Test login** and verify sessions persist
5. **Check logs** for PostgreSQL session store confirmation

## 📚 References

- [connect-pg-simple Documentation](https://github.com/voxpelli/node-connect-pg-simple)
- [Supabase Database Connection](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)

---

**Status**: ✅ Implemented and ready to use
**Next**: Add `DATABASE_URL` and `USE_DATABASE=true` to Railway

