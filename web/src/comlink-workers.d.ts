
      declare module "comlink:./ws-worker" {
        const mod: () => import("comlink").Remote<typeof import("./src/services/ws-worker")>
        export default mod
      }