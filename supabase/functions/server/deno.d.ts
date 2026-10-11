// Deno and Supabase Edge Function environment declarations for TypeScript IDE language servers

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

declare module "npm:hono" {
  export class Hono<E = any> {
    use(...args: any[]): this;
    get(path: string, ...handlers: any[]): this;
    post(path: string, ...handlers: any[]): this;
    put(path: string, ...handlers: any[]): this;
    delete(path: string, ...handlers: any[]): this;
    fetch: (req: Request) => Response | Promise<Response>;
  }
  export interface Context<E = any> {
    req: {
      param: (key?: string) => string;
      query: (key?: string) => string | undefined;
      json: () => Promise<any>;
    };
    var: E extends { Variables: infer V } ? V : Record<string, any>;
    json: (data: any, status?: number) => Response;
    text: (text: string, status?: number) => Response;
  }
}

declare module "npm:hono/cors" {
  export function cors(options?: any): any;
}

declare module "npm:hono/logger" {
  export function logger(fn?: any): any;
}

declare module "npm:@supabase/server@1/adapters/hono" {
  export function withSupabase(options?: { auth?: "user" | "admin" | "optional" }): any;
}

declare module "npm:@supabase/server@1" {
  export interface SupabaseContext {
    supabase: any;
    userClaims: { id: string; email?: string; [key: string]: any };
  }
}

declare module "jsr:@supabase/supabase-js@2.49.8" {
  export function createClient(supabaseUrl?: string, supabaseKey?: string, options?: any): any;
}
