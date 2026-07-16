import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Supabase Service configuration missing inside backend environment.");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co",
  supabaseServiceKey || "placeholder-key"
);
