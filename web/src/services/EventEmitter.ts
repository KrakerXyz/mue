
export class EventEmitter {

   private readonly callbacks: any = {};

   public on(event: string, cb: (data: any) => void) {
      if (!this.callbacks[event]) this.callbacks[event] = [];
      this.callbacks[event].push(cb);
   }

   public emit(event: string, data: any) {
      const cbs = this.callbacks[event];
      if (cbs) {
         cbs.forEach((cb: any) => cb(data));
      }
   }
}