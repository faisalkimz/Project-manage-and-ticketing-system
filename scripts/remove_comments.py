"""Remove comments from source files, preserving docstrings and license/utility directives.

This script:
- Removes non-directive single-line and block comments from Python, JS/JSX, CSS, and HTML.
- Preserves comments containing keywords like 'noqa', 'pragma', 'pylint', 'eslint', 'license', '@preserve', '@type', etc.
- Skips common vendor/build directories (node_modules, venv, .venv, dist, build, __pycache__).

Usage: python scripts/remove_comments.py
"""

from pathlib import Path 
import tokenize 
import io 
import re 
import sys 

repo_root =Path (__file__ ).resolve ().parents [1 ]


PY_GLOBS =['**/*.py']
JS_GLOBS =['**/*.js','**/*.jsx']
CSS_GLOBS =['**/*.css']
HTML_GLOBS =['**/*.html']


PRESERVE_PATTERNS =['noqa','pragma','pylint','coding','type:','eslint','license','copyright','@license','@preserve','@type']
preserve_regex =re .compile ('|'.join (re .escape (p )for p in PRESERVE_PATTERNS ),re .I )

EXCLUDED_DIRS ={'node_modules','venv','.venv','dist','build','__pycache__'}

single_line_comment_re =re .compile (r"(?<!:)//.*")
block_comment_re =re .compile (r"/\*[\s\S]*?\*/")
jsx_comment_re =re .compile (r"/\*\{[\s\S]*?\}\*/|\{\s*/\*[\s\S]*?\*/\s*\}")
html_comment_re =re .compile (r"<!--([\s\S]*?)-->")


def is_excluded (path :Path )->bool :
    parts ={p .lower ()for p in path .parts }
    return bool (parts &EXCLUDED_DIRS )


def should_preserve_comment (comment_text :str )->bool :
    return bool (preserve_regex .search (comment_text ))


def process_python_file (path :Path )->bool :
    if is_excluded (path ):
        return False 
    src =path .read_text (encoding ='utf-8')
    try :
        tokens =list (tokenize .generate_tokens (io .StringIO (src ).readline ))
    except Exception :
        return False 
    new_tokens =[]
    for tok_type ,tok_string ,start ,end ,line in tokens :
        if tok_type ==tokenize .COMMENT :
            if should_preserve_comment (tok_string ):
                new_tokens .append ((tok_type ,tok_string ))
            else :

                continue 
        else :
            new_tokens .append ((tok_type ,tok_string ))
    try :
        new_src =tokenize .untokenize (new_tokens )
    except Exception :
        return False 
    if new_src !=src :
        path .write_text (new_src ,encoding ='utf-8')
        return True 
    return False 


def process_js_like_file (path :Path )->bool :
    if is_excluded (path ):
        return False 
    src =path .read_text (encoding ='utf-8')
    orig =src 


    def jsx_repl (m ):
        text =m .group (0 )
        if should_preserve_comment (text ):
            return text 
        return ''
    src =jsx_comment_re .sub (jsx_repl ,src )


    def block_repl (m ):
        text =m .group (0 )
        if should_preserve_comment (text ):
            return text 
        return ''
    src =block_comment_re .sub (block_repl ,src )


    def single_repl (m ):
        text =m .group (0 )
        if '://'in text :
            return text 
        if should_preserve_comment (text ):
            return text 
        return ''
    src =single_line_comment_re .sub (single_repl ,src )

    if src !=orig :
        path .write_text (src ,encoding ='utf-8')
        return True 
    return False 


def process_css_file (path :Path )->bool :
    if is_excluded (path ):
        return False 
    src =path .read_text (encoding ='utf-8')
    orig =src 
    def block_repl (m ):
        text =m .group (0 )
        if should_preserve_comment (text ):
            return text 
        return ''
    src =block_comment_re .sub (block_repl ,src )
    if src !=orig :
        path .write_text (src ,encoding ='utf-8')
        return True 
    return False 


def process_html_file (path :Path )->bool :
    if is_excluded (path ):
        return False 
    src =path .read_text (encoding ='utf-8')
    orig =src 
    def html_repl (m ):
        text =m .group (1 )
        if should_preserve_comment (text ):
            if '<'in text or '\n'in text :
                return f"<!--{text }-->\n"
            return f"<!--{text }-->"
        return ''
    src =html_comment_re .sub (html_repl ,src )
    if src !=orig :
        path .write_text (src ,encoding ='utf-8')
        return True 
    return False 


def main ():
    changed_files =[]

    for glob in PY_GLOBS :
        for p in repo_root .rglob (glob ):
            if not p .is_file ():
                continue 
            if p .suffix =='.py':
                try :
                    if process_python_file (p ):
                        changed_files .append (str (p .relative_to (repo_root )))
                except Exception as e :
                    print (f"Failed to process {p }: {e }")


    for glob in JS_GLOBS :
        for p in repo_root .rglob (glob ):
            if not p .is_file ():
                continue 
            if p .suffix in ('.js','.jsx'):
                try :
                    if process_js_like_file (p ):
                        changed_files .append (str (p .relative_to (repo_root )))
                except Exception as e :
                    print (f"Failed to process {p }: {e }")


    for glob in CSS_GLOBS :
        for p in repo_root .rglob (glob ):
            if not p .is_file ():
                continue 
            if p .suffix =='.css':
                try :
                    if process_css_file (p ):
                        changed_files .append (str (p .relative_to (repo_root )))
                except Exception as e :
                    print (f"Failed to process {p }: {e }")


    for glob in HTML_GLOBS :
        for p in repo_root .rglob (glob ):
            if not p .is_file ():
                continue 
            if p .suffix =='.html':
                try :
                    if process_html_file (p ):
                        changed_files .append (str (p .relative_to (repo_root )))
                except Exception as e :
                    print (f"Failed to process {p }: {e }")

    print ("Files changed:")
    for f in changed_files :
        print (f )
    print (f"Total changed: {len (changed_files )}")

if __name__ =='__main__':
    main ()


