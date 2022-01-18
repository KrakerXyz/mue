/** Wraps a async enumerable so that Vue trying to add reactive stuff doesn't interfere with the proxy */
export async function* wrapRpcAsyncEnumerable<T>(rpcGen: AsyncGenerator<T>): AsyncGenerator<T> {
   for await (const item of rpcGen) {
      yield item;
   }
}
