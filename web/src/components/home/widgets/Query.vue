<template>
   <workspace-widget>
      <template #header>
         <div class="row g-2">
            <div class="col-auto">
               <i class="fal fa-list fa-fw"></i>
            </div>
            <div class="col fw-bold">
               {{ database }}
            </div>
            <div class="col-auto">
               <span class="badge bg-primary">{{ connection }}</span>
            </div>
         </div>
      </template>
      <template #body>
         <div class="row g-0">
            <div class="col">
               <textarea class="form-control font-monospace" :class="{ 'is-invalid': invalid }" v-model="queryString" spellcheck="false"></textarea>
            </div>
            <div class="col-auto" v-if="!invalid">
               <button class="btn btn-primary h-100" @click="exec()">E</button>
            </div>
         </div>
      </template>
   </workspace-widget>
</template>

<script lang="ts">
   import { useWs } from '@/services';
   import { Document, QuerySubscription } from '@core/subscriptions';
   import { computed, defineComponent, onUnmounted, reactive, ref } from 'vue';
   import WorkspaceWidget from '../WorkspaceWidget.vue';

   export default defineComponent({
      components: {
         WorkspaceWidget,
      },
      props: {
         connection: { type: String, required: true },
         database: { type: String, required: true },
         collection: { type: String },
      },
      setup(props) {
         const ws = useWs();

         const queryString = ref<string>(`db.getCollection('${props.collection}').find({})`);

         const parsed = computed(() => {
            const match = /^db\.getCollection\('(.+)'\)\.(find|aggregate)\(((?:\{|\[).*(?:\}|\]))\)$/.exec(
               queryString.value.replaceAll('\r', '').replaceAll('\n', '')
            );
            if (!match?.length) {
               return;
            }

            let query: Document | Document[] | undefined;
            try {
               query = JSON.parse(match[3]) as Document | Document[];
            } catch {
               //
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

         const invalid = computed(() => !parsed.value);

         let results = ref<Record<string, any>[]>(reactive([]));
         // eslint-disable-next-line no-undef
         let sub: ZenObservable.Subscription | null = null;
         const exec = () => {
            if (sub) {
               sub.unsubscribe();
               sub = null;
            }
            if (!parsed.value) {
               return;
            }
            results.value = reactive([]);

            const obs = ws.subscribe(parsed.value);

            sub = obs.subscribe((d) => {
               results.value.push(...d.results);
            });
         };

         onUnmounted(() => sub?.unsubscribe());

         return { queryString, invalid, exec };
      },
   });
</script>
