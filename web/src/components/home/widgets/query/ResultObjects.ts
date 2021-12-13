import { v4 } from 'uuid';
import { deepFreeze } from '@core/util';

export interface ResultContext {
   sortFields: boolean;
   hideEmpty: boolean;
   expandAll: boolean;
   hidePaths: string[];
   expandedPaths: {
      global: string[],
      /** Expanded paths specific to a record by it's index in the results */
      indexed: Record<number, string[]>
   };
   favorite: boolean;
   locked: boolean;
   results: { created: number, data: Record<string, any>[] } | null;
}

export const defaultResultContext: ResultContext = deepFreeze({
   sortFields: false,
   hideEmpty: false,
   expandAll: false,
   hidePaths: [],
   expandedPaths: { global: [], indexed: {} },
   favorite: false,
   results: null,
   locked: false
});

export class ObjectValue {

   public readonly type = 'object';
   public readonly component = 'v-object-value';
   public readonly root: ObjectValueRoot;

   constructor(public readonly result: Record<string, any>, public readonly parent?: Field) {

      if (this instanceof ObjectValueRoot) {
         this.root = this;
      } else {
         const root = this.parent?.parent.root;
         if (!root) {
            throw new Error('Could not determine root. Are you using ObjectValueRoot for new object?');
         }
         this.root = root;
      }

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

}

export class ObjectValueRoot extends ObjectValue {
   public constructor(public readonly result: Record<string, any>, public index: number, public readonly context: ResultContext) {
      super(result, undefined);
   }
}

type FieldValue = StringValue | ObjectValue | NumberValue | BooleanValue | ArrayValue;

export class Field {

   public constructor(public readonly key: string, v: any, public readonly parent: ObjectValue) {
      this.path = parent.parent?.path ?? '';
      this.path += (this.path ? '.' : '') + key;
      this.value = createValue(v, this);
   }

   public readonly value: FieldValue;

   public readonly path: string;

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
   public readonly component = 'v-array-value';

   public constructor(public readonly value: any[], public readonly parent: Field) {
      this.values = value.map(v => createValue(v, parent));
      this.formatted = this.values.map(v => v.formatted).join(', ');
      this.formattedJson = `[ ${this.values.map(v => v.formattedJson).join(', ')} ]`;
   }

   public readonly values: FieldValue[];

   public readonly formatted: string;
   public readonly formattedJson: string;

}