import {ComponentProps, onMount, ParentProps, Show} from "solid-js";
import {A} from "@solidjs/router";
import {capitalize} from "../../utils";
import {Gradient} from "whatamesh";

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
          focus:placeholder-accent focus:placeholder-opacity-100 focus:z-10 focus:outline-none sm:text-sm
          motion-reduce:bg-gray-900/100"
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
    const gradient = new Gradient()
    gradient.initGradient('#mesh-gradient')

    window.addEventListener('mouseover', () => gradient.play())
    window.addEventListener('mouseout', () => gradient.pause())
  })

  return (
    <div
      class="flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 motion-reduce:bg-gray-800"
    >
      <canvas
        id="mesh-gradient"
        class="motion-reduce:hidden absolute inset-0 flex flex-grow items-stretch justify-stretch w-full h-full
          opacity-25 select-none pointer-events-none"
      />
      <div class="w-full max-w-md space-y-8 z-10">
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
