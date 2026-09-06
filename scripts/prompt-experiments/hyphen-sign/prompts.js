// Frozen prompt variants for the hyphen-sign probe. Add a new version when changing measured prompt bytes.
// Keep few-shot examples OUT of cases.json (plan rule: never few-shot from the eval corpus).
//
// To iterate: add a variant to PROMPTS (or edit a gloss), then rerun each backend with
// --variant <name>. Glosses describe readings generically; never name a control shape.

const MARK_OPEN = '«';
const MARK_CLOSE = '»';

export function mark(input, at) {
  return input.slice(0, at) + MARK_OPEN + input[at] + MARK_CLOSE + input.slice(at + 1);
}

const GLOSS_EN = {
  'signed-number': 'it is the minus sign of the number right after it: that number is negative and the sign belongs to it',
  'range-or-separator': 'it stands between two separate items, as a from-to range, a title or label separator, or a dash between parts; the number after it is not negative',
  'unsure': 'the sentence genuinely does not settle it',
};

const GLOSS_ZH = {
  'signed-number': '它是緊接在後面那個數字的負號：那個數字是負數，負號屬於數字',
  'range-or-separator': '它夾在兩個分開的項目之間：起訖範圍、標題或標籤的分隔、或兩段之間的連接號；後面的數字不是負數',
  'unsure': '這句話真的看不出來',
};

const SYSTEM_EN =
  'You are a typesetting classifier for Chinese text. A rule engine has flagged one hyphen-minus that sits between a Chinese character and a digit, and needs to know how it reads before deciding whether to put a space between the hyphen and the digit. ' +
  `The flagged symbol is wrapped in ${MARK_OPEN} ${MARK_CLOSE}. Classify only that one symbol. Never rewrite the sentence, never explain, answer with one label.`;

const SYSTEM_ZH =
  '你是中文排版的分類器。規則引擎在句子裡標出了一個夾在中文字和數字之間的連字號，需要先知道它怎麼讀，才能決定連字號和數字之間要不要插空白。' +
  `被標出的符號包在 ${MARK_OPEN} ${MARK_CLOSE} 裡面。只分類那一個符號，不要改寫句子，不要解釋，只回一個標籤。`;

// Few-shot pairs, invented for this file. Checked against cases.json at load time.
const SHOTS = {
  hyphen: [
    ['水溫降到-1度時會結冰', '-', 'signed-number'],
    ['第三集-2小時特別篇', '-', 'range-or-separator'],
    ['他的淨資產是-300萬', '-', 'signed-number'],
    ['上學期-3月的行事曆', '-', 'range-or-separator'],
  ],
};

function renderShots(enumName, lang) {
  return SHOTS[enumName]
    .map(([sentence, sym, label]) => {
      const at = sentence.indexOf(sym);
      return lang === 'zh' ? `句子：${mark(sentence, at)}\n答案：${label}` : `Sentence: ${mark(sentence, at)}\nAnswer: ${label}`;
    })
    .join('\n\n');
}

function renderQuestion(kase, labels, lang) {
  const menu = labels.map((l) => `- ${l}: ${(lang === 'zh' ? GLOSS_ZH : GLOSS_EN)[l]}`).join('\n');
  return lang === 'zh'
    ? `句子：${mark(kase.input, kase.at)}\n\n被標出的「${kase.symbol}」在這裡是什麼意思？\n${menu}\n\n只回一個標籤。`
    : `Sentence: ${mark(kase.input, kase.at)}\n\nWhat is the marked "${kase.symbol}" doing here?\n${menu}\n\nAnswer with exactly one label.`;
}

// v4: reading-aloud reframe, zh only. Instead of a typography classification,
// the model judges how a native speaker reads the mark aloud: the sign reading
// is spoken (負 / 零下), the range/separator reading is spoken 到 / 至 or is a
// pause. Rationale: verbalizer work on small models says label semantics carry
// the decision, and the stable v1-zh miss (a from-X-to-Y sentence) is exactly
// the case where sentence-level range semantics override the sign — but read
// aloud, the range word is already spoken elsewhere, so the mark itself must
// read as the sign. Flat v1 format (v3's ## structure measured negative),
// zero-shot (v2 measured negative twice), same labels (scorer + constraint),
// glosses are reading words only. Written before any v4 results existed.
const GLOSS_ZH_V4 = {
  'signed-number': '朗讀時唸作「負」或「零下」：後面的數字是負數',
  'range-or-separator': '朗讀時唸作「到」或「至」，或是完全不唸出來、只停頓一下（當作分隔）',
  'unsure': '真的聽不出來該怎麼唸',
};

