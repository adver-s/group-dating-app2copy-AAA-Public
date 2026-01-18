import { AppError } from './AppError';

export class DatabaseError extends AppError {
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(`Database error: ${message}`, 500);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
} 