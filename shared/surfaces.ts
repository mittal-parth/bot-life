export type SurfaceService = "gmail" | "github";
export type SurfaceDelivery = {
  id: string;
  title: string;
  at: number;
  botId: string;
};
export type SurfaceState = {
  connected: boolean;
  pending: boolean;
  watches: { name: string; enabled: boolean; problem?: string }[];
  deliveries: SurfaceDelivery[];
};
export type SurfaceSnapshot = {
  configured: boolean;
  feeds: boolean;
  feedMessage: string;
  byService: Record<SurfaceService, SurfaceState>;
};
export type SurfaceCatalog = {
  accounts: { id: string; alias?: string }[];
  events: {
    event: string;
    name: string;
    fields: {
      name: string;
      type: string;
      description: string;
      required: boolean;
    }[];
  }[];
};
