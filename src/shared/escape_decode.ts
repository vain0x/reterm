// エスケープシーケンスを解釈する。
// 参考: https://en.wikipedia.org/wiki/ANSI_escape_code

// ちゃんとやるには xterm.js の実装を参考にした方がよい。
// エスケープシーケンスのパーサ:
// https://github.com/xtermjs/xterm.js/tree/master/src/common/parser/EscapeSequenceParser.ts
// 色のテーブルなど:
// https://github.com/xtermjs/xterm.js/blob/master/src/browser/ColorManager.ts

// いまのところ、とりあえず動かすために、よくあるエスケープシーケンスだけ処理している。

type OutputItem =
  { kind: "verbatim", text: string }
  | { kind: "newline" }
  | { kind: "reset" }
  | { kind: "foreground", color: string }
  | { kind: "background", color: string }

// 具体的な色は color.css で指定する。
const foregroundColors = new Map([
  [30, "black"],
  [31, "red"],
  [32, "green"],
  [33, "yellow"],
  [34, "blue"],
  [35, "magenta"],
  [36, "cyan"],
  [37, "white"],
  [90, "bright-black"],
  [91, "bright-red"],
  [92, "bright-green"],
  [93, "bright-yellow"],
  [94, "bright-blue"],
  [95, "bright-magenta"],
  [96, "bright-cyan"],
  [97, "bright-white"],
])

const backgroundColors = new Map([
  [40, "black"],
  [41, "red"],
  [42, "green"],
  [43, "yellow"],
  [44, "blue"],
  [45, "magenta"],
  [46, "cyan"],
  [47, "white"],
  [100, "bright-black"],
  [101, "bright-red"],
  [102, "bright-green"],
  [103, "bright-yellow"],
  [104, "bright-blue"],
  [105, "bright-magenta"],
  [106, "bright-cyan"],
  [107, "bright-white"],
])

export const decodeEscapeSequence = (input: string): OutputItem[] => {
  const outputs: OutputItem[] = []
  let i = 0

  const pushVerbatim = (end: number): void => {
    if (i < end) {
      for (const { text, index } of input
        .substring(i, end)
        .split(/\r?\n/)
        .map((text, index) => ({ text, index }))
      ) {
        if (index !== 0) {
          outputs.push({ kind: "newline" })
        }

        outputs.push({ kind: "verbatim", text })
      }
    }

    i = end
  }

  while (true) {
    // エスケープシーケンス全体の範囲: el..er
    const el = input.indexOf("\x1b[", i)
    if (el < 0) {
      break
    }

    // エスケープシーケンスのパラメータの範囲: pl..pr
    const pl = el + "\x1b[".length
    const pr = input.indexOf("m", pl)
    if (pr < 0) {
      break
    }
    const er = pr + 1

    pushVerbatim(el)

    for (const param of input.substring(pl, pr).split(";")) {
      if (param === "") {
        outputs.push({ kind: "reset" })
        continue
      }

      const n = parseInt(param, 10)
      if (!Number.isNaN(n)) {
        if (n == 0) {
          outputs.push({ kind: "reset" })
          continue
        }

        let color = foregroundColors.get(n)
        if (color != null) {
          outputs.push({ kind: "foreground", color })
          continue
        }

        color = backgroundColors.get(n)
        if (color != null) {
          outputs.push({ kind: "background", color })
          continue
        }
      }

      // console.log("unknown escape sequence param", param)
      continue
    }

    i = er
  }

  pushVerbatim(input.length)
  return outputs
}
