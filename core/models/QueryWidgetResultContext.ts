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
   results: { created: number, data: Record<string, any>[] } | null;
}