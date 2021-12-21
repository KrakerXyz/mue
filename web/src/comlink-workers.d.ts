
      declare module "comlink:./worker" {
        const mod: () => import("comlink").Remote<typeof import("./src/components/widgets/worker")>
        export default mod
      }

      declare module "comlink:./ws-worker" {
        const mod: () => import("comlink").Remote<typeof import("./src/services/ws-worker")>
        export default mod
      }