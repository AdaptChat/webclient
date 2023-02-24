import * as tippy from "tippy.js";

declare global {
  export type Snowflake = number | bigint
}

declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      tooltip?: string | Partial<tippy.Props>;
    }
  }
}

export {}
