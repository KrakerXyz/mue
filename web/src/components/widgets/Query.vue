<template>
   <v-widget-template :widget="widget" :widgetManager="widgetManager">
      <template #header-icon>
         <i class="fal fa-list fa-fw fa-3x"></i>
      </template>
      <template #header>
         <div class="row g-2">
            <div class="col-auto">
               <div class="mb-0">
                  <span class="fw-bold">
                     {{ database }}<span v-if="parsed">.{{ parsed.collection }}</span>
                  </span>
                  <span v-if="results?.length" class="ms-2 text-muted">{{ results.length }} result{{ results.length > 1 ? 's' : '' }}</span>
               </div>
               <div v-if="parsed">
                  <span class="text-muted small">{{ parsed.command }}(</span>
                  <span class="font-monospace small mx-1">{{ JSON.stringify(parsed.query) }}</span>
                  <span class="text-muted small">)</span>
               </div>
            </div>
            <div class="col"></div>
            <div class="col-auto">
               <span class="badge bg-primary">{{ connection }}</span>
            </div>
         </div>
      </template>
      <template #header2>
         <div class="row g-0 mt-2">
            <div class="col">
               <textarea
                  class="form-control font-monospace"
                  :class="{ 'is-invalid': invalid }"
                  v-model="queryString"
                  spellcheck="false"
                  :disabled="context.locked"
               ></textarea>
            </div>
            <div class="col-auto">
               <button v-if="!context.locked" class="btn btn-primary h-100" @click="exec()" :disabled="invalid || isRunning">Run</button>
            </div>
         </div>
      </template>
      <template #body v-if="results">
         <div class="h-100 d-flex flex-column">
            <div class="row m-2">
               <div class="col-auto">
                  <div class="form-check">
                     <input class="form-check-input" type="checkbox" id="sort-fields" v-model="context.sortFields" />
                     <label class="form-check-label" for="sort-fields">Sort Fields</label>
                  </div>
               </div>
               <div class="col-auto">
                  <div class="form-check">
                     <input class="form-check-input" type="checkbox" id="hide-empty" v-model="context.hideEmpty" />
                     <label class="form-check-label" for="hide-empty">Hide Empty</label>
                  </div>
               </div>
               <div class="col-auto">
                  <div class="form-check">
                     <input class="form-check-input" type="checkbox" id="expand-all" v-model="context.expandAll" />
                     <label class="form-check-label" for="expand-all">Expand All</label>
                  </div>
               </div>
               <div class="col-auto" v-if="context.hidePaths.length">
                  <div class="hidden-paths position-relative">
                     <span><i class="fal fa-eye"></i> {{ context.hidePaths.length }} hidden paths</span>
                     <div class="hidden-list d-none position-absolute list-group list-group-flush border shadow-sm">
                        <div class="list-group-item bg-light" v-for="p of context.hidePaths" :key="p">
                           <div class="row">
                              <div class="col">{{ p }}</div>
                              <div class="col-auto">
                                 <button class="btn p-0" @click="showPath(p)"><i class="fal fa-eye"></i></button>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
               <div class="col d-flex justify-content-end">
                  <button v-if="!context.locked" class="btn p-0 me-2" @click="context.locked = true">
                     <i class="fal fa-lock-open"></i>
                  </button>
                  <button v-if="context.locked" class="btn p-0 me-2" @click="context.locked = false">
                     <i class="fal fa-lock"></i>
                  </button>
                  <button v-if="!context.favorite" class="btn p-0" @click="context.favorite = true">
                     <i class="fal fa-star"></i>
                  </button>
                  <button v-if="context.favorite" class="btn p-0 text-warning" @click="context.favorite = false">
                     <i class="fas fa-star"></i>
                  </button>
               </div>
            </div>
            <div class="list-group flex-grow-1 overflow-auto font-monospace">
               <div class="list-group-item" v-for="(r, index) of results" :key="index">
                  <v-object-value :value="r" :result-index="index" :contextManager="contextManager" basePath=""></v-object-value>
               </div>
            </div>
            <div v-if="context.results" class="row p-2 bg-light small text-muted">
               <div class="col">Loaded <v-created :created="context.results.created"></v-created></div>
            </div>
         </div>
      </template>
   </v-widget-template>
</template>

