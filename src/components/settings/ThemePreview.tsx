import {Rgb, Theme} from "../../client/themes";

export default function ThemePreview(props: { theme: Theme }) {
  const resolve = (color: Rgb) => `rgb(${color.join(', ')})`

  return (
    <svg width="100%" height="100%" viewBox="0 0 900 540" fill="none" preserveAspectRatio="xMaxYMax"  xmlns="http://www.w3.org/2000/svg">
      <g>
        <rect width="900" height="540" rx="50" fill={resolve(props.theme.bg[2])} />
        <g>
          {/* Guild selector */}
          <rect width="207" height="540" fill={resolve(props.theme.bg[0])} />
          {/* Left sidebar (channel list, ) */}
          <rect x="65" width="159" height="540" fill={resolve(props.theme.bg[1])} />
          {/* Members list/right sidebar */}
          <rect x="752" width="148" height="540" fill={resolve(props.theme.bg[1])} />
          <rect x="695" width="158" height="540" fill={resolve(props.theme.bg[1])} />
          <path // chat textarea
            fill={resolve(props.theme.bg[3])}
            d="M280 502C280 495.373 285.373 490 292 490H670C676.627 490 682 495.373 682 502V518C682 524.627 676.627 530
              670 530H292C285.373 530 280 524.627 280 518V502Z"
          />
          <path // chat add attachment "+" button background
            fill={resolve(props.theme.bg[3])}
            d="M234 510C234 498.954 242.954 490 254 490V490C265.046 490 274 498.954 274 510V510C274 521.046 265.046 530
              254 530V530C242.954 530 234 521.046 234 510V510Z"
          />
        </g>
        <g> {/* Guild icons and avatar icons (could this be randomized?) */}
          <circle cx="34" cy="101" r="20" fill="#FF8282" />
          <circle cx="34" cy="153" r="20" fill="#70E248" />
          <circle cx="34" cy="308" r="20" fill="#C4C4C4" />
          <ellipse cx="34" cy="359.5" rx="20" ry="19.5" fill="#9086FF" />
          <circle cx="34" cy="411" r="20" fill="#761E1E" />
          <circle cx="34" cy="463" r="20" fill="white" />
          <ellipse cx="34" cy="204.5" rx="20" ry="19.5" fill="#C172FF" />
          <circle cx="34" cy="256" r="20" fill="#9BF3FF" />
          <circle cx="262" cy="439" r="20" fill="#9BF3FF" />
          <circle cx="262" cy="316" r="20" fill="#9BF3FF" />
          <circle cx="740" cy="48" r="20" fill="#9BF3FF" />
          <circle cx="740" cy="178" r="20" fill="#9BB7FF" />
          <circle cx="262" cy="377" r="20" fill="#50C771" />
          <circle cx="740" cy="113" r="20" fill="#50C771" />
          <circle cx="97" cy="510" r="20" fill="#9BB7FF" />
        </g>
        {/* link */}
        <rect x="405" y="381" width="113" height="16" rx="8" fill={resolve(props.theme.link.default)} />
        <g> {/* text/foreground */}
          <rect x="76" y="11" width="139" height="35" rx="10" stroke={resolve(props.theme.bg[3])} stroke-width="4" />
          <rect x="77" y="63" width="89" height="18" rx="9" fill={resolve(props.theme.fg)} fill-opacity="0.8" />
          <rect x="77" y="95" width="47" height="19" rx="9.5" fill={resolve(props.theme.fg)} fill-opacity="0.8" />
          <rect x="133" y="95" width="58" height="19" rx="9.5" fill={resolve(props.theme.fg)} fill-opacity="0.8" />
          <rect x="77" y="130" width="89" height="18" rx="9" fill={resolve(props.theme.fg)} />
          <rect x="77" y="162" width="68" height="19" rx="9.5" fill={resolve(props.theme.fg)} fill-opacity="0.8" />
          <rect x="293" y="422" width="100" height="15" rx="7.5" fill={resolve(props.theme.fg)} />
          <rect x="293" y="443" width="63" height="16" rx="8" fill={resolve(props.theme.fg)} />
          <rect x="362" y="443" width="45" height="16" rx="8" fill={resolve(props.theme.fg)} />
          <rect x="413" y="443" width="105" height="16" rx="8" fill={resolve(props.theme.fg)} />
          <rect x="398" y="422" width="69" height="15" rx="7.5" fill={resolve(props.theme.fg)} fill-opacity="0.5" />
          <rect x="293" y="299" width="100" height="15" rx="7.5" fill={resolve(props.theme.fg)} />
          <rect x="774" y="30" width="79" height="18" rx="9" fill={resolve(props.theme.fg)} />
          <rect x="774" y="56" width="86" height="14" rx="7" fill={resolve(props.theme.fg)} fill-opacity="0.6" />
          <rect x="124" y="490" width="88" height="18" rx="9" fill={resolve(props.theme.fg)} />
          <rect x="125" y="516" width="47" height="14" rx="7" fill={resolve(props.theme.fg)} fill-opacity="0.6" />
          <rect x="774" y="158" width="88" height="18" rx="9" fill={resolve(props.theme.fg)} />
          <rect x="774" y="184" width="47" height="14" rx="7" fill={resolve(props.theme.fg)} fill-opacity="0.6" />
          <rect x="774" y="120" width="86" height="14" rx="7" fill={resolve(props.theme.fg)} fill-opacity="0.6" />
          <rect x="293" y="320" width="39" height="16" rx="8" fill={resolve(props.theme.fg)} />
          <rect x="339" y="320" width="66" height="16" rx="8" fill={resolve(props.theme.fg)} />
          <rect x="412" y="320" width="19" height="16" rx="8" fill={resolve(props.theme.fg)} />
          <rect x="437" y="320" width="209" height="16" rx="8" fill={resolve(props.theme.fg)} />
          <rect x="398" y="299" width="69" height="15" rx="7.5" fill={resolve(props.theme.fg)} fill-opacity="0.5" />
          <rect x="293" y="360" width="25" height="15" rx="7.5" fill={resolve(props.theme.fg)} />
          <rect x="323" y="360" width="92" height="15" rx="7.5" fill={resolve(props.theme.fg)} />
          <rect x="774" y="95" width="25" height="18" rx="9" fill={resolve(props.theme.fg)} />
          <rect x="803" y="95" width="66" height="18" rx="9" fill={resolve(props.theme.fg)} />
          <rect x="293" y="381" width="63" height="16" rx="8" fill={resolve(props.theme.fg)} />
          <rect x="362" y="381" width="36" height="16" rx="8" fill={resolve(props.theme.fg)} />
          <rect x="525" y="381" width="41" height="16" rx="8" fill={resolve(props.theme.fg)} />
          <rect x="422" y="360" width="69" height="15" rx="7.5" fill={resolve(props.theme.fg)} fill-opacity="0.5" />
          <path
            d="M289.5 510C289.5 504.477 293.977 500 299.5 500H550.5C556.023 500 560.5 504.477 560.5 510V510C560.5
              515.523 556.023 520 550.5 520H299.5C293.977 520 289.5 515.523 289.5 510V510Z"
            fill={resolve(props.theme.fg)}
          />
        </g>
        {/* members list status indicators */}
        <rect x="744" y="55" width="16" height="16" rx="8" fill="#57E877" stroke={resolve(props.theme.bg[1])} stroke-width="4" />
        <rect x="744" y="117" width="16" height="16" rx="8" fill="#57E877" stroke={resolve(props.theme.bg[1])} stroke-width="4" />
        <rect x="744" y="184" width="16" height="16" rx="8" fill="#57E877" stroke={resolve(props.theme.bg[1])} stroke-width="4" />
        {/* left sidebar client user status indicator */}
        <rect x="103" y="515" width="16" height="16" rx="8" fill="#57E877" stroke={resolve(props.theme.bg[1])} stroke-width="4" />
        {/* guild sidebar divider */}
        <rect x="14" y="62" width="40" height="5" rx="2.5" fill={resolve(props.theme.fg)} fill-opacity="0.1" />
        {/* fg vectors */}
        <path
          d="M47.4214 35.9766C47.4214 36.8203 46.707 37.4813 45.8974 37.4813H44.3735L44.4068 44.9906C44.4068 45.1172
            44.3973 45.2437 44.383 45.3703V46.125C44.383 47.1609 43.5306 48 42.4781 48H41.7161C41.6637 48 41.6114 48
            41.559 47.9953C41.4923 48 41.4256 48 41.359 48H39.8112H38.6683C37.6158 48 36.7633 47.1609 36.7633
            46.125V45V42C36.7633 41.1703 36.0823 40.5 35.2394 40.5H32.1915C31.3486 40.5 30.6676 41.1703 30.6676
            42V45V46.125C30.6676 47.1609 29.8151 48 28.7627 48H27.6197H26.1005C26.0291 48 25.9576 47.9953 25.8862
            47.9906C25.8291 47.9953 25.7719 48 25.7148 48H24.9528C23.9003 48 23.0479 47.1609 23.0479
            46.125V40.875C23.0479 40.8328 23.0479 40.7859 23.0526 40.7438V37.4813H21.5239C20.6667 37.4813 20 36.825 20
            35.9766C20 35.5547 20.1429 35.1797 20.4762 34.8516L32.6868 24.375C33.0202 24.0469 33.4011 24 33.7345
            24C34.0679 24 34.4488 24.0938 34.7346 24.3281L46.8975 34.8516C47.2785 35.1797 47.469 35.5547 47.4214
            35.9766Z"
          fill={resolve(props.theme.fg)}
        />
        <path
          d="M252.769 503.231C252.769 502.55 253.319 502 254 502C254.681 502 255.231 502.55 255.231
            503.231V508.769H260.769C261.45 508.769 262 509.319 262 510C262 510.681 261.45 511.231 260.769
            511.231H255.231V516.769C255.231 517.45 254.681 518 254 518C253.319 518 252.769 517.45 252.769
            516.769V511.231H247.231C246.55 511.231 246 510.681 246 510C246 509.319 246.55 508.769 247.231
            508.769H252.769V503.231Z"
          fill={resolve(props.theme.fg)}
        />
      </g>
    </svg>
  )
}
