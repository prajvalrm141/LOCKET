import { useLoaderData as originalUseLoaderData, useParams as originalUseParams } from '@tanstack/react-router';

export function useLoaderData<T = any>(): T {
  // @ts-ignore - bypass TS arity check
  return originalUseLoaderData() as T;
}

export function useParams<T extends Record<string, any> = Record<string, any>>(): T {
  // @ts-ignore - bypass TS arity check
  return originalUseParams() as T;
}