<script lang="ts">
   import { useWs, WidgetManager } from '@/services';
   import { Document, QuerySubscription } from '@core/subscriptions';
   import { computed, defineComponent, onUnmounted, reactive, ref, watch } from 'vue';
   import JSON5 from 'json5';
   import { deepClone, deepFreeze } from '@core/util';
   import { QueryWidgetResultContext, Widget } from '@core/models';

   export default defineComponent({
      props: {
         connection: { type: String, required: true },
         database: { type: String, required: true },
         collection: { type: String, required: true },
         query: { type: String },
         resultContext: { type: Object as () => QueryWidgetResultContext },

         widget: { type: Object as () => Widget, required: true },
         widgetManager: { type: Object as () => WidgetManager, required: true },
      },
      setup(props) {
         const ws = useWs();

         const queryString = ref<string>(props.query ?? `db.getCollection('${props.collection}').find({})`);

         const parsed = computed(() => {
            const match = /^db\.getCollection\('(.+)'\)\.(find|aggregate)\(((?:\{|\[).*(?:\}|\]))\)$/.exec(
               queryString.value.replaceAll('\r', '').replaceAll('\n', '')
            );
            if (!match?.length) {
               return;
            }

            let query: Document | Document[] | undefined;
            try {
               query = JSON5.parse(match[3]) as Document | Document[];
            } catch {
               return undefined;
            }

            const msg: QuerySubscription = {
               name: 'subscription.mongo.query',
               connection: props.connection,
               database: props.database,
               collection: match[1],
               command: match[2] as any,
               query: query as Document | Document[],
            };

            return msg;
         });

         watch(parsed, (p) => {
            if (!p) {
               return;
            }
            if (queryString.value === props.query) {
               return;
            }
            props.widgetManager.updateProps(props.widget, { query: queryString.value });
         });

         const invalid = computed(() => !parsed.value);

         // eslint-disable-next-line no-undef
         let sub: ZenObservable.Subscription | null = null;

         const isRunning = ref(false);
         const results = ref<Record<string, any>[]>();

         const exec = () => {
            if (sub) {
               sub.unsubscribe();
               sub = null;
            }
            if (!parsed.value) {
               return;
            }

            results.value = undefined;
            isRunning.value = true;

            const now = Date.now();
            const obs = ws.subscribe(parsed.value);
            const rawResults: Record<string, any>[] = [];

            sub = obs.subscribe((d) => {
               for (const r of d.results) {
                  rawResults.push(r);
               }
               if (d.complete) {
                  console.debug(`Finished query in ${Date.now() - now}ms with ${rawResults.length} records`);
                  context.results = { created: Date.now(), data: rawResults };
                  results.value = rawResults;
                  isRunning.value = false;
               }
            });
         };

         const context: QueryWidgetResultContext = reactive({
            ...defaultResultContext,
            ...{ expandedPaths: deepClone(defaultResultContext.expandedPaths) },
            ...(props.resultContext ?? {}),
         });

         const contextManager = new ResultContextManager(context);

         const showPath = (p: string) => {
            const index = context.hidePaths.indexOf(p);
            if (index === -1) {
               return;
            }
            context.hidePaths.splice(index, 1);
         };

         watch(
            context,
            (c) => {
               props.widgetManager.updateProps<'query'>(props.widget, { resultContext: c });
            },
            { deep: true }
         );

         onUnmounted(() => sub?.unsubscribe());

         if (!invalid.value && !context.results) {
            exec();
         }

         if (context.results) {
            results.value = context.results.data;
            console.debug('Set results from context results');
         }

         return { queryString, invalid, exec, isRunning, context, parsed, showPath, results, contextManager };
      },
   });

   const defaultResultContext: QueryWidgetResultContext = deepFreeze({
      sortFields: false,
      hideEmpty: false,
      expandAll: false,
      hidePaths: [],
      expandedPaths: { global: [], indexed: {} },
      favorite: false,
      results: null,
      locked: false,
   });

   /** Passed through the result rendering vue to provide access to and to mutate a result context */
   export class ResultContextManager {
      public constructor(public readonly context: QueryWidgetResultContext) {}

      public getSummaryHtml(value: any, _path: string) {
         const json = JSON.stringify(value);
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

      public useIsExpanded(path: string, resultIndex: number) {
         return computed(() => {
            if (this.context.expandAll) {
               return true;
            }
            if (this.context.expandedPaths.global.includes(path)) {
               return true;
            }
            return !!this.context.expandedPaths.indexed[resultIndex]?.includes(path);
         });
      }
   }
</script>

<style lang="postcss" scoped>
   .hidden-paths:hover > .hidden-list {
      min-width: 300px;
      z-index: 1;
      display: block !important;
   }
</style>