const SYSTEM_ZH_V4 = '你是中文朗讀老師。句子裡有一個符號被 « » 標出。想像把整句話唸出來給聽眾聽，判斷朗讀時那個符號該怎麼唸。' + '只判斷那一個符號，不要改寫句子，不要解釋，只回一個標籤。';

function renderQuestionReading(kase, labels) {
  const menu = labels.map((l) => `- ${l}: ${GLOSS_ZH_V4[l]}`).join('\n');
  return `句子：${mark(kase.input, kase.at)}\n\n把這句話唸出來時，被標出的「${kase.symbol}」該怎麼唸？\n${menu}\n\n只回一個標籤。`;
}

// v5: v4 plus a no-double-reading principle in the system prompt (a reading
// word already spoken in the sentence is not spoken again for the mark), and
// glosses trimmed to the reading words alone. The principle is generic
// phonology, but it was added after v4 measured a stable miss on a from-X-to-Y
// sentence, so it is borderline answer-key-adjacent: it names the mechanism of
// a known ambiguous miss (never a control shape). Flagged per the probe's
// gloss-hygiene rule. Written after v4 results, before any v5 results.
const GLOSS_ZH_V5 = {
  'signed-number': '唸作「負」或「零下」（後面的數字是負數）',
  'range-or-separator': '唸作「到」或「至」，或是不唸出來、只停頓一下',
  'unsure': '真的聽不出來該怎麼唸',
};

const SYSTEM_ZH_V5 =
  '你是中文朗讀老師。句子裡有一個符號被 « » 標出。想像把整句話唸出來給聽眾聽，判斷朗讀時那個符號該怎麼唸。' +
  '同一個意思不會唸兩次：如果「到」這個字本來就出現在句子裡，被標出的符號就不會再唸作「到」。' +
  '只判斷那一個符號，不要改寫句子，不要解釋，只回一個標籤。';

function renderQuestionReadingV5(kase, labels) {
  const menu = labels.map((l) => `- ${l}: ${GLOSS_ZH_V5[l]}`).join('\n');
  return `句子：${mark(kase.input, kase.at)}\n\n把這句話唸出來時，被標出的「${kase.symbol}」該怎麼唸？\n${menu}\n\n只回一個標籤。`;
}

// v6: minimal-pair readings. The glosses become two concrete renderings of the
// case sentence itself, built mechanically: the marked symbol replaced by the
// spoken sign word vs by a spoken range word (or an enumeration comma for the
// pause reading). The model picks which rendering is the correct way to read
// the sentence aloud — a naturalness judgment over two full strings, which is
// the one thing a small LM does natively, instead of an abstract category
// call. Still shape A: the model answers one enum label, never emits text;
// the renderings are template output, not model output. Generic by
// construction (same mechanical template for every case, nothing describes
// any specific shape). Written after v5 results, before any v6 results.
function renderQuestionMinimalPair(kase, labels) {
  const before = kase.input.slice(0, kase.at);
  const after = kase.input.slice(kase.at + 1);
  const gloss = {
    'signed-number': `唸起來是「${before}負${after}」`,
    'range-or-separator': `唸起來是「${before}到${after}」或「${before}、${after}」`,
    'unsure': '兩種唸法都不對勁',
  };
  const menu = labels.map((l) => `- ${l}: ${gloss[l]}`).join('\n');
  return `句子：${mark(kase.input, kase.at)}\n\n這句話哪種唸法才對？\n${menu}\n\n只回一個標籤。`;
}

const SYSTEM_ZH_V6 = '你是中文朗讀老師。句子裡有一個符號被 « » 標出。從選項裡挑出這句話正確的唸法。只回一個標籤，不要解釋。';

// v7: v4 with native reading words as the answer tokens themselves, via the
// harness displayLabels bijection (answers are mapped back and stored
// canonical). Rationale: the residual misses are sentences whose topic is
// range-flavored, and across v4-v6 the model kept picking the label whose
// English token says "range" no matter what the gloss argued — consistent with
// verbalizer work where the label token, not the gloss, carries a small
// model's decision. Here the tokens the model emits are the reading words, so
// token semantics and task semantics finally point the same way. Written after
// v6 results, before any v7 results.
const DISPLAY_ZH_V7 = {
  'signed-number': '負',
  'range-or-separator': '到或分隔',
  'unsure': '聽不出來',
};

const SYSTEM_ZH_V7 = '你是中文朗讀老師。句子裡有一個符號被 « » 標出。想像把整句話唸出來給聽眾聽，判斷朗讀時那個符號該怎麼唸。' + '只判斷那一個符號，不要改寫句子，不要解釋，只從選項中挑一個回答。';

