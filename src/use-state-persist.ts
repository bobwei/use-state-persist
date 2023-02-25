import deepEquals from 'fast-deep-equal';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { storageNamespace } from './constants';
import { syncStorage } from './storage';

export const useStatePersist = <T>(
  key: string,
  initialValue?: T | (() => T)
): [T, Dispatch<SetStateAction<T>>] => {
  // Storage namespace

  const [state, setState] = useState(() => {
    try {
      // Get from local storage by key
      const item = syncStorage.getItem<T>(storageNamespace + key);

      // Get item or else initial value
      const isNotset = item === undefined || item === null;

      return isNotset ? initialValue : item;
    } catch (error) {
      // If error also return initialValue
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    const unsubscribe = syncStorage.subscribe(
      storageNamespace + key,
      (data: T) => {
        if (isState(data)) return;
        setState(data);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (state === undefined || state === null) {
      syncStorage.removeItem(storageNamespace + key);
    } else {
      syncStorage.setItem(storageNamespace + key, state);
    }
  }, [state]);

  const isState = useCallback(
    (compareValue: any) => {
      return deepEquals(state, compareValue);
    },
    [state]
  );

  return [state as T, setState as Dispatch<SetStateAction<T>>];
};
