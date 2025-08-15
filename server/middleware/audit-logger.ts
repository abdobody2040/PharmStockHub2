
import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { auditLogs } from '@shared/schema';

interface AuditLogEntry {
  userId: number;
  action: string;
  entityType: string;
  entityId?: number;
  oldValues?: any;
  newValues?: any;
  ipAddress: string;
  userAgent: string;
}

export function auditLogger(action: string, entityType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logAuditEntry({
          userId: req.user?.id || 0,
          action,
          entityType,
          entityId: req.params.id ? parseInt(req.params.id) : undefined,
          newValues: req.body,
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'Unknown'
        }).catch(console.error);
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}

async function logAuditEntry(entry: AuditLogEntry) {
  try {
    await db.insert(auditLogs).values({
      ...entry,
      timestamp: new Date(),
      oldValues: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
      newValues: entry.newValues ? JSON.stringify(entry.newValues) : null,
    });
  } catch (error) {
    console.error('Failed to log audit entry:', error);
  }
}
