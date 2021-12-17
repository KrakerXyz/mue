import { onUnmounted, Ref, ref } from 'vue';
import Observable from 'zen-observable';

export function useSubscription<T>(obs: Observable<T>, callback: (data: T) => void) {
   const sub = obs.subscribe(callback);
   onUnmounted(() => sub.unsubscribe());
}

export function useSubscriptionRef<T>(obs: Observable<T>): Ref<T | undefined> {
   const r = ref<T>();
   useSubscription(obs, data => r.value = data);
   return r;
}

export function toPromise<T>(obs: Observable<T>): Promise<T> {
   return new Promise<T>(resolve => {
      const sub = obs.subscribe(d => {
         if (d === undefined) { return; }
         resolve(d);
         setTimeout(() => sub.unsubscribe());
      });
   });
}

export function observableJoin<T>(observables: Observable<T>[]): Observable<T> {

   return new Observable<T>(sub => {

      const subs = observables.map(o => o.subscribe(d => sub.next(d)));

      () => {
         subs.forEach(s => s.unsubscribe());
      };

   });

}