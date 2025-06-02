# X Platform Clone
## Overview
This project is a simplified clone of the X social media platform. It allows users to sign up, log in, post text and images, and view posts. The application is developed using modern web technologies, with a focus on full-stack development, database integration, and authentication.

### Features

User Authentication: Secure sign-up and login using Supabase Auth, with session management via cookies.
Post Creation: Authenticated users can create posts with text and/or images, stored in a PostgreSQL database via Prisma ORM.
Image Uploads: Images are uploaded to Supabase Storage, with public URLs saved in the database for display.
Design: The UI is styled with Tailwind CSS and Shadcn UI.
Database Integration: Posts and users are stored in Supabase’s PostgreSQL database, with relationships managed by Prisma.

### Tech Stack

Frontend: Next.js (App Router), TypeScript, Tailwind CSS, Shadcn UI
Backend: Next.js API Routes, Prisma ORM, Supabase (Auth, Storage, PostgreSQL)
HTTP Client: Axios for API requests

### Prerequisites

Node.js (v18 or higher)
Supabase account and project
npm or yarn
Basic knowledge of TypeScript and Next.js

### Setup Instructions

#### Clone the Repository:
```Bash
git clone https://github.com/Mad4025/x-com-clone
cd x-platform-clone
```


#### Install Dependencies:
`npm install`


Configure Environment Variables: Create a .env file in the root directory with the following:
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
```

Replace [YOUR-PASSWORD], [YOUR-PROJECT-ID], [YOUR-ANON-KEY], and [YOUR-SERVICE-ROLE-KEY] with your Supabase project credentials (found in Supabase Dashboard > Settings > API and Database).

### Set Up Supabase:

Create a Supabase project and note the database URL and API keys.
Create a storage bucket named post-images (set to public for read access).

Add an RLS policy for image uploads: 
```SQL
CREATE POLICY "Allow authenticated uploads to post-images" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-images');
```

### Initialize Prisma:

Run the following to sync the database schema:
`npx prisma db push`


Run the Application:
`npm run dev`

Open http://localhost:3000 in your browser.


## Project Structure

app/: Next.js App Router pages and API routes
page.tsx: Main page for posting and viewing content
api/posts/route.ts: API route for creating and fetching posts
layout.tsx: Root layout with Supabase session provider


components/: Reusable UI components (e.g., Header.tsx)
lib/: Utility files
prisma.ts: Prisma client with singleton pattern
supabase.ts: Supabase client for storage operations


utils/supabase/: Supabase utilities
server.ts: Server-side Supabase client
middleware.ts: Session management middleware


actions/users.ts: Server actions for authentication
prisma/schema.prisma: Database schema for User and Post models

Database Schema
Defined in prisma/schema.prisma:

User: Stores user data with id (UUID) and email (unique).
Post: Stores posts with id (UUID), text (optional), image (optional URL), createdAt, and authorId (links to User.id).

### Authentication

Uses Supabase Auth for user management.
Server actions (loginAction, signUpAction, logOutAction) handle authentication.
Middleware (middleware.ts) refreshes sessions for non-API routes.
Posts are restricted to authenticated users, verified via Supabase session cookies.

### Known Limitations

Image uploads use a public bucket for simplicity; production apps should restrict access with RLS.
No comment editing or deletion yet (planned features).

### Troubleshooting

401 Unauthorized Errors: Ensure Supabase cookies are set after login. Check server logs for getUser errors.
RLS Policy Errors: Verify the post-images bucket has the correct INSERT policy for storage.objects.
Prisma Errors: Run npx prisma db push to sync the schema.

This project demonstrates:

Full-Stack Development: Integration of Next.js, Supabase, and Prisma for a cohesive app.
Authentication: Secure user management with Supabase Auth.
Database Relationships: Linking posts to users via authorId.
Responsive UI: Clean, centered layout using Tailwind and Shadcn UI.
