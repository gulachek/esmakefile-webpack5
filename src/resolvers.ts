export interface Resolvers<T> {
  resolve(x: T | PromiseLike<T>): void;
  reject(reason: Error): void;
  promise: Promise<T>;
}

export function resolvers<T>(): Resolvers<T> {
  let resolve: (x: PromiseLike<T>) => void;
  let reject: (err: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { resolve, reject, promise };
}