function renderQuestionReadingV7(kase, labels) {
  const menu = labels.map((l) => `- ${DISPLAY_ZH_V7[l]}：${GLOSS_ZH_V4[l]}`).join('\n');
  return `句子：${mark(kase.input, kase.at)}\n\n把這句話唸出來時，被標出的「${kase.symbol}」該怎麼唸？\n${menu}\n\n用選項的名稱回答。`;
}

// v8: v7's reading-word answer tokens combined with v6's concrete minimal-pair
// glosses. The one residual stable miss is a sentence whose own text contains
// the range word, so the abstract range gloss (and in v7 even the range token)
// matches the sentence's topic; rendering both candidate readings as full
// strings makes the double-read version visibly ungrammatical, which no
// abstract gloss conveyed. Same mechanical template for every case. Written
// after v7 results, before any v8 results.
function renderQuestionMinimalPairV8(kase, labels) {
  const before = kase.input.slice(0, kase.at);
  const after = kase.input.slice(kase.at + 1);
  const gloss = {
    'signed-number': `唸起來是「${before}負${after}」`,
    'range-or-separator': `唸起來是「${before}到${after}」或「${before}、${after}」`,
    'unsure': '兩種唸法都不對勁',
  };
  const menu = labels.map((l) => `- ${DISPLAY_ZH_V7[l]}：${gloss[l]}`).join('\n');
  return `句子：${mark(kase.input, kase.at)}\n\n這句話哪種唸法才對？\n${menu}\n\n用選項的名稱回答。`;
}

// v10: v7 with the range/separator answer token shortened from a form that
// contains the range word to a bare separator word. Rationale: the stable
// residual miss is the one sentence whose own text contains the range word,
// and the v7 token containing that same character gives the wrong option a
// literal string match with the sentence. A token that names the role without
// any reading word removes that collision. Not fitted to any case shape; the
// glosses still carry the reading words. Written after v9 results, before any
// v10 results.
const DISPLAY_ZH_V10 = {
  'signed-number': '負',
  'range-or-separator': '分隔',
  'unsure': '聽不出來',
};

function renderQuestionReadingV10(kase, labels) {
  const menu = labels.map((l) => `- ${DISPLAY_ZH_V10[l]}：${GLOSS_ZH_V4[l]}`).join('\n');
  return `句子：${mark(kase.input, kase.at)}\n\n把這句話唸出來時，被標出的「${kase.symbol}」該怎麼唸？\n${menu}\n\n用選項的名稱回答。`;
}

// v11: span mark + span readings. The mark widens from the bare symbol to the
// symbol plus the digits after it, and the glosses become the two concrete
// readings of that span (sign word + digits vs range word + digits / a pause).
// Between v6 (whole-sentence renderings, poisoned by an idiom the rendering
// created) and v4/v7/v10 (abstract glosses, beaten by sentence-topic priors),
// this is the middle altitude: concrete digits, no full-sentence rewrite.
// Same mechanical template for every case. Written after v10 results, before
// any v11 results.
function renderQuestionSpanReading(kase, labels) {
  const after = kase.input.slice(kase.at + 1);
  const num = (after.match(/^[0-9]+(?:\.[0-9]+)?%?/) ?? [''])[0];
  const span = kase.symbol + num;
  const marked = kase.input.slice(0, kase.at) + MARK_OPEN + span + MARK_CLOSE + kase.input.slice(kase.at + 1 + num.length);
  const gloss = {
    'signed-number': `唸作「負${num}」：這是一個負數`,
    'range-or-separator': `唸作「到${num}」，或是「${kase.symbol}」不唸出來、只停頓一下`,
    'unsure': '聽不出來該怎麼唸',
  };
  const menu = labels.map((l) => `- ${DISPLAY_ZH_V10[l]}：${gloss[l]}`).join('\n');
  return `句子：${marked}\n\n把這句話唸出來時，被標出的「${span}」該怎麼唸？\n${menu}\n\n用選項的名稱回答。`;
}

// v12: v11's concrete span-reading glosses on v10's bare-symbol mark. v11
// proved the digits-in-gloss reading cracks the residual miss but its widened
// span mark presupposes the sign unit and flipped controls toward the sign
// reading; this keeps the neutral mark and moves all concreteness into the
// glosses. Same mechanical template for every case. Written after v11
// results, before any v12 results.
function renderQuestionSpanGloss(kase, labels) {
  const after = kase.input.slice(kase.at + 1);
  const num = (after.match(/^[0-9]+(?:\.[0-9]+)?%?/) ?? [''])[0];
  const gloss = {
    'signed-number': `唸作「負${num}」：負數`,
    'range-or-separator': `唸作「到${num}」，或是不唸出來、只停頓一下`,
    'unsure': '聽不出來該怎麼唸',
  };
  const menu = labels.map((l) => `- ${DISPLAY_ZH_V10[l]}：${gloss[l]}`).join('\n');
  return `句子：${mark(kase.input, kase.at)}\n\n把這句話唸出來時，被標出的「${kase.symbol}」該怎麼唸？\n${menu}\n\n用選項的名稱回答。`;
}

