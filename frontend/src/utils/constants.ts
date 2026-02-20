/**
 * Application Constants
 * 
 * IMPORTANT: If you add or remove a program here, you MUST also update the 
 * `Program` enum in the backend `schema.prisma` file and run a database migration.
 * Example of adding "mba":
 * 1. Add "mba" to this array.
 * 2. In `backend/prisma/schema.prisma`, update `enum Program { btech mca mba }`
 * 3. Run `cd backend && npx prisma migrate dev --name add_mba_program`
 */

export const AVAILABLE_PROGRAMS = [
    { id: "BTECH", label: "B.Tech" },
    { id: "MTECH", label: "M.Tech" },
    { id: "MCA", label: "MCA" },
];
