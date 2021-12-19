
import { Directive } from 'vue';

export interface ResizableOptions {
   change?(event: SizeChangedEvent): void
}

export interface SizeChangedEvent {
   left?: number
   top?: number;
   width?: number;
   height?: number;
}

const CONTEXT = Symbol('ResizableDirective context');

export const resizableDirective: Directive<HTMLElement, ResizableOptions | undefined> = {
   mounted(e, binding) {
      const c = new ResizableContext(e, binding.value ?? {});
      (e as any)[CONTEXT] = c;
   },
   unmounted(el) {
      const context: ResizableContext = (el as any)[CONTEXT];
      context.unmount();
   }
};

let lastActiveContext: ResizableContext | null = null;

class ResizableContext {

   private _unmounted = false;
   private _rects: ResizeRect[];
   private readonly _mutationObserver: MutationObserver;

   public constructor(public readonly el: HTMLElement, public readonly options: ResizableOptions) {
      window.addEventListener('mousemove', this.mouseMove, { passive: true, capture: true });
      window.addEventListener('mousedown', this.mouseDown, { passive: true, capture: true });
      window.addEventListener('mouseup', this.mouseUp, { passive: true, capture: true });
      this._rects = getResizeRects(el);

      let mutTimeout: NodeJS.Timeout | null = null;
      this._mutationObserver = new window.MutationObserver(() => {
         if (this._mouseDownOrigin) { return; }
         if (mutTimeout) { return; }
         mutTimeout = setTimeout(() => {
            this._rects = getResizeRects(el);
            mutTimeout = null;
         }, 50);
      });

      this._mutationObserver.observe(el, {
         attributes: true,
         attributeFilter: ['style'],
      });
   }

   private _lastActive: ResizeRect | null = null;

   private _mouseDownOrigin: { x: number, y: number, rect: { top: number; left: number, width: number, height: number; } } | null = null;

   private readonly mouseMove = (evt: MouseEvent) => {

      if (this._unmounted) {
         console.warn('MM on unmounted');
         return;
      }

      //console.log(`Mousemove ${this.el.id}`);
      if (lastActiveContext && lastActiveContext !== this) {
         return;
      }

      if (this._mouseDownOrigin) {
         this.updateElement(evt);
         return;
      }

      for (const r of this._rects) {
         if (evt.clientX < r.left) { continue; }
         if (evt.clientX > r.right) { continue; }
         if (evt.clientY < r.top) { continue; }
         if (evt.clientY > r.bottom) { continue; }

         document.documentElement.style.cursor = r.cursor;
         this._lastActive = r;
         lastActiveContext = this;
         return;
      }

      if (lastActiveContext === this) {
         lastActiveContext = null;
      }

      if (this._lastActive) {
         document.documentElement.style.cursor = '';
         this._lastActive = null;
      }
   };

   /** Called from mouseMove when there's a _mouseDownOrigin - they're actively dragging a edge */
   private _newStyle: SizeChangedEvent | null = null;
   private updateElement(evt: MouseEvent) {
      if (!this._mouseDownOrigin || !this._lastActive) {
         return;
      }
      const diff = { x: evt.x - this._mouseDownOrigin.x, y: evt.clientY - this._mouseDownOrigin.y };

      this._newStyle = {};

      if (this._lastActive.cursor === 'ew-resize') {
         if (this._lastActive.side === 'right') {
            this._newStyle.width = this._mouseDownOrigin.rect.width + diff.x;
         } else {
            this._newStyle.width = this._mouseDownOrigin.rect.width + (diff.x * -1);
            this._newStyle.left = this._mouseDownOrigin.rect.left + diff.x;
         }
      } else if (this._lastActive.cursor === 'ns-resize') {
         if (this._lastActive.side === 'bottom') {
            this._newStyle.height = this._mouseDownOrigin.rect.height + diff.y;
         } else {
            this._newStyle.height = this._mouseDownOrigin.rect.height + (diff.y * -1);
            this._newStyle.top = this._mouseDownOrigin.rect.top + diff.y;
         }
      } else if (this._lastActive.cursor === 'nwse-resize') {
         if (this._lastActive.side === 'top') {
            this._newStyle.width = this._mouseDownOrigin.rect.width + (diff.x * -1);
            this._newStyle.left = this._mouseDownOrigin.rect.left + diff.x;
            this._newStyle.height = this._mouseDownOrigin.rect.height + (diff.y * -1);
            this._newStyle.top = this._mouseDownOrigin.rect.top + diff.y;
         } else {
            this._newStyle.width = this._mouseDownOrigin.rect.width + diff.x;
            this._newStyle.height = this._mouseDownOrigin.rect.height + diff.y;
         }
      } else if (this._lastActive.cursor === 'nesw-resize') {
         if (this._lastActive.side === 'top') {
            this._newStyle.width = this._mouseDownOrigin.rect.width + diff.x;
            this._newStyle.height = this._mouseDownOrigin.rect.height + (diff.y * -1);
            this._newStyle.top = this._mouseDownOrigin.rect.top + diff.y;
         } else {
            this._newStyle.height = this._mouseDownOrigin.rect.height + diff.y;
            this._newStyle.width = this._mouseDownOrigin.rect.width + (diff.x * -1);
            this._newStyle.left = this._mouseDownOrigin.rect.left + diff.x;
         }
      }

      Object.getOwnPropertyNames(this._newStyle).map(p => {
         const v = (this._newStyle as any)[p];
         if (v === undefined) { return; }
         const css = `${v}px`;
         (this.el.style as any)[p] = css;
      });

   }