// v13: number-reading question. v11/v12 isolated the seesaw: a widened span
// mark cracks the residual miss but presupposes the sign unit and flips
// controls; a bare mark leaves the residual miss. This asks about the digits
// after the mark instead of the mark itself, with both options naming those
// digits — symmetric presupposition, concrete on both sides. Same mechanical
// template for every case. Written after v12 results, before any v13 results.
function renderQuestionNumberReading(kase, labels) {
  const after = kase.input.slice(kase.at + 1);
  const num = (after.match(/^[0-9]+(?:\.[0-9]+)?%?/) ?? [''])[0];
  const gloss = {
    'signed-number': `這個數字唸作「負${num}」（負數）`,
    'range-or-separator': `這個數字只唸「${num}」，「${kase.symbol}」唸「到」或不唸出來`,
    'unsure': '聽不出來該怎麼唸',
  };
  const menu = labels.map((l) => `- ${DISPLAY_ZH_V10[l]}：${gloss[l]}`).join('\n');
  return `句子：${mark(kase.input, kase.at)}\n\n把這句話唸出來時，被標出的「${kase.symbol}」後面的數字「${num}」該怎麼唸？\n${menu}\n\n用選項的名稱回答。`;
}

// v14: v11 (span mark + span readings, the only variant that cracks the
// residual miss) plus one generic damping sentence in the system prompt.
// Mechanics differ from v5's failed principle line: v5 tried to create a sign
// response on a chassis that under-fires; this damps the over-response the
// widened mark creates (v11 flipped controls toward the sign reading 19:4).
// The line is shape-free: it names no case pattern, only that both readings
// are common and the sentence decides. Everything else is byte-identical to
// v11. Written after v13 results, before any v14 results.
const SYSTEM_ZH_V14 = SYSTEM_ZH_V7 + '兩種唸法都很常見，不要偏向任何一邊，只看這一句唸起來哪種才自然。';

// v15: v14 with the damping dialed back. v14 held every control and cracked
// the residual miss, but its "don't lean either way" imperative overshot and
// cost one no-cue financial case v11 had. This states the balance as fact
// (both readings happen, the sentence decides) without the imperative not to
// lean. Everything else byte-identical to v11/v14. Written after v14 results,
// before any v15 results.
const SYSTEM_ZH_V15 = SYSTEM_ZH_V7 + '有些句子唸「負」才對，有些句子唸「到」或停頓才對，由句子本身決定。';

// v16: v14 plus one sentence that a negative number needs no cue word before
// it. v14 held all controls and cracked the from-to miss but its damping made
// the model hesitate on the one ambiguous shape with no cue character
// (noun + negative value); v15 showed stating balance as fact re-collapses
// onto the sign reading, so the correction rides on v14's imperative instead.
// Borderline answer-key-adjacent and flagged as such: it names the mechanism
// of a known ambiguous miss class (cue-word absence) — never a control shape.
// The cue-character regex baseline encodes the same fact in reverse. Written
// after v15 results, before any v16 results.
const SYSTEM_ZH_V16 = SYSTEM_ZH_V14 + '負數前面不一定有「是」「降到」這類提示字。';

// v17: v14 with the system wording made coherent with the widened mark — the
// v7 base line still said "one symbol" while v11/v14 mark a span; this says
// "the marked part" throughout. No new information, no shape named; pure
// coherence. Written after v16 results, before any v17 results.
const SYSTEM_ZH_V17 =
  '你是中文朗讀老師。句子裡有一段被 « » 標出。想像把整句話唸出來給聽眾聽，判斷朗讀時被標出的部分該怎麼唸。' +
  '只判斷被標出的部分，不要改寫句子，不要解釋，只從選項中挑一個回答。' +
  '兩種唸法都很常見，不要偏向任何一邊，只看這一句唸起來哪種才自然。';

// v20: markless presentation on the v7 chassis. Born from Vinta's playground
// run, where the model's free-text rationale quoted the sentence with the
// guillemets inside it — the wrapper is a tokenizer to Nano, not a pointer:
// it judges what the brackets enclose («-» = floating divider, «-5» = signed
// number), which explains the v11 seesaw. An ad-hoc probe confirmed the
// isolation pressure is real but small: removing the mark softens the from-to
// stable miss into a coin flip while controls are indifferent. Here the
// sentence is shown untouched and the question points at the symbol by
// quoting the character before it (needed because some sentences contain a
// second hyphen). Same mechanical template for every case. Written after the
// ad-hoc probe, before any full v20 run.
const SYSTEM_ZH_V20 = '你是中文朗讀老師。想像把整句話唸出來給聽眾聽，判斷朗讀時句子裡指定的「-」該怎麼唸。' + '只判斷那一個符號，不要改寫句子，不要解釋，只從選項中挑一個回答。';

