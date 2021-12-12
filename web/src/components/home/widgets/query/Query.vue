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
               <textarea class="form-control font-monospace" :class="{ 'is-invalid': invalid }" v-model="queryString" spellcheck="false"></textarea>
            </div>
            <div class="col-auto">
               <button class="btn btn-primary h-100" @click="exec()" :disabled="invalid || isRunning">Run</button>
            </div>
         </div>
      </template>
      <template #body v-if="results">
         <div class="h-100 d-flex flex-column">
            <div class="row m-2">
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
                  <span role="button" @click="showFields()"><i class="fal fa-eye"></i> {{ context.hidePaths.length }} hidden fields</span>
               </div>
            </div>
            <div class="list-group flex-grow-1 overflow-auto">
               <div class="list-group-item" v-for="r of results" :key="r.id">
                  <object-value :value="r" :context="context"></object-value>
               </div>
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
   import { ObjectValue, ResultContext } from './ResultObjects';
   import ObjectValueVue from './ObjectValue.vue';

   export default defineComponent({
      components: {
         WorkspaceWidget,
         'object-value': ObjectValueVue,
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

            isRunning.value = true;
            const obs = ws.subscribe(parsed.value);

            sub = obs.subscribe((d) => {
               for (const r of d.results) {
                  const v = new ObjectValue(r);
                  results.value.push(v);
               }
               if (d.complete) {
                  isRunning.value = false;
               }
            });
         };

         const context: ResultContext = reactive({
            hideEmpty: false,
            expandAll: false,
            hidePaths: [],
            ...(props.resultContext ?? {}),
         });

         const showFields = () => {
            context.hidePaths = [];
         };

         watch(
            context,
            (c) => {
               emit('update-props', { resultContext: c });
            },
            { deep: true }
         );

         onUnmounted(() => sub?.unsubscribe());

         if (!invalid.value) {
            exec();
         }

         return { queryString, invalid, exec, results, isRunning, context, parsed, showFields };
      },
   });
</script>
