import { deepFreeze } from '@core/util';

export interface QueryWidgetResultContext {
   sortFields: boolean;
   hideEmpty: boolean;
   expandAll: boolean;
   hidePaths: string[];
   expandedPaths: {
      global: string[],
      /** Expanded paths specific to a record by it's index in the results */
      indexed: Record<number, string[]>
   };
   favorite: boolean;
   locked: boolean;
   pathFilter: string | null | undefined;
   results: { created: number, data: Record<string, any>[] } | null;
}

export const defaultResultContext: QueryWidgetResultContext = deepFreeze({
   sortFields: false,
   hideEmpty: false,
   expandAll: false,
   hidePaths: [],
   expandedPaths: { global: [], indexed: {} },
   favorite: false,
   results: null,
   locked: false,
   pathFilter: undefined,
});