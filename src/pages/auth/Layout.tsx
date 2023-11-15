import {ComponentProps, onMount, ParentProps, Show} from "solid-js";
import {A} from "@solidjs/router";
import {capitalize} from "../../utils";

export function FormInput({ id, label, ...props }: { label: string } & ComponentProps<'input'>) {
  return (
    <div>
      <label for={id} class="sr-only">
        {label}
      </label>
      <input
        id={id}
        placeholder={label}
        class="relative block w-full appearance-none px-3 py-2 placeholder-white placeholder-opacity-50 bg-gray-900/70
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
  disableSubmission: () => boolean;
  onSubmit(event: SubmitEvent & { target: HTMLFormElement }): void | Promise<void>;
}

export default function Layout(props: ParentProps<Props>) {
  onMount(() => {
    const w = window.innerWidth
    const h = window.innerHeight
    backgroundRef!.style.backgroundImage = `url('https://source.unsplash.com/random/${w}x${h}/?landscape,night')`
  })

  let backgroundRef: HTMLDivElement | null = null

  return (
    <div
      ref={backgroundRef!}
      class="flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cover"
    >
      <div class="bg-gray-800/60 px-10 py-8 backdrop-blur rounded-lg w-full max-w-md space-y-8 z-10">
        <div class="text-center">
          <a href="https://adapt.chat" class="select-none">
            <img class="mx-auto h-10 w-auto" src="/banner-white-fg.svg" alt="Adapt" />
          </a>
          <h2 class="mt-5 text-3xl font-bold font-title">{props.title}</h2>
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
              <p class="text-sm">{capitalize(props.error!)}</p>
            </div>
          </Show>
        </div>
        <form class="flex flex-col mt-8" onSubmit={event => {
          event.preventDefault()
          props.onSubmit(event as any)
        }}>
          {props.children}
          <button
            type="submit"
            class="group relative flex w-full justify-center rounded-md border border-transparent bg-accent py-2 px-4
              mt-6 text-sm font-medium hover:bg-opacity-80 transition-all focus:outline-none focus:ring-2
              focus:ring-accent focus:ring-offset-2 disabled:opacity-60"
            disabled={props.isSubmitting || props.disableSubmission()}
          >
            {props.isSubmitting ? props.submitLabelProgressive : props.submitLabel}
          </button>
        </form>
      </div>
    </div>
  )
}
