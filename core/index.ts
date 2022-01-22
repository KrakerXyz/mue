import { AbstractCursor } from "mongodb";

export type CursorType<T> = T extends AbstractCursor<infer I> ? I : never;
export * from "./RpcService.js";
export * from "./models/index.js";
export * from "./util/index.js";
