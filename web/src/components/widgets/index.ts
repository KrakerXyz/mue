import { WidgetName } from '@core/models';
import { Component } from 'vue';
import CollectionsVue from './collections/Collections.vue';
import ConnectionsVue from './Connections.vue';
import CopyVue from './Copy.vue';
import DatabasesVue from './Databases.vue';
import QueryVue from './Query.vue';
import WorkspacesVue from './Workspaces.vue';

type WidgetComponentName = `v-${WidgetName}`;
export const widgetComponents: Record<WidgetComponentName, Component> = {
   'v-connections': ConnectionsVue,
   'v-databases': DatabasesVue,
   'v-collections': CollectionsVue,
   'v-query': QueryVue,
   'v-workspaces': WorkspacesVue,
   'v-copy': CopyVue,
};
