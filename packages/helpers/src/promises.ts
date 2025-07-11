// Types for the result object with discriminated union
type Success<T> = {
  data: T;
  error: null;
};

type Failure<E> = {
  data: null;
  error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

// Main wrapper function
export async function tryCatch<T, E = Error>(
  promise: Promise<T>,
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}

/**
 * Delay function: Cause an artificial delay in the execution of the code
 * @param time in milliseconds
 */
export const delay = (time: number) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(undefined);
    }, time);
  });

export const poll = <T = any>(
  fn: () => Promise<T>,
  timeoutBetweenAttempts = 5000,
  retries = Number.POSITIVE_INFINITY,
): Promise<T> => {
  return Promise.resolve()
    .then(fn)
    .catch(function retry(err): Promise<T> {
      // biome-ignore lint/style/noParameterAssign:
      if (retries-- > 0) {
        return delay(timeoutBetweenAttempts).then(fn).catch(retry);
      }
      throw err;
    });
}
