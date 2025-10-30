-- Add language preference column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN language_preference VARCHAR(5) DEFAULT 'en' CHECK (language_preference IN ('en', 'zh', 'ms', 'ta'));