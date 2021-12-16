import { Component } from 'vue';
import ArrayValueVue from './ArrayValue.vue';
import BooleanValueVue from './BooleanValue.vue';
import NullValueVue from './NullValue.vue';
import NumberValueVue from './NumberValue.vue';
import ObjectValueVue from './ObjectValue.vue';
import StringValueVue from './StringValue.vue';

export type ValueType = 'v-string-value' | 'v-object-value' | 'v-array-value' | 'v-number-value' | 'v-boolean-value' | 'v-null-value';

export const valueVues: Record<ValueType, Component> = {
   'v-object-value': ObjectValueVue,
   'v-string-value': StringValueVue,
   'v-number-value': NumberValueVue,
   'v-boolean-value': BooleanValueVue,
   'v-array-value': ArrayValueVue,
   'v-null-value': NullValueVue
};

export function getValueType(value: any): ValueType {

   if (value === null) {
      return 'v-null-value';
   }

   if (Array.isArray(value)) {
      return 'v-array-value';
   }

   const type = typeof value;

   if (type === 'string') {
      return 'v-string-value';
   }

   if (type === 'symbol' || type === 'function') {
      return 'v-string-value';
   }

   if (type === 'number' || type === 'bigint') {
      return 'v-number-value';
   }

   if (type === 'boolean') {
      return 'v-boolean-value';
   }

   if (type === 'undefined') {
      return 'v-null-value';
   }

   if (type === 'object') {
      return 'v-object-value';
   }

   return type as never;
}