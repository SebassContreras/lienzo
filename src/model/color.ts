/**
 * What counts as a color everywhere a scene or project stores one (069/D1): the forms the
 * canvas parses, so a saved color never breaks the preview. Pure, no DOM.
 */
import { z } from "zod";

const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
/** One argument of `rgb()`/`hsl()` (CSS Color 4): a number with an optional unit, or `none`. */
const ARG = String.raw`(?:[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?(?:%|deg|g?rad|turn)?|none)`;
const FUNCTION = new RegExp(
  String.raw`^(?:rgba?|hsla?)\(\s*${ARG}(?:\s*[,/]?\s*${ARG}){2,3}\s*\)$`,
  "i",
);

/** The CSS named colors (CSS Color 4) and `transparent`. */
const NAMES = new Set(
  (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue " +
    "blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk " +
    "crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki " +
    "darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen " +
    "darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue " +
    "dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite " +
    "gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki " +
    "lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan " +
    "lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen " +
    "lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen " +
    "magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen " +
    "mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream " +
    "mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid " +
    "palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum " +
    "powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown " +
    "seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen " +
    "steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow " +
    "yellowgreen transparent"
  ).split(" "),
);

/** Whether `s` is a CSS color the canvas can parse: hex, `rgb[a]()`/`hsl[a]()` or a name. */
export function isColor(s: string): boolean {
  const v = s.trim();
  return HEX.test(v) || FUNCTION.test(v) || NAMES.has(v.toLowerCase());
}

export const COLOR_MESSAGE =
  "No es un color: usa #rrggbb, rgb()/rgba(), hsl()/hsla() o un nombre CSS (p. ej. «red»)";

/** A stored color, checked with `isColor`. */
export const ColorSchema = z
  .string()
  .refine(isColor, { message: COLOR_MESSAGE });
