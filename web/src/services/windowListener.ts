export type Subscription = () => void;

export function useWindowListener<T extends keyof WindowEventMap>(event: T, callback: (event: WindowEventMap[T]) => void): Subscription {
   window.addEventListener(event, callback);
   return () => {
      window.removeEventListener(event, callback);
   };
}
