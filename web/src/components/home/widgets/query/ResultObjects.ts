import { v4 } from 'uuid';
import { markRaw } from 'vue';
import ArrayValueVue from './ArrayValue.vue';
import ObjectValueVue from './ObjectValue.vue';

export interface ResultContext {
   hideEmpty: boolean;
   expandAll: boolean;
}

export class ObjectValue {

   public readonly type = 'object';
   public readonly component = markRaw(ObjectValueVue);

   constructor(public readonly result: Record<string, any>, public readonly parent?: Field) {

      this.id = result['_id'] ?? v4();

      this.fields = [];
      for (const key of Object.getOwnPropertyNames(result)) {
         this.fields.push(new Field(key, result[key], this));
      }

      this.formatted = '';
      this.formattedJson = '';
      for (let i = 0; i < Math.min(20, this.fields.length); i++) {
         const f = this.fields[i];
         this.formatted += `${this.formatted ? ' ' : ''}${f.key}:${f.value.formatted}`;

         let json = f.value.formattedJson;
         if (json.length > 70) {
            const lastChar = json[json.length - 1];
            json = `${json.substring(0, 50)}...`;
            if (lastChar === '}' || lastChar === ']') { json += ' ' + lastChar; }
         }
         this.formattedJson += `, ${f.key}: ${json}`;
      }
      this.formattedJson = '{ ' + this.formattedJson.substring(2) + ' }';
   }

   public readonly fields: Field[];

   public readonly formatted: string;
   public readonly formattedJson: string;

   public readonly id: string;

   public readonly state = {
      expanded: false
   };

}

type FieldValue = StringValue | ObjectValue | NumberValue | BooleanValue | ArrayValue;

export class Field {

   public constructor(public readonly key: string, v: any, public readonly parent: ObjectValue) {
      this.value = createValue(v, this);
   }

   public readonly value: FieldValue;

}

function createValue(v: any, parent: Field): FieldValue {
   const type = typeof v;

   if (type === 'string') {
      return new StringValue(v, parent);
   }

   if (type === 'number' || type === 'bigint') {
      return new NumberValue(v, parent);
   }

   if (Array.isArray(v)) {
      return new ArrayValue(v, parent);
   }

   if (type === 'object') {
      return new ObjectValue(v, parent);
   }

   if (type === 'boolean') {
      return new BooleanValue(v, parent);
   }

   console.error(`Unknown value type for ${v}`);
   return undefined as any;

}

export class StringValue {

   public readonly type = 'string';
   public readonly component = null;

   public constructor(public readonly value: string, public readonly parent: Field) {
   }

   public get formatted() { return this.value; }
   public get formattedJson() { return `'${this.value}'`; }

}

export class NumberValue {
   public readonly type = 'number';
   public readonly component = null;

   public constructor(public readonly value: number, public readonly parent: Field) {
      this.formatted = value.toLocaleString();
   }

   public readonly formatted: string;
   public get formattedJson() { return this.formatted; }
}

export class BooleanValue {
   public readonly type = 'boolean';
   public readonly component = null;

   public constructor(public readonly value: boolean, public readonly parent: Field) {
      this.formatted = value.toString();
   }

   public readonly formatted: string;
   public get formattedJson() { return this.formatted; }

}

export class ArrayValue {
   public readonly type = 'array';
   public readonly component = markRaw(ArrayValueVue);

   public constructor(public readonly value: any[], public readonly parent: Field) {
      this.values = value.map(v => createValue(v, parent));
      this.formatted = this.values.map(v => v.formatted).join(', ');
      this.formattedJson = `[ ${this.values.map(v => v.formattedJson).join(', ')} ]`;
   }

   public readonly values: FieldValue[];

   public readonly formatted: string;
   public readonly formattedJson: string;

   public readonly state = {
      expanded: false
   };
}