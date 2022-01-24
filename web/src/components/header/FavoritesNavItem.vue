<template>
   <li class="nav-item position-relative">
      <span class="nav-link"><i class="fas fa-star me-2"></i>Favorites </span>
      <div class="hover d-none position-absolute text-white bg-dark p-2 shadow border-top border-light">
         <h5>Collections</h5>
         <div class="list-group list-group-flush">
            <div class="list-group-item bg-dark text-white border-white" role="button">Placeholder</div>
         </div>
      </div>
   </li>
</template>

<script lang="ts">
   import { WidgetManager } from '@/services';
   import { defineComponent } from 'vue';

   export default defineComponent({
      props: {
         widgetManager: { type: Object as () => WidgetManager, required: true },
      },
      setup() {
         return {};
      },
   });
</script>

<style lang="postcss" scoped>
   .nav-item:hover {
      .border-light {
         border-color: #555 !important;
      }

      & > .hover {
         display: block !important;
         z-index: 1000;
      }
   }
</style>
