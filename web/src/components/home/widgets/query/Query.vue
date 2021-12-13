<template>
   <workspace-widget>
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
                  <span v-if="results.length" class="ms-2 text-muted">{{ results.length }} result{{ results.length > 1 ? 's' : '' }}</span>
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
            <div class="list-group flex-grow-1 overflow-auto">
               <div class="list-group-item" v-for="r of results" :key="r.id">
                  <object-value :value="r" :context="context"></object-value>
               </div>
            </div>
            <div v-if="context.results" class="row p-2 bg-light small text-muted">
               <div class="col">Loaded <v-created :created="context.results.created"></v-created></div>
            </div>
         </div>
      </template>
   </workspace-widget>
</template>

<script lang="ts">
   import { useWs } from '@/services';
   import { Document, QuerySubscription } from '@core/subscriptions';
   import { computed, defineComponent, onUnmounted, reactive, ref, watch } from 'vue';
   import WorkspaceWidget from '../../WorkspaceWidget.vue';
   import JSON5 from 'json5';
   import { defaultResultContext, ObjectValue, ObjectValueRoot, ResultContext } from './ResultObjects';
   import ObjectValueVue from './ObjectValue.vue';
   import ArrayValueVue from './ArrayValue.vue';
   import { deepClone } from '@core/util';
   import FieldVue from './Field.vue';

   export default defineComponent({
      components: {
         WorkspaceWidget,
         'object-value': ObjectValueVue,
         // eslint-disable-next-line vue/no-unused-components
         'array-value': ArrayValueVue,
         // eslint-disable-next-line vue/no-unused-components
         field: FieldVue,
      },
      props: {
         connection: { type: String, required: true },
         database: { type: String, required: true },
         collection: { type: String, required: true },
         query: { type: String },
         resultContext: { type: Object as () => ResultContext },
      },
      emits: {
         'update-props': (value: Record<string, any>) => !!value,
      },
      setup(props, { emit }) {
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
            emit('update-props', { query: queryString.value });
         });

         const invalid = computed(() => !parsed.value);

         let results = ref<ObjectValue[]>(reactive([]));
         // eslint-disable-next-line no-undef
         let sub: ZenObservable.Subscription | null = null;

         const isRunning = ref(false);
         const exec = () => {
            if (sub) {
               sub.unsubscribe();
               sub = null;
            }
            if (!parsed.value) {
               return;
            }
            results.value = reactive([]);
            const rawResults: Record<string, any>[] = [];
            const newResults: ObjectValue[] = [];

            isRunning.value = true;

            const now = Date.now();
            const obs = ws.subscribe(parsed.value);

            sub = obs.subscribe((d) => {
               for (const r of d.results) {
                  rawResults.push(r);
                  const v = new ObjectValueRoot(r, newResults.length, context, props.connection, props.database, props.collection);
                  newResults.push(v);
               }
               results.value = newResults;
               if (d.complete) {
                  console.debug(`Finished query in ${Date.now() - now}ms with ${newResults.length} records`);
                  context.results = { created: Date.now(), data: rawResults };
                  isRunning.value = false;
               }
            });
         };

         const context: ResultContext = reactive({
            ...defaultResultContext,
            ...{ expandedPaths: deepClone(defaultResultContext.expandedPaths) },
            ...(props.resultContext ?? {}),
         });

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
               emit('update-props', { resultContext: c });
            },
            { deep: true }
         );

         onUnmounted(() => sub?.unsubscribe());

         if (!invalid.value && !context.results) {
            exec();
         }

         if (context.results) {
            results.value = context.results.data.map((r, index) => new ObjectValueRoot(r, index, context, props.connection, props.database, props.collection));
            console.debug('Set results from context results');
         }

         return { queryString, invalid, exec, results, isRunning, context, parsed, showPath };
      },
   });
</script>

<style lang="postcss" scoped>
   .hidden-paths:hover > .hidden-list {
      min-width: 300px;
      z-index: 1;
      display: block !important;
   }
</style>
