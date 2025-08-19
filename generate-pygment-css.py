import sys
from pygments.formatters import HtmlFormatter

def generate(name, is_dark=False):
    # formatter = HtmlFormatter(cssclass="highlight", style='github-dark')
    formatter = HtmlFormatter(cssclass="highlight", style=name)
    style_defs = formatter.get_style_defs().replace('\n', '\n\t')
    theme_type = 'dark' if is_dark else 'light'
    return f'// {name}\n\n@mixin syntax-{theme_type} {{\n\t{style_defs}\n}}\n'

def dark(name):
    with open('_sass/syntax-dark.scss', 'w') as f:
        f.write(generate(name, True))

def light(name):
    with open('_sass/syntax-light.scss', 'w') as f:
        f.write(generate(name, False))

light(sys.argv[-2])
dark(sys.argv[-1])
