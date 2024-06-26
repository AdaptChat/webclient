import {JSX} from "solid-js";

export default function Messages(props: JSX.SvgSVGAttributes<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" {...props}>
      {/*Font Awesome Pro 6.0.0-alpha2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) */}
      <path d="M416 256.004V63.994C416 28.748 387.25 0 352 0H64C28.75 0 0 28.748 0 63.994V256.004C0 291.25 28.75 320 64 320L96 320.018V374.264C96 382.262 105.125 386.887 111.5 382.139L194.25 320.018L352 319.875C387.25 320 416 291.25 416 256.004ZM576 128H448V256C448 308.871 404.875 351.992 352 351.992H256V383.969C256 419.215 284.75 447.963 320 447.963H445.75L528.5 510.082C534.875 514.832 544 510.207 544 502.209V447.963H576C611.25 447.963 640 419.215 640 383.969V191.994C640 156.748 611.25 128 576 128Z"/>
    </svg>
  )
}