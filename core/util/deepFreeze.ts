export function deepFreeze<T>(o: T): T {
   if (o === null || o === undefined) { return o; }
   if (typeof o !== 'object') { return o; }

   Object.freeze(o);

   if (Array.isArray(o)) {
      for (const i of o) {
         deepFreeze(i);
      }

      return o;
   }

   for (const p of Object.getOwnPropertyNames(o)) {
      deepFreeze<any>((o as any)[p]);
   }

   return o;
}
