# awesome-tree-sitter [![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

A curated list of Tree-sitter resources, tools, and learning material.

> Pull requests welcome! Please keep entries succinct, sorted, and in the most fitting section.

## Contents
- [Overview](#overview)
- [Official Resources](#official-resources)
- [Install Tree-sitter](#install-tree-sitter)
- [Parsers](#parsers)
- [Bindings](#bindings)
- [Editors](#editors)
- [Tools](#tools)
- [Tutorials](#tutorials)
- [Playgrounds](#playgrounds)
- [Articles](#articles)
- [Research](#research)
- [Talks](#talks)
- [Contributing](#contributing)

## Overview
Tree-sitter is an incremental parsing system that produces concrete syntax trees suitable for fast syntax highlighting, code navigation, refactoring, and structural search.

## Official Resources
- Website: https://tree-sitter.github.io/tree-sitter/ — project home, docs, news.
- Playground: https://tree-sitter.github.io/tree-sitter/playground — inspect parse trees in the browser.
- Documentation: https://tree-sitter.github.io/tree-sitter/using-parsers — parser usage guide.

## Install Tree-sitter
- CLI installation: https://tree-sitter.github.io/tree-sitter/creating-parsers#installation — build and install from source.
- Package manager: https://github.com/tspm-io/tspm — install grammars and the CLI via a package manager.

## Parsers
- Official parser list: https://tree-sitter.github.io/tree-sitter/#available-parsers — maintained grammars with docs.
- Community grammars: https://github.com/tree-sitter/tree-sitter/wiki/Parsers — additional language support.

## Bindings
- JavaScript / TypeScript: https://github.com/tree-sitter/node-tree-sitter — Node.js bindings.
- Rust: https://docs.rs/tree-sitter — Rust crate for parsers.
- Python: https://github.com/tree-sitter/py-tree-sitter — Python bindings.
- Go: https://github.com/smacker/go-tree-sitter — Go bindings.

## Editors
- Emacs: https://emacs-tree-sitter.github.io/ — Tree-sitter integration and modes.
- Helix: https://github.com/helix-editor/helix — modal editor using Tree-sitter everywhere.
- Lapce: https://lapce.dev/ — fast code editor with Tree-sitter highlighting.
- Monaco: https://github.com/Menci/monaco-tree-sitter — Tree-sitter for the Monaco editor.
- NeoVim: https://github.com/nvim-treesitter/nvim-treesitter — Treesitter core (docs: https://neovim.io/doc/user/treesitter.html).
- Pulsar: https://pulsar-edit.dev/ — Atom community fork with Tree-sitter support.
- Zed: https://zed.dev/ — collaborative editor built on Tree-sitter.

## Tools
- Analysis / navigation: https://github.com/microsoft/vscode-anycode — VS Code language features without servers.
- Analysis / navigation: https://github.com/BloopAI/bloop/tree/main/server/bleep/src/intelligence — semantic search backed by Tree-sitter.
- Analysis / navigation: https://github.com/bstee615/tree-climber — structural code analysis.
- Analysis / navigation: https://github.com/zizmorcore/zizmor — static analysis via Tree-sitter.
- Code highlighting: https://github.com/bearcove/arborium — Tree-sitter powered syntax colors.
- Code manipulation: https://github.com/mizlan/iswap.nvim — swap nodes in NeoVim.
- Code manipulation: https://github.com/nvim-treesitter/nvim-treesitter-textobjects — text objects from syntax nodes.
- Code manipulation: https://github.com/mfussenegger/nvim-treehopper — leap through syntax nodes.
- Code manipulation: https://github.com/haritkapadia/ts-movement — navigate code by syntax units.
- Code manipulation: https://github.com/junyi-hou/tree-sitter-fold — folding driven by parse trees.
- Code manipulation: https://github.com/ethan-leba/tree-edit/ — structural editing via Tree-sitter.
- Conflict merge: https://mergiraf.org/ — semantic merge tool.
- Diff: https://difftastic.wilfred.me.uk/ — syntax-aware diff viewer.
- Diff: https://github.com/afnanenayet/diffsitter — Tree-sitter based diffing.
- Documentation: https://github.com/sourcegraph/doctree — docs explorer using parse trees.
- Formatting: https://topiary.tweag.io/ — formatter built on Tree-sitter grammars.
- Graphs and relations: https://github.com/tree-sitter/tree-sitter-graph — graph queries over syntax trees.
- Graphs and relations: https://github.blog/2021-12-09-introducing-stack-graphs/ — stack graph overview.
- Search / lint: https://ast-grep.github.io/ — structural search and rewrite.
- Search / lint: https://github.com/BrianHicks/tree-grepper — grep syntax nodes.
- Search / lint: https://github.com/maxbrunsfeld/tree-tags — ctags generated from parse trees.
- Secrets / security: https://github.com/mongodb/kingfisher — secret scanning via Tree-sitter.
- Secrets / security: https://github.com/PurCL/RepoAudit — static analysis with Tree-sitter.
- Secrets / security: https://github.com/trailofbits/buttercup — security-oriented parsing.
- Secrets / security: https://github.com/noperator/slice — SAST using Tree-sitter queries.
- Secrets / security: https://semgrep.dev/ — pattern-based SAST.
- Source code representation: https://github.com/IBM/tree-sitter-codeviews — code views from syntax trees.

## Tutorials
- Tree-sitter basics: https://siraben.dev/2022/03/01/tree-sitter — intro and examples.
- Q&A collection: https://github.com/sogaiu/ts-questions — common questions and answers.

## Playgrounds
- Arborium highlighting playground: https://arborium.bearcove.eu/ — preview syntax colors.
- AST-grep playground: https://ast-grep.github.io/playground.html — test structural queries.
- Official playground: https://tree-sitter.github.io/tree-sitter/playground — inspect grammar outputs.
- TSPM playground: https://tspm.io/ — browse grammars and examples.

## Articles
- Building a linter with Tree-sitter: https://siraben.dev/2022/03/22/tree-sitter-linter.html — hands-on linter walkthrough.
- Limitations and considerations: https://blog.jez.io/tree-sitter-limitations/ — trade-offs and pitfalls.
- Pattern matching deep dive (AST-grep): https://medium.com/better-programming/deep-dive-into-ast-greps-pattern-7efc3eefc7c3 — pattern semantics.
- Tooling for tooling: https://uptointerpretation.com/posts/tooling-for-tooling/#fn:2 — Tree-sitter context in tooling.

## Research
- Incremental re-parse: https://dl.acm.org/doi/fullHtml/10.1145/3487019.3487022 — original paper on incremental parsing.
- Customized source code representations: https://arxiv.org/abs/2307.04693 — Tree-sitter based embeddings.

## Talks
- Tree-sitter beyond syntax highlighting (EmacsConf 2022): https://emacsconf.org/2022/talks/treesitter/ — overview of advanced uses.

## Contributing
Please ensure new entries follow the [Awesome list guidelines](https://github.com/sindresorhus/awesome/blob/main/pull_request_template.md) and the [awesome manifesto](https://github.com/sindresorhus/awesome/blob/main/awesome.md): include only recommendable resources, keep descriptions brief, choose the best section, sort alphabetically, and avoid duplicates. PRs welcome.
