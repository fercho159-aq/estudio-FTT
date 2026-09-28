#!/usr/bin/env python3
"""Genera resumen-primer-parcial.epub a partir del .tex (diagramas como PNG)."""
import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, 'resumen-primer-parcial.tex')
PDF = os.path.join(HERE, 'resumen-primer-parcial.pdf')
EPUB = os.path.join(HERE, 'resumen-primer-parcial.epub')

CSS = """
body { font-family: serif; line-height: 1.5; }
h1 { color: #C2562D; border-bottom: 2px solid #C2562D; padding-bottom: .2em; }
h2 { color: #2F5D8A; margin-top: 1.4em; }
strong { color: #A8431F; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: .92em; }
th, td { border: 1px solid #bbb; padding: .35em .5em; text-align: left; vertical-align: top; }
thead th { background: #F3E6DE; }
blockquote { margin: 1em 0; padding: .6em .9em; border-left: 4px solid #C2562D;
             background: #FBF3EE; }
figure { margin: 1.2em 0; text-align: center; }
figure img { max-width: 100%; height: auto; }
figcaption { font-size: .85em; color: #555; margin-top: .3em; }
code, pre { font-family: monospace; font-size: .85em; }
pre { background: #F4F4F4; border: 1px solid #ddd; padding: .6em .8em; white-space: pre-wrap; }
p.subtitle { font-size: 1.1em; color: #555; }
"""


def balanced(s, i):
    """Devuelve el índice justo después de la llave que cierra la que abre en s[i]."""
    assert s[i] == '{'
    depth = 0
    for j in range(i, len(s)):
        if s[j] == '{':
            depth += 1
        elif s[j] == '}':
            depth -= 1
            if depth == 0:
                return j + 1
    raise ValueError('llaves sin cerrar')


def count_columns(spec):
    out, i = '', 0
    while i < len(spec):
        if spec.startswith('>{', i) or spec.startswith('<{', i):
            i = balanced(spec, i + 1)
        elif spec.startswith('p{', i):
            out += 'p'
            i = balanced(spec, i + 1)
        elif spec[i] in 'lcrLX':
            out += spec[i]
            i += 1
        else:
            i += 1
    return len(out)


def run(cmd, cwd):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.stderr.write(r.stdout[-3000:] + r.stderr[-3000:])
        raise SystemExit(f'Falló: {" ".join(cmd)}')


