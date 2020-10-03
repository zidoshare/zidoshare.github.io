---
title: ideavim与vim相关笔记
tags:
  - vim
  - ideavim
  - learning
createdDate: '2018-12-19'
updatedDate: '2018-12-19'
draft: false
origin: true
image: header.png
---

> 本文主要用于记录一些使用 vim/ideavim 开发的心得笔记，为了速度也为了折腾
> 强烈的个人向

# 笔记

> ideavim 与 vim 混杂，无序但使用二级标题做大分类，当字典用,默认 vim 和 ideavim 通用，不通用会标记出来

## 文件操作

刷新重载当前打开的文件 `:e`/`:e!`

## 范围操作

某些普通模式的动作命令后面可以追加一些表示范围的指令，表示该动作将作用在整个范围上。这类命令常用的有：

- d<范围> - 删除一定范围内的文本

- c<范围> - 删除一定范围内的文本并进入插入模式

- y<范围> - 将范围内的文本放入 0 号和"号注册栏

- v<范围> - 选择范围内的文本

- =<范围> - 自动缩进范围内的文本

- gU<范围> - 将范围内的字符转换为大写

- gu<范围> - 将范围内的字符转换为小写

- > <范围> - 将范围中的内容缩进一格

- <<范围> - 将范围中的内容取消缩进一格

常用的范围指令有：

空格 - 光标所在位置字符。（例如 gU 空格 - 将光标位置字符转为大写）

重复某些动作命令 - 光标所在行。 （例如 dd 删除一行，yy 复制一行，cc 删除一行文本并开始插入，>> 当前行缩进一格，==自动缩进当前行）

\$ - 从光标位置到行尾

^ - 从光标位置到行首，不包含缩进空白

0 - 从光标位置到行首，包含缩进空白

gg - 从光标位置到文件开头

G - 从光标位置到文件结尾

% - 从光标位置到另一边匹配的括号

f<字符> - 从光标位置到光标右边某个字符首次出现的位置，包括该字符

F<字符> - 从光标位置到光标左边某个字符首次出现的位置，包括该字符

t<字符> - 从光标位置到光标右边某个字符首次出现的位置，包括该字符

F<字符> - 从光标位置到光标左边某个字符首次出现的位置，包括该字符

/正则表达式 - 从光标位置到下一个匹配正则表达式的位置（跨行）

?正则表达式 - 从光标位置到上一个匹配正则表达式的位置（跨行）

aw - 一个单词加一个空格 （a 可理解为“一个”，下同）

iw - 一个单词 （i 可理解为 in，下同）

a" - 一个字符串包括双引号

i" - 一个字符串内部文本

a< - 一组< >包含的文本，包括< >号本身

同理类推： i<, a[, i[, a(, i(

> 注意：真正 vim 中的 it 范围（一对 xml 标签内部）在 ideaVim 中不生效。

## 复制粘贴

用 y 命令将文本存入寄存器后，如果想在别处替换原有内容，可以先用 v 命令选中原有内容，然后用 p 命令粘贴。但第一次粘贴后，默认的寄存器"将被替换为刚刚删除的内容。如果要再次粘贴之前复制的内容，需要使用 "0p 命令组合来复制。也可以进入插入模式后用 Ctrl+r 0 来复制，例如 ciw<Ctrl+r>0 命令组合将用粘贴内容替换光标处的一个单词，并停留在插入模式。

## 重复操作

普通模式下按. （小数点）可重复上一次的修改操作
& - 重复上一次的:s 替换命令
@@ - 重复上一次执行的宏

# vim 配置

```vimrc
execute pathogen#infect() call vundle#begin() call vundle#end() syntax on
execute pathogen#infect()
call vundle#begin()
call vundle#end()
syntax on
" 横竖高亮
set cursorcolumn
set cursorline
filetype plugin indent on
set encoding=utf8
set nu
set rnu
set ruler
set t_Co=256
set cindent
set laststatus=2
set hlsearch
set expandtab
set smartindent

set showmatch
set nocompatible
set tabstop=2
set softtabstop=2
set shiftwidth=2
set autoindent
autocmd StdinReadPre * let s:std_in=1
" autocmd VimEnter * if argc() == 0 && !exists("s:std_in") | NERDTree | endif
map <F3> :NERDTreeToggle<CR>
autocmd bufenter * if (winnr("$") == 1 && exists("b:NERDTree") && b:NERDTree.isTabTree()) | q | endif
" set completeopt=longest,menu	"让Vim的补全菜单行为与一般IDE一致(参考VimTip1228)
autocmd InsertLeave * if pumvisible() == 0|pclose|endif	"离开插入模式后自动关闭预览窗口

" set color for nerd tree
" NERDTress File highlighting
function! NERDTreeHighlightFile(extension, fg, bg, guifg, guibg)
 exec 'autocmd filetype nerdtree highlight ' . a:extension .' ctermbg='. a:bg .' ctermfg='. a:fg .' guibg='. a:guibg .' guifg='. a:guifg
 exec 'autocmd filetype nerdtree syn match ' . a:extension .' #^\s\+.*'. a:extension .'$#'
endfunction
call NERDTreeHighlightFile('jade', 'green', 'none', 'green', '#151515')
call NERDTreeHighlightFile('ini', 'yellow', 'none', 'yellow', '#151515')
call NERDTreeHighlightFile('md', 'blue', 'none', '#3366FF', '#151515')
call NERDTreeHighlightFile('yml', 'yellow', 'none', 'yellow', '#151515')
call NERDTreeHighlightFile('config', 'yellow', 'none', 'yellow', '#151515')
call NERDTreeHighlightFile('conf', 'yellow', 'none', 'yellow', '#151515')
call NERDTreeHighlightFile('json', 'yellow', 'none', 'yellow', '#151515')
call NERDTreeHighlightFile('html', 'yellow', 'none', 'yellow', '#151515')
call NERDTreeHighlightFile('styl', 'cyan', 'none', 'cyan', '#151515')
call NERDTreeHighlightFile('css', 'cyan', 'none', 'cyan', '#151515')
call NERDTreeHighlightFile('coffee', 'Red', 'none', 'red', '#151515')
call NERDTreeHighlightFile('js', 'Red', 'none', '#ffa500', '#151515')
call NERDTreeHighlightFile('php', 'Magenta', 'none', '#ff00ff', '#151515')

```

# ideavim 配置：

```ideavimrc
let mapleader=";"
noremap <leader>k gt
noremap <leader>j gT
noremap <leader>h :action Back<CR>
noremap <leader>l :action Forward<CR>
noremap <leader>v :action VimVisualToggleBlockMode<CR>
noremap <leader>fs :action FileStructurePopup<CR>

noremap <leader>ga :action GotoAction<CR>
noremap <leader>gc :action GotoClass<CR>
noremap <leader>gd :action GotoDeclaration<CR>
noremap <leader>gi :action GotoImplementation<CR>
noremap <leader>gs :action GotoSuperMethod<CR>
noremap <leader>gt :action GotoTest<CR>

noremap / :action Find<CR>
noremap f :action AceAction<CR>
noremap F :action AceTargetAction<CR>
set rnu
set nu
```
