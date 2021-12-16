import { WidgetName } from '@core/models';
import { Component } from 'vue';
import CollectionsVue from './Collections.vue';
import ConnectionsVue from './Connections.vue';
import DatabasesVue from './Databases.vue';
import QueryVue from './Query.vue';

type WidgetComponentName = `v-${WidgetName}`;
export const widgetComponents: Record<WidgetComponentName, Component> = {
   'v-connections': ConnectionsVue,
   'v-databases': DatabasesVue,
   'v-collections': CollectionsVue,
   'v-query': QueryVue
};