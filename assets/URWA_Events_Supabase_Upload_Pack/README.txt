URWA EVENTS — SUPABASE MEDIA UPLOAD

Contents
- Collection folders containing the original photos/videos
- needs-review/ for media whose event category was not confidently identified
- upload-to-supabase.mjs: uploads the collection folders to the existing `urwa-events` bucket
- .env.example: environment-variable template

UPLOAD (Windows / VS Code)
1. Extract this ZIP to a folder on your computer.
2. Open that extracted folder in VS Code.
3. In the VS Code terminal run:
     npm install
4. Copy `.env.example` to a new file named `.env`.
5. In Supabase Dashboard, open project `Urwa` (reference: qtiffwoqimtuchjrnjaa).
   Go to Project Settings → API Keys and copy the SECRET service-role key.
   Paste it into `.env` as SUPABASE_SERVICE_ROLE_KEY.
   Keep this key private. Do not paste it into chat, commit it to GitHub,
   or put it in browser-side website code.
6. Run:
     npm run upload

The script uploads each file using its existing relative folder path, for example:
  retreats/1000202375.jpg
  memorise-and-rise/1000202360.jpg
  dawah-and-outreach/1000202351.jpg

It does NOT delete or overwrite existing objects. If a file already exists,
Supabase reports it as failed rather than replacing it. Review the terminal
summary and any errors.

The `needs-review` folder is included too; it will appear as its own folder in
Storage and can be moved later after identifying the event.

SECURITY
- The service-role key is used only by this local Node script.
- Never commit `.env`; add it to `.gitignore` if this folder is inside a repo.
- Do not create a public INSERT policy for anonymous visitors.
- Public viewing/listing is already configured for the bucket.

After upload
Open Supabase → Storage → urwa-events and confirm the collection folders
and media appear. Then open the URWA Events page locally in VS Code and
check the gallery collections and media playback. No deployment is performed.
