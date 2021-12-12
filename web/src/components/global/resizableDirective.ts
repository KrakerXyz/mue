
import { Directive } from 'vue';

export interface ResizableOptions {
   change(event: SizeChangedEvent): void
}

export interface SizeChangedEvent {
   left: number
   top: number;
   width: number;
   height: number;
}

const CONTEXT = Symbol('ResizableDirective context');

export const resizableDirective: Directive<HTMLElement, ResizableOptions | undefined> = {
   mounted(e, binding) {
      const c = new ResizableContext(e, binding.value);
      (e as any)[CONTEXT] = c;
   },
   unmounted(el) {
      const context: ResizableContext = (el as any)[CONTEXT];
      context.unmount();
   }
};

class ResizableContext {

   private _rects: ResizeRect[];

   public constructor(public readonly el: HTMLElement, public readonly options: ResizableOptions | undefined) {
      window.addEventListener('mousemove', this.mouseMove, { passive: true, capture: true });
      this._rects = getResizeRects(el);
   }

   private _lastActive: ResizeRect | null = null;

   private readonly mouseMove = (evt: MouseEvent) => {

      //console.log(`Mousemove ${this.el.id}`);

      for (const r of this._rects) {
         if (evt.clientX < r.left) { continue; }
         if (evt.clientX > r.right) { continue; }
         if (evt.clientY < r.top) { continue; }
         if (evt.clientY > r.bottom) { continue; }

         document.documentElement.style.cursor = r.cursor;
         this._lastActive = r;
         return;
      }

      if (this._lastActive) {
         document.documentElement.style.cursor = '';
         this._lastActive = null;
      }
   };

   public unmount() {
      window.removeEventListener('mousemove', this.mouseMove);
   }

}

interface ResizeRect {
   top: number;
   bottom: number;
   left: number;
   right: number;
   cursor: string;
}


function getResizeRects(el: HTMLElement): ResizeRect[] {

   const width = 6;
   const corner = 15;

   const rect = el.getBoundingClientRect();
   return [
      //TOP-LEFT
      {
         top: rect.top - width,
         bottom: rect.top + corner,
         left: rect.left - width,
         right: rect.left + width,
         cursor: 'nwse-resize'
      },
      //TOP
      {
         top: rect.top - width,
         bottom: rect.top + width,
         left: rect.left + corner,
         right: rect.right - corner,
         cursor: 'ns-resize'
      },
      //TOP-RIGHT
      {
         top: rect.top - width,
         bottom: rect.top + width,
         left: rect.right - corner,
         right: rect.right + width,
         cursor: 'nesw-resize'
      },
      //RIGHT
      {
         top: rect.top + corner,
         bottom: rect.bottom - corner,
         left: rect.right - width,
         right: rect.right + width,
         cursor: 'ew-resize'
      },
      //BOTTOM-RIGHT
      {
         top: rect.bottom - corner,
         bottom: rect.bottom + width,
         left: rect.right - width,
         right: rect.right + width,
         cursor: 'nwse-resize'
      },
      //BOTTOm
      {
         top: rect.bottom - width,
         bottom: rect.bottom + width,
         left: rect.left + corner,
         right: rect.right - corner,
         cursor: 'ns-resize'
      },
      //BOTTOM-LEFT
      {
         top: rect.bottom - corner,
         bottom: rect.bottom + width,
         left: rect.left - width,
         right: rect.left + width,
         cursor: 'nesw-resize'
      },
      //LEFT
      {
         top: rect.top + corner,
         bottom: rect.bottom - corner,
         left: rect.left - width,
         right: rect.left + width,
         cursor: 'ew-resize'
      }
   ];
}