import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Punctuation Marks', () => {
  describe('標點符號（只加左空格）', () => {
    it('handle @ symbol as mention', () => {
      expect(pangu.spacingText('請@vinta吃大便')).toBe('請 @vinta 吃大便');
      expect(pangu.spacingText('請@vinta_chen吃大便')).toBe('請 @vinta_chen 吃大便');
      expect(pangu.spacingText('請@VintaChen吃大便')).toBe('請 @VintaChen 吃大便');
      expect(pangu.spacingText('請@陳上進 吃大便')).toBe('請 @陳上進 吃大便');
    });

    it('handle # symbol as hashtag', () => {
      expect(pangu.spacingText('前面#後面')).toBe('前面 #後面');
      expect(pangu.spacingText('前面#H2G2後面')).toBe('前面 #H2G2 後面');
      expect(pangu.spacingText('前面 #銀河便車指南 後面')).toBe('前面 #銀河便車指南 後面');
      expect(pangu.spacingText('前面#銀河便車指南 後面')).toBe('前面 #銀河便車指南 後面');
      expect(pangu.spacingText('前面#銀河公車指南 #銀河拖吊車指南 後面')).toBe('前面 #銀河公車指南 #銀河拖吊車指南 後面');

      // Special cases
      expect(pangu.spacingText('前面C#後面')).toBe('前面 C# 後面');
      expect(pangu.spacingText('前面F#後面')).toBe('前面 F# 後面');
    });
  });

  describe('標點符號（只加右空格）', () => {
    it('handle ~ symbol', () => {
      expect(pangu.spacingText('前面~')).toBe('前面~');
      expect(pangu.spacingText('前面~~')).toBe('前面~~');
      expect(pangu.spacingText('前面~~~')).toBe('前面~~~');
      expect(pangu.spacingText('前面~後面')).toBe('前面~ 後面');
      expect(pangu.spacingText('前面~~後面')).toBe('前面~~ 後面');
      expect(pangu.spacingText('前面~~~後面')).toBe('前面~~~ 後面');
      expect(pangu.spacingText('前面~abc')).toBe('前面~ abc');
      expect(pangu.spacingText('前面~123')).toBe('前面~ 123');

      // DO NOT change if already spacing
      expect(pangu.spacingText('前面 ~ 後面')).toBe('前面 ~ 後面');
      expect(pangu.spacingText('前面~ 後面')).toBe('前面~ 後面');
      expect(pangu.spacingText('前面 ~後面')).toBe('前面 ~後面');

      // Special cases
      expect(pangu.spacingText('前面~=後面')).toBe('前面 ~= 後面');
      expect(pangu.spacingText('前面 ~= 後面')).toBe('前面 ~= 後面');
    });

    it('handle ! symbol', () => {
      expect(pangu.spacingText('前面!')).toBe('前面!');
      expect(pangu.spacingText('前面!!')).toBe('前面!!');
      expect(pangu.spacingText('前面!!!')).toBe('前面!!!');
      expect(pangu.spacingText('前面!後面')).toBe('前面! 後面');
      expect(pangu.spacingText('前面!!後面')).toBe('前面!! 後面');
      expect(pangu.spacingText('前面!!!後面')).toBe('前面!!! 後面');
      expect(pangu.spacingText('前面!abc')).toBe('前面! abc');
      expect(pangu.spacingText('前面!123')).toBe('前面! 123');

      // DO NOT change if already spacing
      expect(pangu.spacingText('前面 ! 後面')).toBe('前面 ! 後面');
      expect(pangu.spacingText('前面! 後面')).toBe('前面! 後面');
      expect(pangu.spacingText('前面 !後面')).toBe('前面 !後面');
    });

    it('handle ; symbol', () => {
      expect(pangu.spacingText('前面;後面')).toBe('前面; 後面');

      // DO NOT change if already spacing
      expect(pangu.spacingText('前面 ; 後面')).toBe('前面 ; 後面');
      expect(pangu.spacingText('前面; 後面')).toBe('前面; 後面');
      expect(pangu.spacingText('前面 ;後面')).toBe('前面 ;後面');
    });

    it('handle , symbol', () => {
      expect(pangu.spacingText('前面,後面')).toBe('前面, 後面');

      // DO NOT change if already spacing
      expect(pangu.spacingText('前面 , 後面')).toBe('前面 , 後面');
      expect(pangu.spacingText('前面, 後面')).toBe('前面, 後面');
      expect(pangu.spacingText('前面 ,後面')).toBe('前面 ,後面');
    });

    it('handle . symbol', () => {
      expect(pangu.spacingText('前面.')).toBe('前面.');
      expect(pangu.spacingText('前面..')).toBe('前面..');
      expect(pangu.spacingText('前面...')).toBe('前面...');
      expect(pangu.spacingText('前面.後面')).toBe('前面. 後面');
      expect(pangu.spacingText('前面..後面')).toBe('前面.. 後面');
      expect(pangu.spacingText('前面...後面')).toBe('前面... 後面');

      // DO NOT change if already spacing
      expect(pangu.spacingText('前面 . 後面')).toBe('前面 . 後面');
      expect(pangu.spacingText('前面. 後面')).toBe('前面. 後面');
      expect(pangu.spacingText('前面 .後面')).toBe('前面 .後面');

      // Special cases
      expect(pangu.spacingText('前面vs.後面')).toBe('前面 vs. 後面');
      expect(pangu.spacingText('前面U.S.A.後面')).toBe('前面 U.S.A. 後面');
      expect(pangu.spacingText('黑人問號.jpg後面')).toBe('黑人問號.jpg 後面');
      expect(pangu.spacingText('黑人問號.jpg 後面')).toBe('黑人問號.jpg 後面');
      expect(pangu.spacingText('pangu.js v1.2.3橫空出世')).toBe('pangu.js v1.2.3 橫空出世');
      expect(pangu.spacingText('pangu.js 1.2.3橫空出世')).toBe('pangu.js 1.2.3 橫空出世');

      // prettier-ignore
      expect(pangu.spacingText("Mr.龍島主道：「Let's Party!各位高明博雅君子！"))
                         .toBe("Mr. 龍島主道：「Let's Party! 各位高明博雅君子！");

      // prettier-ignore
      expect(pangu.spacingText("Mr.龍島主道:「Let's Party!各位高明博雅君子!"))
                         .toBe("Mr. 龍島主道:「Let's Party! 各位高明博雅君子!");
    });

    // \u2026
    it('handle … symbol', () => {
      expect(pangu.spacingText('前面…後面')).toBe('前面… 後面');
      expect(pangu.spacingText('前面……後面')).toBe('前面…… 後面');
    });

    it('handle ? symbol', () => {
      expect(pangu.spacingText('前面?')).toBe('前面?');
      expect(pangu.spacingText('前面??')).toBe('前面??');
      expect(pangu.spacingText('前面???')).toBe('前面???');
      expect(pangu.spacingText('前面?後面')).toBe('前面? 後面');
      expect(pangu.spacingText('前面??後面')).toBe('前面?? 後面');
      expect(pangu.spacingText('前面???後面')).toBe('前面??? 後面');
      expect(pangu.spacingText('前面?abc')).toBe('前面? abc');
      expect(pangu.spacingText('前面?123')).toBe('前面? 123');

      // DO NOT change if already spacing
      expect(pangu.spacingText('前面 ? 後面')).toBe('前面 ? 後面');
      expect(pangu.spacingText('前面? 後面')).toBe('前面? 後面');
      expect(pangu.spacingText('前面 ?後面')).toBe('前面 ?後面');

      // Special cases
      expect(pangu.spacingText('所以,請問Jackey的鼻子有幾個?3.14個')).toBe('所以, 請問 Jackey 的鼻子有幾個? 3.14 個');
    });

    // When the symbol appears only 1 time in one line
    it('handle : symbol as colon', () => {
      expect(pangu.spacingText('前面:後面')).toBe('前面: 後面');

      // DO NOT change if already spacing
      expect(pangu.spacingText('前面 : 後面')).toBe('前面 : 後面');
      expect(pangu.spacingText('前面: 後面')).toBe('前面: 後面');
      expect(pangu.spacingText('前面 :後面')).toBe('前面 :後面');

      // Special cases
      expect(pangu.spacingText('電話:123456789')).toBe('電話: 123456789');
      expect(pangu.spacingText('前面:I have no idea後面')).toBe('前面: I have no idea 後面');
      expect(pangu.spacingText('前面: I have no idea後面')).toBe('前面: I have no idea 後面');

      // TODO:
      // expect(pangu.spacingText('前面:)後面')).toBe('前面 :) 後面');
    });

    // When the symbol appears 2+ times or more in one line
    it('handle : symbol as separator', () => {
      // TODO:
      // expect(pangu.spacingText('前面:後面:再後面')).toBe('前面:後面:再後面');
      // expect(pangu.spacingText('前面:後面:再後面:更後面')).toBe('前面:後面:再後面:更後面');
      // expect(pangu.spacingText('前面:後面:再後面:更後面:超後面')).toBe('前面:後面:再後面:更後面:超後面');
    });

    // \u00b7
    it('handle · symbol', () => {
      expect(pangu.spacingText('前面·後面')).toBe('前面・後面');
      expect(pangu.spacingText('喬治·R·R·馬丁')).toBe('喬治・R・R・馬丁');
      expect(pangu.spacingText('M·奈特·沙马兰')).toBe('M・奈特・沙马兰');
    });

    // \u2022
    it('handle • symbol', () => {
      expect(pangu.spacingText('前面•後面')).toBe('前面・後面');
      expect(pangu.spacingText('喬治•R•R•馬丁')).toBe('喬治・R・R・馬丁');
      expect(pangu.spacingText('M•奈特•沙马兰')).toBe('M・奈特・沙马兰');
    });

    // \u2027
    it('handle ‧ symbol', () => {
      expect(pangu.spacingText('前面‧後面')).toBe('前面・後面');
      expect(pangu.spacingText('喬治‧R‧R‧馬丁')).toBe('喬治・R・R・馬丁');
      expect(pangu.spacingText('M‧奈特‧沙马兰')).toBe('M・奈特・沙马兰');
    });
  });

  describe('單位符號', () => {
    it('handle $ symbol', () => {
      expect(pangu.spacingText('前面$後面')).toBe('前面 $ 後面');
      expect(pangu.spacingText('前面 $ 後面')).toBe('前面 $ 後面');
      expect(pangu.spacingText('前面$100後面')).toBe('前面 $100 後面');
    });

    it('handle % symbol', () => {
      expect(pangu.spacingText('前面%後面')).toBe('前面 % 後面');
      expect(pangu.spacingText('前面 % 後面')).toBe('前面 % 後面');
      expect(pangu.spacingText('前面100%後面')).toBe('前面 100% 後面');

      // prettier-ignore
      expect(pangu.spacingText('新八的構造成分有95%是眼鏡、3%是水、2%是垃圾'))
                         .toBe('新八的構造成分有 95% 是眼鏡、3% 是水、2% 是垃圾');

      // prettier-ignore
      expect(pangu.spacingText("丹寧控注意Levi's全館任2件25%OFF滿額再享85折！"))
                         .toBe("丹寧控注意 Levi's 全館任 2 件 25% OFF 滿額再享 85 折！");
    });
  });
});
