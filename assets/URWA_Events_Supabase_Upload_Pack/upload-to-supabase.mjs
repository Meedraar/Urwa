import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_BUCKET || "urwa-events";
const root = process.argv[2] || ".";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const mimeTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
  ".ogg": "video/ogg",
};

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

const files = (await walk(root)).filter((file) => {
  const rel = path.relative(root, file).split(path.sep);
  const ext = path.extname(file).toLowerCase();
  return rel.length > 1 && !["README.txt", "UPLOAD-MANIFEST.json", "upload-to-supabase.mjs", "package.json", ".env.example"].includes(path.basename(file))
    && Boolean(mimeTypes[ext]);
});

if (!files.length) {
  console.error("No supported media found. Run this from the extracted upload-pack folder.");
  process.exit(1);
}

let succeeded = 0;
let failed = 0;

for (const file of files) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  const objectPath = relative;
  const contentType = mimeTypes[path.extname(file).toLowerCase()];
  const bytes = await (await import("node:fs/promises")).readFile(file);
  const { error } = await supabase.storage.from(bucket).upload(objectPath, bytes, {
    contentType,
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    failed++;
    console.error(`FAILED  ${objectPath}: ${error.message}`);
  } else {
    succeeded++;
    console.log(`UPLOADED ${objectPath}`);
  }
}

console.log(`\nFinished: ${succeeded} uploaded, ${failed} failed.`);
if (failed) process.exitCode = 1;
