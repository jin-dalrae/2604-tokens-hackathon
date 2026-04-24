declare module "@tryghost/admin-api" {
  interface GhostAdminAPIOptions {
    url: string;
    key: string;
    version: string;
    ghostPath?: string;
  }
  type GhostPost = { id: string; url: string; [key: string]: unknown };
  type GhostTag = { name: string };
  class GhostAdminAPI {
    constructor(options: GhostAdminAPIOptions);
    posts: {
      add: (
        post: { title: string; html: string; status: string; tags?: GhostTag[] },
        options?: { source?: "html" },
      ) => Promise<GhostPost>;
    };
  }
  export default GhostAdminAPI;
}
