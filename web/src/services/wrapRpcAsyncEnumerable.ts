
export async function* wrapRpcAsyncEnumerable<T>(rpcGen: AsyncGenerator<T>): AsyncGenerator<T> {
   for await(const item of rpcGen) {
      yield item;
   }
}