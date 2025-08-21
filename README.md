# Work Diary Web Portal

A comprehensive web-based portal for faculty and administrators to manage and track work activities.

## Features

### Faculty Features
- User registration with role selection (faculty/admin)
- Secure login and authentication
- Password reset functionality
- View personalized timetable
- Submit daily work diary entries including:
  - Task completed for the day
  - Student attendance tracking
  - Automatic absence calculation
- Email confirmation on submission
- View work diary history with filtering options

### Admin Features
- Dashboard with quick overview of faculty reports
- Department-wise filtering
- Approve/reject/resend faculty work diary entries
- Export detailed reports
- View comprehensive faculty statistics

## Tech Stack
- Next.js with TypeScript
- Tailwind CSS for styling
- MongoDB for database
- Next Auth for authentication
- Nodemailer for email notifications

## Getting Started

### Prerequisites
- Node.js (v14 or later)
- npm or yarn
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
```
git clone <repository-url>
cd work-diary
```

2. Install dependencies
```
npm install
```

3. Set up environment variables
Create a `.env.local` file in the root directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email_for_notifications
EMAIL_PASSWORD=your_email_password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Initialize the database with sample data
```
npm run init-db
```

5. Start the development server
```
npm run dev
```

6. Open your browser and navigate to `http://localhost:3000`

## Usage

### Faculty User
1. Register as a new faculty
2. Log in with your credentials
3. View your weekly timetable on the dashboard
4. Submit a new work diary entry by clicking "Create New Work Diary Entry"
5. Fill in the required information:
   - Task done for the day
   - Total number of students
   - Number of students present (absent will be calculated automatically)
6. View your submission history in the Work Diary History section

### Admin User
1. Register as an admin (requires approval)
2. Log in with your credentials
3. View faculty reports on the dashboard
4. Filter reports by department
5. Approve, reject, or request changes to faculty submissions
6. View detailed reports in the Reports section

## Directory Structure
- `/src/pages` - All application pages
- `/src/pages/api` - API endpoints
- `/src/models` - Database models
- `/src/contexts` - Context providers
- `/src/lib` - Utility functions
- `/src/middleware` - Authentication middleware
- `/public` - Static assets

## Troubleshooting

If you encounter any issues:

1. Make sure MongoDB is running
2. Check your environment variables are set correctly
3. Try clearing your browser cache
4. Restart the development server 