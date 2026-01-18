import { AppError } from './AppError'

export class NotFoundError extends AppError {
  constructor(message: string = 'リソースが見つかりません') {
    super(message, 404, true)
    this.name = 'NotFoundError'
  }
}
