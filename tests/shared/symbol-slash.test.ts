import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol /', () => {
  it('handle / symbol as separator', () => {
    expect(pangu.spaceText('前面/後面')).toBe('前面/後面');
    expect(pangu.spaceText('Vinta/貓咪')).toBe('Vinta/貓咪');
    expect(pangu.spaceText('貓咪/Vinta')).toBe('貓咪/Vinta');
    expect(pangu.spaceText('速度是60公里/小時')).toBe('速度是 60 公里/小時');
    expect(pangu.spaceText('價格是$100/每小時')).toBe('價格是 $100/每小時');
    expect(pangu.spaceText('我/你\n他/她')).toBe('我/你\n他/她');
    expect(pangu.spaceText('歡迎光臨/再見\n參考 https://example.com/docs')).toBe('歡迎光臨/再見\n參考 https://example.com/docs');

    // DO NOT change if already spacing
    expect(pangu.spaceText('前面 / 後面')).toBe('前面 / 後面');
    expect(pangu.spaceText('Vinta / Abc123')).toBe('Vinta / Abc123');
    expect(pangu.spaceText('Abc123 / 陳上進')).toBe('Abc123 / 陳上進');
    expect(pangu.spaceText('陳上進 / Abc123')).toBe('陳上進 / Abc123');
    expect(pangu.spaceText('得到一個 A / B 的結果')).toBe('得到一個 A / B 的結果');
    expect(pangu.spaceText('好人 / bad guy')).toBe('好人 / bad guy');
    expect(pangu.spaceText('吃apple / banana')).toBe('吃 apple / banana');
  });

  it('handle / symbol as joiner token', () => {
    expect(pangu.spaceText('Vinta/Abc123')).toBe('Vinta/Abc123'); // If no CJK, DO NOT change
    expect(pangu.spaceText('得到一個A/B的結果')).toBe('得到一個 A/B 的結果');
    expect(pangu.spaceText('他要做A/B測試')).toBe('他要做 A/B 測試');
    expect(pangu.spaceText('打東東26/30')).toBe('打東東 26/30');
    expect(pangu.spaceText('打東東1/denominator')).toBe('打東東 1/denominator');
    expect(pangu.spaceText('吃apple/banana')).toBe('吃 apple/banana');
    expect(pangu.spaceText('選A/B其中一個')).toBe('選 A/B 其中一個');
    expect(pangu.spaceText('答案是6/2的商數')).toBe('答案是 6/2 的商數');
    expect(pangu.spaceText('安装指令：npx skills add vinta/hal-9000')).toBe('安装指令：npx skills add vinta/hal-9000');
  });

  it('handle / symbol as list', () => {
    expect(pangu.spaceText('陳上進/貓咪/Abc123')).toBe('陳上進/貓咪/Abc123');
    expect(pangu.spaceText('陳上進/Abc123/貓咪')).toBe('陳上進/Abc123/貓咪');
    expect(pangu.spaceText('Abc123/Vinta/貓咪')).toBe('Abc123/Vinta/貓咪');
    expect(pangu.spaceText('Abc123/陳上進/貓咪')).toBe('Abc123/陳上進/貓咪');
    expect(pangu.spaceText('日期是2024/01/22的早上')).toBe('日期是 2024/01/22 的早上');

    // prettier-ignore
    expect(pangu.spaceText("8964/3★集會所接待員/克隆·麻煩大師/手卷師傅（已退休）/主程式毀滅者/dae-dae-o/#絕地家庭小會議/#今天大掃除了沒有/NS編號在banner裡/discord:史單力#3230"))
                     .toBe("8964/3★集會所接待員/克隆・麻煩大師/手卷師傅（已退休）/主程式毀滅者/dae-dae-o/#絕地家庭小會議/#今天大掃除了沒有/NS 編號在 banner 裡/discord: 史單力 #3230");

    // prettier-ignore
    expect(pangu.spaceText("8964/3★集會所接待員/克隆·麻煩大師/手卷師傅(已退休)/主程式毀滅者/dae-dae-o/#絕地家庭小會議/#今天大掃除了沒有/NS編號在banner裡/discord:史單力#3230"))
                     .toBe("8964/3★集會所接待員/克隆・麻煩大師/手卷師傅 (已退休)/主程式毀滅者/dae-dae-o/#絕地家庭小會議/#今天大掃除了沒有/NS 編號在 banner 裡/discord: 史單力 #3230");

    // prettier-ignore
    expect(pangu.spaceText("after 80'/气象工作者/不苟同/关注abc天气变化/向往123自由/热爱科学、互联网、编程Node.js Web C++ Julia Python"))
                     .toBe("after 80'/气象工作者/不苟同/关注 abc 天气变化/向往 123 自由/热爱科学、互联网、编程 Node.js Web C++ Julia Python");

    // DO NOT change if already spacing
    expect(pangu.spaceText('陳上進 / 貓咪 / Abc123')).toBe('陳上進 / 貓咪 / Abc123');
    expect(pangu.spaceText('陳上進 / Abc123 / 貓咪')).toBe('陳上進 / Abc123 / 貓咪');
    expect(pangu.spaceText('Abc123 / Vinta / 貓咪')).toBe('Abc123 / Vinta / 貓咪');
    expect(pangu.spaceText('Abc123 / 陳上進 / 貓咪')).toBe('Abc123 / 陳上進 / 貓咪');

    // prettier-ignore
    expect(pangu.spaceText('2016-12-26(奇幻电影节) / 2017-01-20(美国) / 詹姆斯麦卡沃伊'))
                     .toBe('2016-12-26 (奇幻电影节) / 2017-01-20 (美国) / 詹姆斯麦卡沃伊');
  });

  it('handle / symbol as Unix absolute file path', () => {
    // prettier-ignore
    expect(pangu.spaceText('/home和/root是Linux中的頂級目錄'))
                     .toBe('/home 和 /root 是 Linux 中的頂級目錄');

    // prettier-ignore
    expect(pangu.spaceText('/home/與/root是Linux中的頂級目錄'))
                     .toBe('/home/ 與 /root 是 Linux 中的頂級目錄');

    // prettier-ignore
    expect(pangu.spaceText('"/home/"和"/root"是Linux中的頂級目錄'))
                     .toBe('"/home/" 和 "/root" 是 Linux 中的頂級目錄');

    // prettier-ignore
    expect(pangu.spaceText('當你用cat和od指令查看/dev/random和/dev/urandom的內容時'))
                     .toBe('當你用 cat 和 od 指令查看 /dev/random 和 /dev/urandom 的內容時');

    // prettier-ignore
    expect(pangu.spaceText('當你用cat和od指令查看"/dev/random"和"/dev/urandom"的內容時'))
                     .toBe('當你用 cat 和 od 指令查看 "/dev/random" 和 "/dev/urandom" 的內容時');

    // Basic Unix paths
    expect(pangu.spaceText('在/home目錄')).toBe('在 /home 目錄');
    expect(pangu.spaceText('查看/etc/passwd文件')).toBe('查看 /etc/passwd 文件');
    expect(pangu.spaceText('進入/usr/local/bin目錄')).toBe('進入 /usr/local/bin 目錄');

    // Paths with dots
    expect(pangu.spaceText('配置檔在/etc/nginx/nginx.conf')).toBe('配置檔在 /etc/nginx/nginx.conf');
    expect(pangu.spaceText('隱藏檔案/.bashrc很重要')).toBe('隱藏檔案 /.bashrc 很重要');
    expect(pangu.spaceText('查看/home/.config/settings')).toBe('查看 /home/.config/settings');

    // Paths with version numbers
    expect(pangu.spaceText('安裝到/usr/lib/python3.9/')).toBe('安裝到 /usr/lib/python3.9/');
    expect(pangu.spaceText('位於/opt/node-v16.14.0/bin')).toBe('位於 /opt/node-v16.14.0/bin');

    // Paths with special characters
    expect(pangu.spaceText('備份到/mnt/backup.2024-01-01/')).toBe('備份到 /mnt/backup.2024-01-01/');
    expect(pangu.spaceText('日誌在/var/log/app-name.log')).toBe('日誌在 /var/log/app-name.log');

    // Paths with @ symbols (npm packages)
    expect(pangu.spaceText('模組在/node_modules/@babel/core')).toBe('模組在 /node_modules/@babel/core');
    expect(pangu.spaceText('套件在/node_modules/@types/node')).toBe('套件在 /node_modules/@types/node');

    // Paths with + symbols
    expect(pangu.spaceText('編譯器在/usr/bin/g++')).toBe('編譯器在 /usr/bin/g++');

    // prettier-ignore
    expect(pangu.spaceText('套件在/usr/lib/gcc/x86_64-linux-gnu/11++'))
                     .toBe('套件在 /usr/lib/gcc/x86_64-linux-gnu/11++');

    // Paths ending with slash before CJK
    expect(pangu.spaceText('目錄/usr/bin/包含執行檔')).toBe('目錄 /usr/bin/ 包含執行檔');
    expect(pangu.spaceText('資料夾/etc/nginx/存放設定')).toBe('資料夾 /etc/nginx/ 存放設定');
  });

  it('handle / symbol as Unix relative file path', () => {
    // Basic relative paths
    expect(pangu.spaceText('檢查src/main.py文件')).toBe('檢查 src/main.py 文件');
    expect(pangu.spaceText('構建dist/index.js完成')).toBe('構建 dist/index.js 完成');
    expect(pangu.spaceText('運行test/spec.js測試')).toBe('運行 test/spec.js 測試');
    expect(pangu.spaceText('編輯docs/README.md文檔')).toBe('編輯 docs/README.md 文檔');

    // Project directories
    expect(pangu.spaceText('查看templates/base.html模板')).toBe('查看 templates/base.html 模板');
    expect(pangu.spaceText('複製assets/images/logo.png圖片')).toBe('複製 assets/images/logo.png 圖片');
    expect(pangu.spaceText('配置config/database.yml設定')).toBe('配置 config/database.yml 設定');
    expect(pangu.spaceText('執行scripts/deploy.sh腳本')).toBe('執行 scripts/deploy.sh 腳本');

    // Build/output directories
    expect(pangu.spaceText('清理build/temp/目錄')).toBe('清理 build/temp/ 目錄');
    expect(pangu.spaceText('輸出到target/release/資料夾')).toBe('輸出到 target/release/ 資料夾');
    expect(pangu.spaceText('發布到public/static/路徑')).toBe('發布到 public/static/ 路徑');

    // Development directories
    expect(pangu.spaceText('安裝node_modules/@babel/core套件')).toBe('安裝 node_modules/@babel/core 套件');
    expect(pangu.spaceText('設定.git/hooks/pre-commit鉤子')).toBe('設定 .git/hooks/pre-commit 鉤子');
    expect(pangu.spaceText('編輯.vscode/settings.json配置')).toBe('編輯 .vscode/settings.json 配置');

    // With leading ./
    expect(pangu.spaceText('參考./docs/API.md文件')).toBe('參考 ./docs/API.md 文件');
    expect(pangu.spaceText('執行./scripts/test.sh腳本')).toBe('執行 ./scripts/test.sh 腳本');
    expect(pangu.spaceText('查看./.claude/CLAUDE.md說明')).toBe('查看 ./.claude/CLAUDE.md 說明');

    // Nested paths
    expect(pangu.spaceText('位於src/components/Button/index.tsx')).toBe('位於 src/components/Button/index.tsx');
    expect(pangu.spaceText('存放在assets/fonts/Inter/Regular.woff2')).toBe('存放在 assets/fonts/Inter/Regular.woff2');

    // Multiple file paths in one sentence
    expect(pangu.spaceText('從src/utils.js複製到dist/utils.js')).toBe('從 src/utils.js 複製到 dist/utils.js');
    expect(pangu.spaceText('比較test/fixtures/input.txt和test/fixtures/output.txt')).toBe('比較 test/fixtures/input.txt 和 test/fixtures/output.txt');
  });

  it('handle / symbol as glob pattern', () => {
    expect(pangu.spaceText('聽說桐島rm -rf /*了')).toBe('聽說桐島 rm -rf /* 了');
    expect(pangu.spaceText('模板在templates/*.html裡')).toBe('模板在 templates/*.html 裡');
    expect(pangu.spaceText('測試所有test/**/*.js檔案')).toBe('測試所有 test/**/*.js 檔案');
  });
});
