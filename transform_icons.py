import os
import re

SVG_START_TAG = re.compile(r"(\<svg[^>]*)(?!/)\>")

def transform_icon(filename: str) -> None:
    with open(f'./_transform/{filename}', 'r') as f:
        transformed_name = ''.join(s.capitalize() for s in filename.removesuffix('.svg').split('-'))

        with open(f'./src/components/icons/svg/{transformed_name}.tsx', 'w') as out:
            content = f.read() \
                .replace('<!--!', '      \n      {/*') \
                .replace('-->', '*/}\n      ') \
                .replace('</svg>', '\n    </svg>')
            content = SVG_START_TAG.sub(r"\1 {...props}>", content)
            out.write(f'''import {{JSX}} from "solid-js";

export default function {transformed_name}(props: JSX.SvgSVGAttributes<SVGSVGElement>) {{
  return (
    {content}
  )
}}''')

if __name__ == '__main__':
   for filename in os.listdir('./_transform'):
       transform_icon(filename)
       os.remove(f'./_transform/{filename}')
