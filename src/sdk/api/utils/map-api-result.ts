import { plainToClass } from 'class-transformer';

/**
 * @ignore
 */
export function mapApiResult<T extends {}, K extends keyof T>(
  data: T,
  models?: {
    [key in K]: { new (...args: any): T[K] };
  },
): T {
  if (models) {
    const keys = Object.keys(models);

    for (const key of keys) {
      const plain = data[key];
      const model = models[key];

      if (model && plain && !(plain instanceof model)) {
        data[key] = plainToClass(model, plain);
      }
    }
  }

  return data;
}
