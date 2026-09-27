-- Manually verify email for hemant150604@gmail.com
UPDATE "User"
SET 
  "emailVerified" = true,
  "verificationToken" = NULL,
  "verificationExpiry" = NULL
WHERE "email" = 'hemant150604@gmail.com';
