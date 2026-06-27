import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';

type AuditOutcome = 'SUCCESS' | 'FAILURE';

interface AuditLogParams {
  action: string;
  outcome?: AuditOutcome;
  userId?: string;
  req?: Request;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  log(params: AuditLogParams): void {
    const payload = {
      action: params.action,
      outcome: params.outcome ?? 'SUCCESS',
      userId: params.userId ?? null,
      ip: params.req?.ip ?? params.req?.socket?.remoteAddress ?? null,
      userAgent: params.req?.headers['user-agent'] ?? null,
      correlationId: this.resolveCorrelationId(params.req),
      timestamp: new Date().toISOString(),
      metadata: this.sanitize(params.metadata ?? {}),
    };

    this.logger.log(JSON.stringify(payload));
  }

  private resolveCorrelationId(req?: Request): string | null {
    if (!req) return null;

    const correlationIdHeader = req.headers['x-correlation-id'];
    if (typeof correlationIdHeader === 'string' && correlationIdHeader.trim().length > 0) {
      return correlationIdHeader;
    }

    const requestIdHeader = req.headers['x-request-id'];
    if (typeof requestIdHeader === 'string' && requestIdHeader.trim().length > 0) {
      return requestIdHeader;
    }

    return null;
  }

  private sanitize(metadata: Record<string, unknown>): Record<string, unknown> {
    const redactedKeys = ['token', 'password', 'secret', 'authorization', 'cookie', 'apiKey'];
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
      const isSensitive = redactedKeys.some((redacted) =>
        key.toLowerCase().includes(redacted.toLowerCase()),
      );
      result[key] = isSensitive ? '[REDACTED]' : value;
    }

    return result;
  }
}
