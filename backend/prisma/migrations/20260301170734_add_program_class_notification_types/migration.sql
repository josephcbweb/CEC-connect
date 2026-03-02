-- AlterEnum: Add PROGRAM and CLASS to NotificationTargetType enum
ALTER TYPE "NotificationTargetType" ADD VALUE IF NOT EXISTS 'PROGRAM';
ALTER TYPE "NotificationTargetType" ADD VALUE IF NOT EXISTS 'CLASS';
