-- Allow Google as an OAuth provider.
ALTER TABLE oauth_accounts DROP CONSTRAINT oauth_accounts_provider_check;
ALTER TABLE oauth_accounts ADD CONSTRAINT oauth_accounts_provider_check
  CHECK (provider IN ('github', 'discord', 'google'));
