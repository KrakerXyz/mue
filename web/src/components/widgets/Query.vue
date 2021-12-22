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
               <v-connection-badge :name="connection"></v-connection-badge>
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
      <template #body>
         <div class="h-100 d-flex flex-column">
            <div class="row p-2 border-bottom bg-light d-flex align-items-center">
               <div class="col-auto">
                  <div class="form-check">
                     <input
                        class="form-check-input"
                        type="checkbox"
                        id="sort-fields"
                        :checked="context.sortFields"
                        @change="setContextProperty('sortFields', ($event.target as any).checked)"
                     />
                     <label class="form-check-label" for="sort-fields">Sort Fields</label>
                  </div>
               </div>
               <div class="col-auto">
                  <div class="form-check">
                     <input
                        class="form-check-input"
                        type="checkbox"
                        id="hide-empty"
                        :checked="context.hideEmpty"
                        @change="setContextProperty('hideEmpty', ($event.target as any).checked)"
                     />
                     <label class="form-check-label" for="hide-empty">Hide Empty</label>
                  </div>
               </div>
               <div class="col-auto">
                  <div class="form-check">
                     <input
                        class="form-check-input"
                        type="checkbox"
                        id="expand-all"
                        :checked="context.expandAll"
                        @change="setContextProperty('expandAll', ($event.target as any).checked)"
                     />
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
               <div class="col">
                  <input class="form-control" placeholder="Path Filter" v-model="context.pathFilter" />
               </div>
               <div class="col-auto d-flex justify-content-end">
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
            <v-virtual-list :items="results ?? []" class="overflow-auto list-group flex-grow-1 font-monospace" @scroll-index="scrollIndexChange($event)">
               <template #default="slotProps">
                  <div class="list-group-item">
                     <div class="row g-1 align-items-center">
                        <div class="col-auto col-index overflow-hidden text-nowrap text-end">{{ slotProps.index }}:</div>
                        <div class="col overflow-hidden">
                           <v-object-value
                              :value="slotProps.item"
                              :result-index="slotProps.index"
                              :contextManager="contextManager"
                              basePath=""
                           ></v-object-value>
                        </div>
                     </div>
                  </div>
               </template>
            </v-virtual-list>
         </div>
      </template>
   </v-widget-template>
</template>

<script lang="ts">
   import { ResultContextManager, useWs, WidgetManager } from '@/services';
   import { Document, QuerySubscription } from '@core/subscriptions';
   import { computed, defineComponent, markRaw, onUnmounted, reactive, ref, watch, nextTick } from 'vue';
   import JSON5 from 'json5';
   import { deepClone } from '@core/util';
   import { QueryWidgetResultContext, Widget, defaultResultContext } from '@core/models';
   import { v4 } from 'uuid';

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
         let isComplete = false;
         let subId = '';

         const exec = () => {
            if (sub) {
               sub.unsubscribe();
               sub = null;
            }
            if (!parsed.value) {
               return;
            }

            if (context.locked) {
               console.warn('Attempted to rerun exec() on locked query');
               return;
            }

            isComplete = false;
            results.value = undefined;
            isRunning.value = true;
            subId = v4();

            const now = Date.now();
            const obs = ws.subscribe(parsed.value, subId);
            let rawResults: Record<string, any>[] = [];

            sub = obs.subscribe((d) => {
               for (const r of d.results) {
                  rawResults.push(r);
               }
               if (d.pageComplete) {
                  console.debug(`Finished page in ${Date.now() - now}ms with ${rawResults.length} records`);
                  results.value = markRaw([...(results.value ?? []), ...rawResults]);
                  rawResults = [];
                  isRunning.value = false;

                  isComplete = d.queryComplete;
               }
            });
         };

         const scrollIndexChange = (index: number) => {
            if (isComplete) {
               return;
            }
            if (isRunning.value) {
               return;
            }
            if (!results.value) {
               return;
            }
            if (index < results.value.length - 5) {
               return;
            }

            console.log('Loading next page');
            isRunning.value = true;
            ws.command({
               name: 'command.subscription.nextPage',
               id: subId,
            });
         };

         const context: QueryWidgetResultContext = reactive({
            ...deepClone(defaultResultContext),
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

         if (!invalid.value) {
            exec();
         }

         const setContextProperty = async (prop: keyof QueryWidgetResultContext, value: any) => {
            const tmpResults = results.value;
            results.value = [];
            await nextTick();
            (context as any)[prop] = value;

            await nextTick();
            results.value = tmpResults;
         };

         onUnmounted(() => {
            sub?.unsubscribe();
            console.debug('Query.vue unmounted');
         });

         return { queryString, invalid, exec, isRunning, context, parsed, showPath, results, contextManager, setContextProperty, scrollIndexChange };
      },
   });
</script>

<style lang="postcss" scoped>
   .hidden-paths:hover > .hidden-list {
      min-width: 300px;
      z-index: 1;
      display: block !important;
   }

   .col-index {
      width: 3rem;
   }
</style>