function renderQuestionMarkless(kase, labels) {
  const prev = kase.input[kase.at - 1];
  const menu = labels.map((l) => `- ${DISPLAY_ZH_V7[l]}：${GLOSS_ZH_V4[l]}`).join('\n');
  return `句子：${kase.input}\n\n把這句話唸出來時，「${prev}」後面的那個「${kase.symbol}」該怎麼唸？\n${menu}\n\n用選項的名稱回答。`;
}

// v18: four-way reading menu on the v11 span-mark chassis, no damping line.
// Born from Vinta's question whether the reading framing covers the case
// where the mark is neither the sign nor the range word but a silent
// separator: the two-way menu crams the spoken range word and the silent
// pause into one option, so the span mark's sign pressure has only one
// non-sign outlet. This splits them — 負 / 到 / 分隔 / 聽不出來 — with 到 and
// 分隔 both mapping back to range-or-separator via the array displayLabels
// contract. Ontology now matches the typography (sign, spoken range, silent
// separator) instead of the scorer's enum. Glosses stay generic (no shape
// named). Written after the v14 reproduction failed, before any v18 results.
const DISPLAY_ZH_V18 = {
  'signed-number': '負',
  'range-or-separator': ['到', '分隔'],
  'unsure': '聽不出來',
};

function renderQuestionFourWay(kase, labels) {
  const after = kase.input.slice(kase.at + 1);
  const num = (after.match(/^[0-9]+(?:\.[0-9]+)?%?/) ?? [''])[0];
  const span = kase.symbol + num;
  const marked = kase.input.slice(0, kase.at) + MARK_OPEN + span + MARK_CLOSE + kase.input.slice(kase.at + 1 + num.length);
  const lines = {
    'signed-number': [`- 負：唸作「負${num}」，負數`],
    'range-or-separator': [`- 到：唸作「到${num}」，範圍或起訖`, `- 分隔：「${kase.symbol}」不唸出來，只停頓一下（當作分隔）`],
    'unsure': ['- 聽不出來：聽不出來該怎麼唸'],
  };
  const menu = labels.flatMap((l) => lines[l]).join('\n');
  return `句子：${marked}\n\n把這句話唸出來時，被標出的「${span}」該怎麼唸？\n${menu}\n\n用選項的名稱回答。`;
}

// v9: v7 plus chat-form priming — the pre-registered v2 shots replayed as
// invented user/assistant turns in initialPrompts instead of inline question
// text. Inline few-shot measurably hurt Nano twice (v2 runs, both probes);
// conversation-form examples are a different mechanism and were the one
// untried rung. Assistant turns are the JSON-encoded display token, matching
// what grammar-constrained decoding emits. Delivered via initialPrompts by the
// browser app. Written after v8 results, before any v9 results.
const V9_SHOT_ORDER = ['signed-number', 'range-or-separator', 'unsure'];
const INITIAL_TURNS_V9 = SHOTS.hyphen.flatMap(([sentence, sym, label]) => {
  const at = sentence.indexOf(sym);
  return [
    { role: 'user', content: renderQuestionReadingV7({ input: sentence, at, symbol: sym }, V9_SHOT_ORDER) },
    { role: 'assistant', content: JSON.stringify(DISPLAY_ZH_V7[label]) },
  ];
});

// v3: v1 restructured per Google's ML Kit prompt-design guidance for Gemini Nano
// (https://developers.google.com/ml-kit/genai/prompt/android/prompt-design):
// "##" section delimiters (called out as particularly critical for Nano), the
// answer-with-one-label instruction stated once in the system prompt instead of
// repeated in the question (repetition flagged as suboptimal), and a trailing
// answer header to cue a one-token completion. Two changes bundled, so a delta
// against v1 is structure+dedupe, not structure alone. Systems and glosses are
// byte-identical to v1; written before any v3 results existed. The doc's other
// advice doesn't apply: few-shot measurably hurts Nano here (v2 runs, both
// probes), and temperature 0.2 needs the extension build.
// Measured 2026-08-31: a negative. No scored gain over v1 on Nano, v3-zh adds a
// control flip, repeatability drops and slot-0 position bias rises on both
// languages (see docs/hyphen-sign-probe-handoff.md). Kept for the record.
function renderQuestionSections(kase, labels, lang) {
  const menu = labels.map((l) => `- ${l}: ${(lang === 'zh' ? GLOSS_ZH : GLOSS_EN)[l]}`).join('\n');
  return lang === 'zh'
    ? `## 句子\n${mark(kase.input, kase.at)}\n\n## 問題\n被標出的「${kase.symbol}」在這裡是什麼意思？\n\n## 標籤\n${menu}\n\n## 答案`
    : `## Sentence\n${mark(kase.input, kase.at)}\n\n## Question\nWhat is the marked "${kase.symbol}" doing here?\n\n## Labels\n${menu}\n\n## Answer`;
}

