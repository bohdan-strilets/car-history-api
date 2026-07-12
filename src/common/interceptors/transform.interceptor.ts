import { SKIP_TRANSFORM_KEY } from '@common/decorators/skip-transform.decorator';
import { PaginatedData } from '@common/types';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

type HandlerResult<T> = PaginatedData<T> | T;

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<HandlerResult<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(ctx: ExecutionContext, next: CallHandler<HandlerResult<T>>): Observable<unknown> {
    const skipTransform = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (skipTransform) {
      return next.handle();
    }

    return next.handle().pipe(
      map((result) => {
        if (this.isPaginated(result)) {
          return result;
        }
        return { data: result ?? null };
      }),
    );
  }

  // Helper method to check if the result is paginated data
  private isPaginated(value: unknown): value is PaginatedData<unknown> {
    return (
      typeof value === 'object' &&
      value !== null &&
      'data' in value &&
      'meta' in value &&
      Array.isArray((value as PaginatedData<unknown>).data)
    );
  }
}
