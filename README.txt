AXY OFFICIAL neon site setup

1. Keep this folder structure when uploading:
   index.html, style.css, script.js, updates.js, supabase-config.js, assets/axyimasge.jpg, ADMIN/index.html, ADMIN/admin.css, ADMIN/admin.js
2. Create an assets folder and copy the attached logo into it as axyimasge.jpg.
3. Open index.html locally for a visual preview. For Supabase modules/admin, serve or deploy over HTTPS (GitHub Pages/Netlify/Vercel), not file://.
4. supabase-config.js contains the public project URL and publishable key from this conversation. If you rotate the publishable key, replace it there. Never put a secret/service-role key in browser code.
5. Admin URL is your-domain/ADMIN/. There is intentionally no public navigation link. Sign in with username AKSHAY18 and the password for the Supabase user axymanager@gmail.com. Admin access checks site_admins.user_id against the signed-in user's Auth UID.
6. Admin publishing expects an updates table with title, description, image_url, button_text, button_url, created_at columns, and a public update-images Storage bucket for uploads. The image URL field is an alternative to storage upload.
7. Keep Supabase RLS enabled and ensure only site_admins entries can insert/delete updates and upload into update-images. The browser code uses only the publishable key, never a service-role key.
