import {ComponentProps, ParentProps, Show} from "solid-js";
import {A} from "@solidjs/router";

export function FormInput({ id, label, ...props }: { label: string } & ComponentProps<'input'>) {
  return (
    <div>
      <label for={id} class="sr-only">
        {label}
      </label>
      <input
        id={id}
        placeholder={label}
        class="relative block w-full appearance-none px-3 py-2 placeholder-white placeholder-opacity-50 bg-gray-900
          focus:placeholder-accent focus:placeholder-opacity-100 focus:z-10 focus:outline-none sm:text-sm"
        {...props}
      />
    </div>
  )
}

export interface Props {
  title: string;
  error?: string;
  switchScreenCondition: string;
  switchScreenLabel: string;
  switchScreenHref: string;
  submitLabel: string;
  submitLabelProgressive: string;
  isSubmitting: boolean;
  redirectTo: string;
  onSubmit(event: SubmitEvent & { target: HTMLFormElement }): void | Promise<void>;
}

export default function Layout(props: ParentProps<Props>) {
  return (
    <div class="flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-md space-y-8">
        <div class="text-center">
          <img class="mx-auto h-12 w-auto" src="/banner-white-fg.svg" alt="Adapt" />
          <h2 class="mt-6 text-3xl font-bold font-title">{props.title}</h2>
          <p class="mt-2 text-sm text-base-content text-opacity-50">
            {props.switchScreenCondition}{' '}
            <A
              href={props.switchScreenHref}
              class="font-medium text-link text-opacity-80 hover:text-opacity-100 transition-all"
              state={{ redirectTo: props.redirectTo }}
            >
              {props.switchScreenLabel}
            </A>
          </p>
          <Show when={props.error} keyed={false}>
            <div class="text-red-500">
              <p class="mt-4 font-bold">Something went wrong!</p>
              <p class="text-sm">
                {props.error!.charAt(0).toUpperCase() + props.error!.slice(1)}
              </p>
            </div>
          </Show>
        </div>
        <form class="flex flex-col mt-8 space-y-6" onSubmit={event => {
          event.preventDefault()
          props.onSubmit(event as any)
        }}>
          {props.children}
          <button
            type="submit"
            class="group relative flex w-full justify-center rounded-md border border-transparent bg-accent py-2 px-4
              text-sm font-medium hover:bg-opacity-80 transition-all focus:outline-none focus:ring-2
              focus:ring-accent focus:ring-offset-2 disabled:opacity-60"
            disabled={props.isSubmitting}
          >
            {props.isSubmitting ? props.submitLabelProgressive : props.submitLabel}
          </button>
        </form>
      </div>
    </div>
  )
}
