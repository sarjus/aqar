# AQAR Portal - Role-Based Authentication System

A responsive web application with Supabase authentication, featuring separate admin and user dashboards. The admin can create and manage users, while users can view AQAR (Annual Quality Assurance Report) data in an accordion-style interface.

## Features

- 🔐 **Role-Based Authentication** using Supabase
- 👤 **Admin Dashboard** - Create and manage users with role assignment
- 📊 **User Dashboard** - AQAR data viewer with accordion interface
- 📱 **Fully Responsive** design for all screen sizes
- 🎨 **Modern UI** with Tailwind CSS
- 🚀 **Fast Development** with Vite and React

## Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Routing**: React Router v6

## Prerequisites

- Node.js 16+ and npm/yarn
- A Supabase account and project

## Setup Instructions

### 1. Clone the Repository

```bash
cd aqar-login
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Supabase Setup

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be set up

#### Create the User Roles Table
Run this SQL in the Supabase SQL Editor:

```sql
-- Create user_roles table
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own role
CREATE POLICY "Users can read own role" ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can read all roles
CREATE POLICY "Admins can read all roles" ON user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can insert new roles
CREATE POLICY "Admins can insert roles" ON user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can delete roles
CREATE POLICY "Admins can delete roles" ON user_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

#### Create Initial Admin User

In Supabase Dashboard:
1. Go to **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Enter email and password
4. Note the User ID

Then run this SQL to make them an admin:

```sql
INSERT INTO user_roles (user_id, email, role)
VALUES ('YOUR_USER_ID_HERE', 'admin@example.com', 'admin');
```

Replace `YOUR_USER_ID_HERE` with the actual user ID from step 3.

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```

2. Get your Supabase credentials:
   - Go to **Project Settings** → **API**
   - Copy the **Project URL** and **anon/public key**

3. Update `.env`:
```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 5. Run the Application

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Usage

### Admin Login
1. Login with your admin credentials
2. You'll be redirected to the Admin Dashboard
3. Create new users by clicking "Create New User"
4. Assign roles (admin or user) to new users
5. Manage existing users

### User Login
1. Login with user credentials (created by admin)
2. You'll be redirected to the User Dashboard
3. View AQAR criteria in accordion format
4. Click on criteria to expand and view details

## Project Structure

```
aqar-login/
├── src/
│   ├── components/
│   │   ├── Login.jsx
│   │   ├── Navbar.jsx
│   │   └── ProtectedRoute.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── lib/
│   │   └── supabase.js
│   ├── pages/
│   │   ├── AdminDashboard.jsx
│   │   └── UserDashboard.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## Important Notes

### Supabase Admin API
The admin dashboard uses `supabase.auth.admin.createUser()` which requires:
- **Service Role Key** for production (not anon key)
- For development, you can use the anon key, but you'll need to configure Supabase Auth settings

To enable admin user creation with anon key:
1. Go to Supabase Dashboard → **Authentication** → **Settings**
2. Enable **"Enable email confirmations"** (set to false for development)
3. For production, use Service Role key in environment variable

### Role-Based Access Control
- Admins: Can access `/admin` route, create/delete users
- Users: Can access `/dashboard` route, view AQAR data
- Automatic redirection based on role after login

## Customization

### Adding More AQAR Criteria
Edit `src/pages/UserDashboard.jsx` and update the `aqarData` array with your criteria structure.

### Styling
The project uses Tailwind CSS. Customize colors in `tailwind.config.js`:
- Primary color: Orange theme for buttons and accents
- Dark color: Dark brown for headers

### Authentication Flow
Modify authentication logic in `src/contexts/AuthContext.jsx`

## Troubleshooting

### "Invalid API key" error
- Check your `.env` file has correct Supabase credentials
- Restart the dev server after changing `.env`

### Users can't be created
- Ensure you've created the `user_roles` table in Supabase
- Check that RLS policies are set up correctly
- For production, use Service Role key instead of anon key

### Role not updating
- Clear browser cache and localStorage
- Check the `user_roles` table has correct data
- Verify RLS policies allow reading roles

## Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

## License

MIT

## Support

For issues or questions, please create an issue in the repository.

