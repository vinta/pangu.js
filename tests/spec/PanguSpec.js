describe('pangu', function() {

  function run_by_karma() {
    return typeof window.__karma__ !== 'undefined';
  }

  beforeEach(function() {
  });

  afterEach(function() {
  });

  describe('text_spacing()', function() {

    it('處理 ! 符號', function() {
      var new_text = pangu.text_spacing('這是一個句子!然後，就沒有然後了');
      expect(new_text).toEqual('這是一個句子! 然後，就沒有然後了');
    });

    it('處理 ? 符號', function() {
      var new_text = pangu.text_spacing('這是一個句子?然後，就沒有然後了');
      expect(new_text).toEqual('這是一個句子? 然後，就沒有然後了');
    });

    it('處理 ~ 符號', function() {
      var new_text = pangu.text_spacing('這是一個句子~然後，就沒有然後了');
      expect(new_text).toEqual('這是一個句子~ 然後，就沒有然後了');
    });

    it('處理 + 符號', function() {
      var new_text = pangu.text_spacing('這是一個句子+然後，就沒有然後了');
      expect(new_text).toEqual('這是一個句子 + 然後，就沒有然後了');
    });

    // ex: Twitter, 不如就來 follow 一下 https://twitter.com/vinta
    it('處理 @ 符號：接著英文', function() {
      var new_text = pangu.text_spacing('請@vinta吃大便');
      expect(new_text).toEqual('請 @vinta 吃大便');
    });

    // ex: 新浪微博
    it('處理 @ 符號：接著中文', function() {
      var new_text = pangu.text_spacing('請@陳上進吃大便');
      expect(new_text).toEqual('請 @陳上進吃大便');
    });

    it('處理 # 符號：接著英文', function() {
      var new_text = pangu.text_spacing('這是一個句子#H2G2然後，就沒有然後了');
      expect(new_text).toEqual('這是一個句子 #H2G2 然後，就沒有然後了');
    });

    it('處理 # 符號：接著中文', function() {
      var new_text = pangu.text_spacing('這是一個句子#銀河便車指南 就沒有然後了');
      expect(new_text).toEqual('這是一個句子 #銀河便車指南 就沒有然後了');
    });

    // ex: 新浪微博的 hashtag 格式
    it('處理 #中文#', function() {
      var new_text = pangu.text_spacing('這是一個句子#銀河便車指南#然後就沒有然後了');
      expect(new_text).toEqual('這是一個句子 #銀河便車指南# 然後就沒有然後了');
    });

    it('處理 #English#', function() {
      var new_text = pangu.text_spacing('這是一個句子#H2G2#然後就沒有然後了');
      expect(new_text).toEqual('這是一個句子 #H2G2# 然後就沒有然後了');
    });

  });

  describe('element_spacing()', function() {

    function run_fixture_test(fixture_name) {
      loadFixtures(fixture_name + '.html');
      pangu.element_spacing('p');
      var new_html = $('#' + fixture_name).prop('outerHTML');

      var fixture_str = readFixtures(fixture_name + '_expected.html');
      var $expected = $(fixture_str);
      var expected_html = $expected.prop('outerHTML');

      expect(new_html).toEqual(expected_html);
    }

    it('處理一個關於連城訣的 DOM', function() {
      if (run_by_karma()) {
        run_fixture_test('t1');
      }
    });

  });

  describe('page_spacing()', function() {

    it('處理', function() {
      // TODO: 有空在補
      // TODO: 也要檢查 title
    });

  });

  describe('$.pangu.xxx()', function() {

    it('處理', function() {
      // TODO: 有空在補
    });

  });

});
