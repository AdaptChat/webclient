import { TippyOptions } from 'solid-tippy';

declare global {
  export type Snowflake = number | bigint
}

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      tippy: TippyOptions;
    }
  }
}