def main():
    src = open(TEX, encoding='utf8').read()
    preamble, body = src.split(r'\begin{document}', 1)
    body = body.split(r'\end{document}', 1)[0]
    colorlets = '\n'.join(re.findall(r'^\\colorlet.*$', body, re.M))

    work = tempfile.mkdtemp(prefix='epub-')
    img_dir = os.path.join(work, 'img')
    os.makedirs(img_dir)

    # 1) Cada diagrama se compila aparte y se convierte en PNG
    standalone_pre = re.sub(r'\\documentclass(\[.*?\])?\{article\}',
                            r'\\documentclass[border=8pt]{standalone}', preamble)
    standalone_pre = re.sub(r'\\usepackage\[.*?\]\{geometry\}\n', '', standalone_pre)
    standalone_pre = re.sub(r'^\\(pagestyle|fancy|renewcommand\{\\headrulewidth).*$', '',
                            standalone_pre, flags=re.M)
    figures = []
    pattern = re.compile(r'\\begin\{diagrama\}\{')
    pos, n = 0, 0
    pieces = []
    while True:
        m = pattern.search(body, pos)
        if not m:
            pieces.append(body[pos:])
            break
        cap_start = m.end() - 1
        cap_end = balanced(body, cap_start)
        caption = body[cap_start + 1:cap_end - 1]
        end = body.index(r'\end{diagrama}', cap_end)
        content = body[cap_end:end]
        n += 1
        name = f'fig-{n:02d}'
        doc = (standalone_pre + colorlets + '\n\\begin{document}\n' + content +
               '\n\\end{document}\n')
        with open(os.path.join(work, name + '.tex'), 'w', encoding='utf8') as f:
            f.write(doc)
        run(['pdflatex', '-interaction=nonstopmode', '-halt-on-error', name + '.tex'], work)
        run(['pdftocairo', '-png', '-singlefile', '-r', '200', name + '.pdf',
             os.path.join(img_dir, name)], work)
        pieces.append(body[pos:m.start()])
        pieces.append('\n\\begin{figure}\n\\centering\n'
                      f'\\includegraphics{{img/{name}.png}}\n'
                      f'\\caption{{{caption}}}\n\\end{{figure}}\n')
        pos = end + len(r'\end{diagrama}')
        figures.append(name)
    body = ''.join(pieces)

    # 2) Adaptar el LaTeX a lo que Pandoc entiende
    body = re.sub(r'\\begin\{titlepage\}.*?\\newpage', '', body, flags=re.S)
    boxes = {'truco': 'Truco para recordar:', 'aviso': 'Revisa con tus apuntes:', 'nota': ''}
    for env, title in boxes.items():
        head = f'\\begin{{quote}}\\textbf{{{title}}} ' if title else '\\begin{quote}'
        body = body.replace(f'\\begin{{{env}}}', head).replace(f'\\end{{{env}}}', '\\end{quote}')
    def json_block(m):
        t = m.group(1).replace(r'\small', '').replace(r'\ttfamily', '')
        t = t.replace(r'\hspace*{1em}', '  ').replace(r'\hspace*{2em}', '    ')
        t = t.replace(r'\{', '{').replace(r'\}', '}').replace('\\\\', '')
        lines = [ln.rstrip() for ln in t.strip().splitlines() if ln.strip()]
        return '\\begin{verbatim}\n' + '\n'.join(lines) + '\n\\end{verbatim}'
    body = re.sub(r'\\begin\{tcolorbox\}\[[^\]]*\](.*?)\\end\{tcolorbox\}', json_block, body,
                  flags=re.S)

    out, i = [], 0
    while True:
        j = body.find(r'\begin{tabularx}{\linewidth}{', i)
        if j < 0:
            out.append(body[i:])
            break
        spec_start = j + len(r'\begin{tabularx}{\linewidth}')
        spec_end = balanced(body, spec_start)
        cols = count_columns(body[spec_start + 1:spec_end - 1])
        out.append(body[i:j] + r'\begin{tabular}{' + 'l' * cols + '}')
        i = spec_end
    body = ''.join(out).replace(r'\end{tabularx}', r'\end{tabular}')
    body = re.sub(r'\\needspace\{[^}]*\}', '', body)

    macros = r'\newcommand{\clave}[1]{\textbf{#1}}' + '\n'
    epub_tex = os.path.join(work, 'resumen.tex')
    with open(epub_tex, 'w', encoding='utf8') as f:
        f.write('\\documentclass{article}\n' + macros + '\\begin{document}\n' + body +
                '\n\\end{document}\n')
    with open(os.path.join(work, 'estilo.css'), 'w', encoding='utf8') as f:
        f.write(CSS)

    # 3) Portada a partir de la primera página del PDF
    run(['pdftocairo', '-png', '-singlefile', '-f', '1', '-l', '1', '-scale-to', '1600',
         PDF, os.path.join(work, 'portada')], work)

    run(['pandoc', 'resumen.tex', '-f', 'latex', '-t', 'epub3', '-o', EPUB,
         '--toc', '--toc-depth=2', '--number-sections', '--split-level=1',
         '--css', 'estilo.css', '--epub-cover-image', 'portada.png',
         '--resource-path', work,
         '--metadata', 'title=Sistemas Operativos — Resumen para el Primer Parcial',
         '--metadata', 'subtitle=Ing. Ángel Isidro Mercado · Facultad de Ingeniería, UNAM · Grupo 01',
         '--metadata', 'lang=es-MX'], work)
    shutil.rmtree(work)
    print(f'{EPUB} ({len(figures)} diagramas)')


if __name__ == '__main__':
    main()
