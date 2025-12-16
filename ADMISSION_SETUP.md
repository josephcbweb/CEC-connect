# Admission Management System - Setup Guide

## Backend Setup

### 1. Run Database Migration

```bash
cd backend
npx prisma migrate dev --name add_admission_windows
npx prisma generate
```

### 2. Seed Admission Windows (Optional)

```bash
npx ts-node scripts/seed-admission-windows.ts
```

This will create initial admission windows for:

- **B.Tech**: January 1 to May 31 (current year)
- **MCA**: June 1 to July 15 (current year)

### 3. Start Backend Server

```bash
npm run dev
```

The server should be running on `http://localhost:3000`

## Frontend Setup

### 1. Install Dependencies (if not already done)

```bash
cd frontend
npm install
```

### 2. Start Frontend Server

```bash
npm run dev
```

The frontend should be running on `http://localhost:5173` (or the port shown in terminal)

## Features Implemented

### Backend APIs

1. **GET `/admission/status`** - Check if admissions are open (public)
2. **POST `/admission/validate`** - Validate email/Aadhaar uniqueness (public)
3. **POST `/admission/submit`** - Submit admission form (public)
4. **GET `/admission/check/:admissionNumber`** - Get admission by number (public)
5. **GET `/admission/admin/admissions`** - Get all admissions with filters (admin)
6. **GET `/admission/admin/stats`** - Get admission statistics (admin)
7. **GET `/admission/admin/admissions/:id`** - Get single admission details (admin)
8. **PUT `/admission/admin/admissions/:id/status`** - Update admission status (admin)
9. **POST `/admission/admin/admissions/bulk-update`** - Bulk update status (admin)
10. **GET `/admission/admin/admission-windows`** - Get admission windows (admin)
11. **PUT `/admission/admin/admission-windows/:id`** - Update admission window (admin)

### Frontend Pages

1. **`/admin/admissions`** - Main admissions dashboard

   - View all applications
   - Filter by status, program, type
   - Search by name, email, admission number
   - Approve/Reject/Waitlist applications
   - Bulk actions
   - Statistics cards

2. **`/admin/admissions/settings`** - Admission settings
   - Enable/Disable No Due Requests
   - Manage admission windows (open/close)
   - Set admission dates
   - System configuration

### Navigation

The "Admissions" menu item is already available in the sidebar with an alert badge.

## Usage

### Admin Workflow

1. **View Applications**

   - Click on "Admissions" in the sidebar
   - Use filters to narrow down applications
   - Click "View" to see full details

2. **Approve/Reject Applications**

   - Single: Click "Approve" or "Reject" button on each row
   - Bulk: Select multiple checkboxes and use bulk action buttons

3. **Manage Admission Windows**

   - Go to Admissions → Settings (or click "Settings" in sidebar)
   - Toggle admission windows open/closed
   - Update start and end dates
   - Add descriptions for students

4. **View Statistics**
   - Statistics cards show:
     - Total Applications
     - Pending
     - Approved
     - Rejected

### Student Workflow (To be implemented)

Students can:

1. Check if admissions are open
2. Fill admission form
3. Submit application
4. Get admission number
5. Check application status

## Database Schema

### AdmissionWindow Model

```prisma
model AdmissionWindow {
  id          Int      @id @default(autoincrement())
  program     Program  // btech, mca
  startDate   DateTime
  endDate     DateTime
  isOpen      Boolean  @default(true)
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Student Model (Extended)

The Student model already has all necessary fields:

- Admission info: `admission_number`, `admission_date`, `admission_type`, `status`
- Personal info: `name`, `email`, `phone`, `dateOfBirth`, etc.
- Parent info: `fatherName`, `motherName`, etc.
- Education info: `qualifying_exam_name`, `percentage`, etc.
- Entrance exam: `entrance_type`, `entrance_rank`, etc.

## API Testing

### Test Admission Status

```bash
curl http://localhost:3000/admission/status
```

### Test Create Admission Window (after migration)

```bash
curl -X POST http://localhost:3000/admission/admin/admission-windows \
  -H "Content-Type: application/json" \
  -d '{
    "program": "btech",
    "startDate": "2025-01-01",
    "endDate": "2025-05-31",
    "isOpen": true,
    "description": "B.Tech admissions for 2025-26"
  }'
```

### Test Get Admissions

```bash
curl http://localhost:3000/admission/admin/admissions?status=pending
```

## Troubleshooting

### Migration Issues

If you see migration errors:

```bash
cd backend
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
```

### Port Already in Use

If backend port 3000 is in use:

1. Update `backend/.env` - change `PORT=3000` to another port
2. Update `frontend/src/services/admissionService.ts` - change API_BASE URL

### CORS Issues

If you see CORS errors:

- Make sure `cors()` is enabled in `backend/server.ts`
- Check that frontend is making requests to correct backend URL

## Next Steps

1. Add authentication middleware to admin routes
2. Implement email notifications for status changes
3. Create student-facing admission form
4. Add document upload functionality
5. Generate admission documents (DOCX/PDF)
6. Add analytics dashboard with charts

## Notes

- The existing student management system is **NOT** affected
- Admissions and enrolled students use the same `students` table but are differentiated by `status` field
- Status values: `pending`, `approved`, `rejected`, `waitlisted`
- All admin routes should have authentication middleware in production
