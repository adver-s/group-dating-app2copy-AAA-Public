import { AppError } from './AppError';

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    const errorMessage = field ? `${field}: ${message}` : message;
    super(errorMessage, 400);
    this.name = 'ValidationError';
  }
} 