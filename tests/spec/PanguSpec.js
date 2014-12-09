describe('pangu', function() {

  function run_by_karma() {
    return typeof window.__karma__ !== 'undefined';
  }

  function run_fixture_test(fixture_name, the_spacing) {
    loadFixtures(fixture_name + '.html');

    the_spacing();

    var new_html = $('#' + fixture_name).prop('outerHTML');

    var fixture_str = readFixtures(fixture_name + '_expected.html');
    var $expected = $(fixture_str);
    var expected_html = $expected.prop('outerHTML');

    expect(new_html).toEqual(expected_html);
  }

  beforeEach(function() {
  });

  afterEach(function() {
  });

  describe('text_spacing()', function() {

    // it('處理 ~ 符號', function() {
    //   var new_text = pangu.text_spacing('前面~後面');
    //   expect(new_text).toEqual('前面~ 後面');
    // });

    it('處理 ~ 符號', function() {
      var new_text = pangu.text_spacing('前面~後面');
      expect(new_text).toEqual('前面 ~ 後面');
    });

    it('處理 ` 符號', function() {
      var new_text = pangu.text_spacing('前面`後面');
      expect(new_text).toEqual('前面 ` 後面');
    });

    it('處理 ! 符號', function() {
      var new_text = pangu.text_spacing('前面!後面');
      expect(new_text).toEqual('前面! 後面');
    });

    // ex: Twitter，不如就來 follow 一下 https://twitter.com/vinta
    it('處理 @ 符號：接著英文', function() {
      var new_text = pangu.text_spacing('請@vinta吃大便');
      expect(new_text).toEqual('請 @vinta 吃大便');
    });

    // ex: 新浪微博，不如也來 follow 一下 http://weibo.com/vintalines
    it('處理 @ 符號：接著中文', function() {
      var new_text = pangu.text_spacing('請@陳上進吃大便');
      expect(new_text).toEqual('請 @陳上進吃大便');
    });

    it('處理 # 符號：接著英文', function() {
      var new_text = pangu.text_spacing('前面#H2G2後面');
      expect(new_text).toEqual('前面 #H2G2 後面');
    });

    it('處理 # 符號：接著中文 之一', function() {
      var new_text = pangu.text_spacing('前面#銀河便車指南');
      expect(new_text).toEqual('前面 #銀河便車指南');
    });

    it('處理 # 符號：接著中文 之二', function() {
      var new_text = pangu.text_spacing('前面#銀河便車指南 後面');
      expect(new_text).toEqual('前面 #銀河便車指南 後面');
    });

    it('處理 # 符號：接著中文 之三', function() {
      var new_text = pangu.text_spacing('前面#銀河公車指南 #銀河卡車指南 後面');
      expect(new_text).toEqual('前面 #銀河公車指南 #銀河卡車指南 後面');
    });

    // ex: 新浪微博的 hashtag 格式
    it('處理 #中文#', function() {
      var new_text = pangu.text_spacing('前面#銀河閃電霹靂車指南#後面');
      expect(new_text).toEqual('前面 #銀河閃電霹靂車指南# 後面');
    });

    it('處理 #English#', function() {
      var new_text = pangu.text_spacing('前面#H2G2#後面');
      expect(new_text).toEqual('前面 #H2G2# 後面');
    });

    it('處理 $ 符號', function() {
      var new_text = pangu.text_spacing('前面$後面');
      expect(new_text).toEqual('前面 $ 後面');
    });

    it('處理 % 符號', function() {
      var new_text = pangu.text_spacing('前面%後面');
      expect(new_text).toEqual('前面 % 後面');
    });

    it('處理 ^ 符號', function() {
      var new_text = pangu.text_spacing('前面^後面');
      expect(new_text).toEqual('前面 ^ 後面');
    });

    it('處理 & 符號', function() {
      var new_text = pangu.text_spacing('前面&後面');
      expect(new_text).toEqual('前面 & 後面');
    });

    it('處理 * 符號', function() {
      var new_text = pangu.text_spacing('前面*後面');
      expect(new_text).toEqual('前面 * 後面');
    });

    it('處理 ( 符號', function() {
      var new_text = pangu.text_spacing('前面(後面');
      expect(new_text).toEqual('前面 ( 後面');
    });

    it('處理 ) 符號', function() {
      var new_text = pangu.text_spacing('前面)後面');
      expect(new_text).toEqual('前面 ) 後面');
    });

    it('處理 (XXX) 之一', function() {
      var new_text = pangu.text_spacing('前面(中文123漢字)後面');
      expect(new_text).toEqual('前面 (中文 123 漢字) 後面');
    });

    it('處理 (XXX) 之二', function() {
      var new_text = pangu.text_spacing('前面(中文123)後面');
      expect(new_text).toEqual('前面 (中文 123) 後面');
    });

    it('處理 (XXX) 之三', function() {
      var new_text = pangu.text_spacing('前面(123中文)後面');
      expect(new_text).toEqual('前面 (123 中文) 後面');
    });

    it('處理 (XXX) 之四', function() {
      var new_text = pangu.text_spacing('前面(中文123) then');
      expect(new_text).toEqual('前面 (中文 123) then');
    });

    it('處理 (XXX) 之五', function() {
      var new_text = pangu.text_spacing('前面(123中文) then');
      expect(new_text).toEqual('前面 (123 中文) then');
    });

    it('處理 (XXX) 之六', function() {
      var new_text = pangu.text_spacing('前面( ) then');
      expect(new_text).toEqual('前面 ( ) then');
    });

    it('處理 - 符號', function() {
      var new_text = pangu.text_spacing('前面-後面');
      expect(new_text).toEqual('前面 - 後面');
    });

    it('不處理 _ 符號', function() {
      var new_text = pangu.text_spacing('前面_後面');
      expect(new_text).toEqual('前面_後面');
    });

    // it('處理 _ 符號 之一', function() {
    //   var new_text = pangu.text_spacing('前面_後面');
    //   expect(new_text).toEqual('前面 _ 後面');
    // });

    // it('處理 _ 符號 之二', function() {
    //   var new_text = pangu.text_spacing('前面__後面');
    //   expect(new_text).toEqual('前面 __ 後面');
    // });

    it('處理 + 符號', function() {
      var new_text = pangu.text_spacing('前面+後面');
      expect(new_text).toEqual('前面 + 後面');
    });

    it('處理 = 符號', function() {
      var new_text = pangu.text_spacing('前面=後面');
      expect(new_text).toEqual('前面 = 後面');
    });

    it('處理 { 符號', function() {
      var new_text = pangu.text_spacing('前面{後面');
      expect(new_text).toEqual('前面 { 後面');
    });

    it('處理 } 符號', function() {
      var new_text = pangu.text_spacing('前面}後面');
      expect(new_text).toEqual('前面 } 後面');
    });

    it('處理 [ 符號', function() {
      var new_text = pangu.text_spacing('前面[後面');
      expect(new_text).toEqual('前面 [ 後面');
    });

    it('處理 ] 符號', function() {
      var new_text = pangu.text_spacing('前面]後面');
      expect(new_text).toEqual('前面 ] 後面');
    });

    it('處理 [XXX] 之一', function() {
      var new_text = pangu.text_spacing('前面[中文123漢字]後面');
      expect(new_text).toEqual('前面 [中文 123 漢字] 後面');
    });

    it('處理 [XXX] 之二', function() {
      var new_text = pangu.text_spacing('前面[中文123]後面');
      expect(new_text).toEqual('前面 [中文 123] 後面');
    });

    it('處理 [XXX] 之三', function() {
      var new_text = pangu.text_spacing('前面[123中文]後面');
      expect(new_text).toEqual('前面 [123 中文] 後面');
    });

    it('處理 [XXX] 之四', function() {
      var new_text = pangu.text_spacing('前面[中文123] then');
      expect(new_text).toEqual('前面 [中文 123] then');
    });

    it('處理 [XXX] 之五', function() {
      var new_text = pangu.text_spacing('前面[123中文] then');
      expect(new_text).toEqual('前面 [123 中文] then');
    });

    it('處理 | 符號', function() {
      var new_text = pangu.text_spacing('前面|後面');
      expect(new_text).toEqual('前面 | 後面');
    });

    it('處理 \\ 符號', function() {
      var new_text = pangu.text_spacing('前面\\後面');
      expect(new_text).toEqual('前面 \\ 後面');
    });

    it('處理 : 符號', function() {
      var new_text = pangu.text_spacing('前面:後面');
      expect(new_text).toEqual('前面: 後面');
    });

    it('處理 ; 符號', function() {
      var new_text = pangu.text_spacing('前面;後面');
      expect(new_text).toEqual('前面; 後面');
    });

    it('處理 "XXX" 之一', function() {
      var new_text = pangu.text_spacing('前面"中文123漢字"後面');
      expect(new_text).toEqual('前面 "中文 123 漢字" 後面');
    });

    it('處理 "XXX" 之二', function() {
      var new_text = pangu.text_spacing('前面:"中文123漢字"後面');
      expect(new_text).toEqual('前面:"中文 123 漢字" 後面');
    });

    it('處理 "XXX" 之三', function() {
      var new_text = pangu.text_spacing('前面"中文123漢字"5566後面');
      expect(new_text).toEqual('前面 "中文 123 漢字"5566 後面');
    });

    it('處理 "XXX" 之四', function() {
      var new_text = pangu.text_spacing('前面" "後面');
      expect(new_text).toEqual('前面 " " 後面');
    });

    it("處理 ' 符號", function() {
      var new_text = pangu.text_spacing("陳上進 likes 林依諾's status.");
      expect(new_text).toEqual("陳上進 likes 林依諾's status.");
    });

    it('處理 < 符號', function() {
      var new_text = pangu.text_spacing('前面<後面');
      expect(new_text).toEqual('前面 < 後面');
    });

    it('處理 > 符號', function() {
      var new_text = pangu.text_spacing('前面>後面');
      expect(new_text).toEqual('前面 > 後面');
    });

    it('處理 <XXX>', function() {
      var new_text = pangu.text_spacing('前面<中文123漢字>後面');
      expect(new_text).toEqual('前面 <中文 123 漢字> 後面');
    });

    it('處理 , 符號', function() {
      var new_text = pangu.text_spacing('前面,後面');
      expect(new_text).toEqual('前面, 後面');
    });

    it('處理 . 符號', function() {
      var new_text = pangu.text_spacing('前面.後面');
      expect(new_text).toEqual('前面. 後面');
    });

    it('處理 ? 符號', function() {
      var new_text = pangu.text_spacing('前面?後面');
      expect(new_text).toEqual('前面? 後面');
    });

    it('處理 / 符號', function() {
      var new_text = pangu.text_spacing('前面/後面');
      expect(new_text).toEqual('前面 / 後面');
    });

  });

  describe('page_spacing()', function() {

    it('處理 DOM: <title>', function() {
      $('title').html('天龍8部');
      pangu.page_spacing();
      expect($('title').html()).toEqual('天龍 8 部');
    });

    it('處理 DOM: <body>', function() {
      if (run_by_karma()) {
        run_fixture_test('p1', function() {
          pangu.page_spacing();
        });
      }
    });

  });

  describe('element_spacing()', function() {

    it('處理 #id_name', function() {
      run_fixture_test('e1', function() {
        pangu.element_spacing('#e1');
      });
    });

    it('處理 .class_name', function() {
      run_fixture_test('e2', function() {
        pangu.element_spacing('.e2');
      });
    });

    it('處理 .class_name 之二', function() {
      run_fixture_test('e4', function() {
        pangu.element_spacing('.e4');
      });
    });

    it('處理 .class_name 之三', function() {
      run_fixture_test('e5', function() {
        pangu.element_spacing('.e5');
      });
    });

    it('處理 tag_name', function() {
      run_fixture_test('e3', function() {
        pangu.element_spacing('article');
      });
    });

  });

});