export function uniqueTargetQuote({ input, at }) {
  const number = input.slice(at + 1).match(/^\d+(?:\.\d+)?/)?.[0] ?? '';
  const left = input.lastIndexOf('-', at - 1) + 1;
  const next = input.indexOf('-', at + 1);
  const right = next === -1 ? input.length : next;
  // Exhaust right context before expanding left; crossing another hyphen would make the quote ambiguous again.
  for (let start = Math.max(left, at - 1); start >= left; start--) {
    for (let end = at + 1 + number.length; end <= right; end++) {
      const quote = input.slice(start, end);
      if (input.indexOf(quote) === input.lastIndexOf(quote)) {
        return quote;
      }
    }
  }
  return null;
}

export const PROMPTS = {
  'v1-en': {
    label: 'v1 zero-shot (English)',
    system: SYSTEM_EN,
    build: (kase, labels) => renderQuestion(kase, labels, 'en'),
  },
  'v1-zh': {
    label: 'v1 zero-shot (中文)',
    system: SYSTEM_ZH,
    build: (kase, labels) => renderQuestion(kase, labels, 'zh'),
  },
  'v2-en': {
    label: 'v2 few-shot (English)',
    system: SYSTEM_EN,
    build: (kase, labels) => `${renderShots(kase.enum, 'en')}\n\n${renderQuestion(kase, labels, 'en')}`,
  },
  'v2-zh': {
    label: 'v2 few-shot (中文)',
    system: SYSTEM_ZH,
    build: (kase, labels) => `${renderShots(kase.enum, 'zh')}\n\n${renderQuestion(kase, labels, 'zh')}`,
  },
  'v3-en': {
    label: 'v3 zero-shot, ## sections (English)',
    system: SYSTEM_EN,
    build: (kase, labels) => renderQuestionSections(kase, labels, 'en'),
  },
  'v3-zh': {
    label: 'v3 zero-shot, ## sections (中文)',
    system: SYSTEM_ZH,
    build: (kase, labels) => renderQuestionSections(kase, labels, 'zh'),
  },
  'v4-zh': {
    label: 'v4 reading-aloud (中文)',
    system: SYSTEM_ZH_V4,
    build: (kase, labels) => renderQuestionReading(kase, labels),
  },
  'v5-zh': {
    label: 'v5 reading-aloud, no-double-reading (中文)',
    system: SYSTEM_ZH_V5,
    build: (kase, labels) => renderQuestionReadingV5(kase, labels),
  },
  'v6-zh': {
    label: 'v6 minimal-pair readings (中文)',
    system: SYSTEM_ZH_V6,
    build: (kase, labels) => renderQuestionMinimalPair(kase, labels),
  },
  'v7-zh': {
    label: 'v7 reading tokens (中文)',
    system: SYSTEM_ZH_V7,
    displayLabels: DISPLAY_ZH_V7,
    build: (kase, labels) => renderQuestionReadingV7(kase, labels),
  },
  'v8-zh': {
    label: 'v8 reading tokens + minimal pair (中文)',
    system: SYSTEM_ZH_V6,
    displayLabels: DISPLAY_ZH_V7,
    build: (kase, labels) => renderQuestionMinimalPairV8(kase, labels),
  },
  'v9-zh': {
    label: 'v9 reading tokens + chat shots (中文)',
    system: SYSTEM_ZH_V7,
    displayLabels: DISPLAY_ZH_V7,
    initialTurns: INITIAL_TURNS_V9,
    build: (kase, labels) => renderQuestionReadingV7(kase, labels),
  },
  'v10-zh': {
    label: 'v10 reading tokens, bare separator token (中文)',
    system: SYSTEM_ZH_V7,
    displayLabels: DISPLAY_ZH_V10,
    build: (kase, labels) => renderQuestionReadingV10(kase, labels),
  },
  'v11-zh': {
    label: 'v11 span mark + span readings (中文)',
    system: SYSTEM_ZH_V7,
    displayLabels: DISPLAY_ZH_V10,
    build: (kase, labels) => renderQuestionSpanReading(kase, labels),
  },
  'v12-zh': {
    label: 'v12 bare mark + span-reading glosses (中文)',
    system: SYSTEM_ZH_V7,
    displayLabels: DISPLAY_ZH_V10,
    build: (kase, labels) => renderQuestionSpanGloss(kase, labels),
  },
  'v13-zh': {
    label: 'v13 number-reading question (中文)',
    system: SYSTEM_ZH_V7,
    displayLabels: DISPLAY_ZH_V10,
    build: (kase, labels) => renderQuestionNumberReading(kase, labels),
  },
  'v14-zh': {
    label: 'v14 span mark + damping line (中文)',
    system: SYSTEM_ZH_V14,
    displayLabels: DISPLAY_ZH_V10,
    build: (kase, labels) => renderQuestionSpanReading(kase, labels),
  },
  'v15-zh': {
    label: 'v15 span mark + factual balance line (中文)',
    system: SYSTEM_ZH_V15,
    displayLabels: DISPLAY_ZH_V10,
    build: (kase, labels) => renderQuestionSpanReading(kase, labels),
  },
  'v16-zh': {
    label: 'v16 v14 + no-cue-word line (中文)',
    system: SYSTEM_ZH_V16,
    displayLabels: DISPLAY_ZH_V10,
    build: (kase, labels) => renderQuestionSpanReading(kase, labels),
  },
  'v17-zh': {
    label: 'v17 v14, span-coherent wording (中文)',
    system: SYSTEM_ZH_V17,
    displayLabels: DISPLAY_ZH_V10,
    build: (kase, labels) => renderQuestionSpanReading(kase, labels),
  },
  'v18-zh': {
    label: 'v18 span mark + four-way reading menu (中文)',
    system: SYSTEM_ZH_V7,
    displayLabels: DISPLAY_ZH_V18,
    build: (kase, labels) => renderQuestionFourWay(kase, labels),
  },
  // v19: v18's four-way menu with v14's damping line. v18 re-measured the span
  // mark's sign push (19:4) with the extra outlets absorbing only part of it;
  // v14 proved the damping line neutralizes that push on the two-way menu.
  // Written after v18 results, before any v19 results.
  'v19-zh': {
    label: 'v19 four-way menu + damping line (中文)',
    system: SYSTEM_ZH_V14,
    displayLabels: DISPLAY_ZH_V18,
    build: (kase, labels) => renderQuestionFourWay(kase, labels),
  },
  'v20-zh': {
    label: 'v20 markless, prev-char pointer (中文)',
    system: SYSTEM_ZH_V20,
    displayLabels: DISPLAY_ZH_V7,
    build: (kase, labels) => renderQuestionMarkless(kase, labels),
  },
  // Field-note follow-ups: change only the pointer or one system instruction. Keep the sentence and menu bytes unchanged; no examples from the evaluation cases.
  'v21-zh': {
    label: 'v21 markless, local-phrase pointer (中文)',
    system: SYSTEM_ZH_V20,
    displayLabels: DISPLAY_ZH_V7,
    build: (kase, labels) => {
      const number = kase.input.slice(kase.at + 1).match(/^\d+(?:\.\d+)?/)?.[0] ?? '';
      return renderQuestionMarkless(kase, labels).replace(`「${kase.input[kase.at - 1]}」後面的那個「${kase.symbol}」`, `「${kase.input[kase.at - 1]}${kase.symbol}${number}」裡的「${kase.symbol}」`);
    },
  },
  'v21-zh-english-labels': {
    label: 'v21 local-phrase pointer, direct English labels',
    system: SYSTEM_ZH_V20,
    build: (kase, labels) => {
      const number = kase.input.slice(kase.at + 1).match(/^\d+(?:\.\d+)?/)?.[0] ?? '';
      const menu = labels.map((label) => `- ${label}：${GLOSS_ZH_V4[label]}`).join('\n');
      return `句子：${kase.input}\n\n把這句話唸出來時，「${kase.input[kase.at - 1]}${kase.symbol}${number}」裡的「${kase.symbol}」該怎麼唸？\n${menu}\n\n用選項的名稱回答。`;
    },
  },
  'v22-zh': {
    label: 'v22 markless, distinguish symbol from words (中文)',
    system: `${SYSTEM_ZH_V20}只判斷符號本身，不要把句子裡已有的字當成符號的唸法。`,
    displayLabels: DISPLAY_ZH_V7,
    build: (kase, labels) => renderQuestionMarkless(kase, labels),
  },
  'v23-zh': {
    label: 'v23 markless, ordinal pointer (中文)',
    system: SYSTEM_ZH_V20,
    displayLabels: DISPLAY_ZH_V7,
    build: (kase, labels) =>
      renderQuestionMarkless(kase, labels).replace(`「${kase.input[kase.at - 1]}」後面的那個「${kase.symbol}」`, `第${kase.input.slice(0, kase.at).split('-').length}個「${kase.symbol}」`),
  },
  'v24-zh': {
    label: 'v24 direct labels, distinguish symbol from words',
    system: `${SYSTEM_ZH_V20}只判斷符號本身，不要把句子裡已有的字當成符號的唸法。`,
    build: (kase, labels) => PROMPTS['v21-zh-english-labels'].build(kase, labels),
  },
  'v25-zh': {
    label: 'v25 direct labels, number membership question',
    system: SYSTEM_ZH_V20,
    build: (kase, labels) => PROMPTS['v21-zh-english-labels'].build(kase, labels).replace('該怎麼唸？', '是後面數字的負號，還是項目之間的連接或分隔符號？'),
  },
  'v26-zh': {
    label: 'v26 direct labels, numeric classification',
    system: '你是中文數字判讀助手。判斷句子裡指定的「-」是負號還是分隔符號。只判斷指定符號，不要改寫句子，不要解釋，只回答一個選項名稱。',
    build: (kase, labels) => {
      const number = kase.input.slice(kase.at + 1).match(/^\d+(?:\.\d+)?/)?.[0] ?? '';
      const glosses = {
        'signed-number': '負號，屬於後面的數字，表示數值小於零',
        'range-or-separator': '連接或分隔兩個項目，不屬於後面的數字',
        'unsure': '句子提供的資訊不足以判斷',
      };
      const menu = labels.map((label) => `- ${label}：${glosses[label]}`).join('\n');
      return `句子：${kase.input}\n\n「${kase.input[kase.at - 1]}${kase.symbol}${number}」裡的「${kase.symbol}」是哪一種符號？\n${menu}\n\n用選項的名稱回答。`;
    },
  },
  'v26-zh-chinese-labels': {
    label: 'v26 numeric classification, Chinese labels',
    system: '你是中文數字判讀助手。判斷句子裡指定的「-」是負號還是分隔符號。只判斷指定符號，不要改寫句子，不要解釋，只回答一個選項名稱。',
    displayLabels: DISPLAY_ZH_V7,
    build: (kase, labels) => PROMPTS['v26-zh'].build(kase, labels).replace(/signed-number|range-or-separator|unsure/g, (label) => DISPLAY_ZH_V7[label]),
  },
  'v27-zh-unique-quote': {
    label: 'v27 v26 with collision-only unique quote expansion',
    get system() {
      return PROMPTS['v26-zh'].system;
    },
    build: (kase, labels) => {
      const quote = uniqueTargetQuote(kase);
      if (quote === null) {
        return null;
      }
      const question = PROMPTS['v26-zh'].build(kase, labels);
      const pointerStart = `句子：${kase.input}\n\n`.length;
      return question.slice(0, pointerStart) + question.slice(pointerStart).replace(/^「[^」]*」/, `「${quote}」`);
    },
  },
  'v28-zh-ordinal': {
    label: 'v28 v26 with ordinal counting all sentence hyphens',
    get system() {
      return PROMPTS['v26-zh'].system;
    },
    build: (kase, labels) => {
      const question = PROMPTS['v26-zh'].build(kase, labels);
      const pointerStart = `句子：${kase.input}\n\n`.length;
      const ordinal = kase.input.slice(0, kase.at).split('-').length;
      return question.slice(0, pointerStart) + question.slice(pointerStart).replace(/^「[^」]*」裡的「-」/, `第${ordinal}個「-」`);
    },
  },
  'v29-zh-context-excerpts': {
    label: 'v29 v26 with separate full preceding/following excerpts on collisions',
    get system() {
      return PROMPTS['v26-zh'].system;
    },
    build: (kase, labels) => {
      const question = PROMPTS['v26-zh'].build(kase, labels);
      const prefix = `句子：${kase.input}\n\n`;
      const local = question.slice(prefix.length).match(/^「([^」]*)」/)[1];
      if (kase.input.indexOf(local) === kase.input.lastIndexOf(local)) {
        return question;
      }
      return `${prefix}目標「-」前面的原文：「${kase.input.slice(0, kase.at)}」\n目標「-」後面的原文：「${kase.input.slice(kase.at + 1)}」\n這個「-」${question.slice(question.indexOf('是哪一種符號？'))}`;
    },
  },
  'v30-zh-skip-collisions': {
    label: 'v30 v26, abstain when the original local phrase repeats',
    get system() {
      return PROMPTS['v26-zh'].system;
    },
    build: (kase, labels) => {
      const question = PROMPTS['v26-zh'].build(kase, labels);
      const local = question.slice(`句子：${kase.input}\n\n`.length).match(/^「([^」]*)」/)[1];
      return kase.input.indexOf(local) === kase.input.lastIndexOf(local) ? question : null;
    },
  },
};

export const SHOT_SENTENCES = Object.values(SHOTS)
  .flat()
  .map(([s]) => s);