   private readonly mouseDown = (evt: MouseEvent) => {
      if (!this._lastActive) { return; }
      this.el.style.userSelect = 'none';
      this._mouseDownOrigin = { x: evt.clientX, y: evt.clientY, rect: { top: this.el.offsetTop, left: this.el.offsetLeft, height: this.el.offsetHeight, width: this.el.offsetWidth } };
   };

   private readonly mouseUp = () => {
      if (!this._mouseDownOrigin || !this._lastActive) {
         return;
      }
      this.el.style.userSelect = '';
      this._mouseDownOrigin = null;
      if (this._newStyle && this.options.change) { this.options.change(this._newStyle); }
      this._newStyle = null;
      setTimeout(() => {
         this._rects = getResizeRects(this.el);
      });
   };

   public unmount() {
      this._unmounted = true;
      window.removeEventListener('mousemove', this.mouseMove, true);
      window.removeEventListener('mouseup', this.mouseUp, true);
      window.removeEventListener('mousedown', this.mouseDown, true);
      this._mutationObserver.disconnect();
   }

}

interface ResizeRect {
   top: number;
   bottom: number;
   left: number;
   right: number;
   cursor: string;
   side: 'top' | 'right' | 'bottom' | 'left'
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
         cursor: 'nwse-resize',
         side: 'top'
      },
      //TOP
      {
         top: rect.top - width,
         bottom: rect.top + width,
         left: rect.left + corner,
         right: rect.right - corner,
         cursor: 'ns-resize',
         side: 'top'
      },
      //TOP-RIGHT
      {
         top: rect.top - width,
         bottom: rect.top + width,
         left: rect.right - corner,
         right: rect.right + width,
         cursor: 'nesw-resize',
         side: 'top'
      },
      //RIGHT
      {
         top: rect.top + corner,
         bottom: rect.bottom - corner,
         left: rect.right - width,
         right: rect.right + width,
         cursor: 'ew-resize',
         side: 'right'
      },
      //BOTTOM-RIGHT
      {
         top: rect.bottom - corner,
         bottom: rect.bottom + width,
         left: rect.right - width,
         right: rect.right + width,
         cursor: 'nwse-resize',
         side: 'bottom'
      },
      //BOTTOM
      {
         top: rect.bottom - width,
         bottom: rect.bottom + width,
         left: rect.left + corner,
         right: rect.right - corner,
         cursor: 'ns-resize',
         side: 'bottom'
      },
      //BOTTOM-LEFT
      {
         top: rect.bottom - corner,
         bottom: rect.bottom + width,
         left: rect.left - width,
         right: rect.left + width,
         cursor: 'nesw-resize',
         side: 'bottom'
      },
      //LEFT
      {
         top: rect.top + corner,
         bottom: rect.bottom - corner,
         left: rect.left - width,
         right: rect.left + width,
         cursor: 'ew-resize',
         side: 'left'
      }
   ];
}