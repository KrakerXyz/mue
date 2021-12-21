import { Ref, watch } from 'vue';


/** Returns a promise that resolves when the ref is set to a truthy value */
export function refToPromise<T>(r: Ref<T>): Promise<T> {
   return new Promise<T>(resolve => {
      let resolved = false;

      setTimeout(() => {
         if (resolved) { return; }
         console.warn('A refToPromise still has not resolved after 60 secs. Will it ever?');
      }, 60_000);

      const stop = watch(r, v => {
         if (!v) { return; }
         resolved = true;
         resolve(v);
         setTimeout(stop);
      }, { immediate: true });
   });
}