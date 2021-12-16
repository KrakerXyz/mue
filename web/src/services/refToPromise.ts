import { Ref, watch } from 'vue';


/** Returns a promise that resolves when the ref is set to a truthy value */
export function refToPromise<T>(r: Ref<T>): Promise<T> {
   return new Promise<T>(resolve => {
      const stop = watch(r, v => {
         if (!v) { return; }
         resolve(v);
         setTimeout(stop);
      }, { immediate: true });
   });
}