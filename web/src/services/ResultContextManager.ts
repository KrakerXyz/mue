import { QueryWidgetResultContext } from '@core/models';

/** Passed through the result rendering vue to provide access to and to mutate a result context */
export class ResultContextManager {
   public constructor(public readonly context: QueryWidgetResultContext) {}

   public getSummaryText(value: any, path: string, maxLength: number = 600) {
      let json = '';

      switch (typeof value) {
         case 'function':
            json += 'function()';
            break;
         case 'symbol':
            json += 'Symbol()';
            break;
         case 'undefined':
            json += 'undefined';
            break;
         case 'boolean':
         case 'bigint':
         case 'number':
            json += value.toString();
            break;
         case 'string':
            json += `'${value}'`;
            break;
         case 'object': {
            if (Array.isArray(value)) {
               json += '[';

               for (let i = 0; i < value.length; i++) {
                  const thisPath = `${path}[${i}]`;
                  const thisValue = value[i];
                  if (i) {
                     json += ',';
                  }
                  const thisSummary = this.getSummaryText(thisValue, thisPath, maxLength - json.length);
                  json += thisSummary;
                  if (json.length > maxLength) {
                     break;
                  }
               }

               json += ']';
            } else {
               json += this.getObjectSummary(value, path, maxLength);
            }

            break;
         }
         default:
            json += value as never;
            break;
      }

      return json.substring(0, maxLength);
   }

   private getObjectSummary(value: Record<string, any>, path: string, maxLength: number): string {
      let json = '{';
      const props = Object.keys(value);
      if (this.context.sortFields) {
         props.sort((a, b) => a.localeCompare(b));
      }
      for (let i = 0; i < props.length; i++) {
         const p = props[i];
         const thisPath = `${path}.${p}`;
         const thisValue = value[p];
         if (this.context.hideEmpty && (thisValue === null || thisValue === undefined || thisValue === '')) {
            continue;
         }
         if (i) {
            json += ',';
         }
         const thisSummary = this.getSummaryText(thisValue, thisPath, maxLength - json.length);
         json += `${p}:${thisSummary}}`;
         if (json.length > maxLength) {
            break;
         }
      }
      json += '}';

      return json;
   }

   public togglePathExpanded(path: string, resultIndex: number) {
      const index = this.context.expandedPaths.indexed[resultIndex]?.indexOf(path);
      if (index > -1) {
         this.context.expandedPaths.indexed[resultIndex].splice(index, 1);
      } else {
         if (!this.context.expandedPaths.indexed[resultIndex]) {
            this.context.expandedPaths.indexed[resultIndex] = [];
         }
         this.context.expandedPaths.indexed[resultIndex].push(path);
      }
   }

   public isExpanded(path: string, resultIndex: number) {
      if (this.context.expandAll) {
         return true;
      }
      if (this.context.expandedPaths.global.includes(path)) {
         return true;
      }
      return !!this.context.expandedPaths.indexed[resultIndex]?.includes(path);
   }

   public toggleHidePath(path: string) {
      const index = this.context.hidePaths.indexOf(path);
      if (index === -1) {
         this.context.hidePaths.push(path);
      } else {
         this.context.hidePaths.splice(index, 1);
      }
   }

   public isVisible(path: string, value: any) {
      if (this.context.hidePaths.includes(path)) {
         return false;
      }

      if (this.context.hideEmpty) {
         if (value === null || value === undefined || value === '') {
            return false;
         }

         if (Array.isArray(value) && value.length === 0) {
            return false;
         }
      }

      if (this.context.pathFilter && !path.toLowerCase().includes(this.context.pathFilter.toLowerCase())) {
         return false;
      }

      return true;
   }
}
