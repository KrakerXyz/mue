import { RpcService } from '../../../core/index.js';
import { WorkspaceServices } from './index.js';
import * as rpcServices from './rpcService/index.js';

const verbose = true;

const debug = (msg: string) => {
   if (!verbose) {
      return;
   }
   console.debug(msg);
};

export function createRpcService(services: WorkspaceServices): RpcService {
   const serviceMethods = Object.values(rpcServices).map((s) => s(services, debug));
   const merged = serviceMethods.reduce((p, c) => Object.assign(p, c), {});
   return merged as RpcService;
}
