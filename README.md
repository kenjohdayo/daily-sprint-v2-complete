# 神社向けデジタル導線設計LP（静的運用）

`index.html` / `style.css` / `README.md` のみで動作する静的LPです。

## ローカル確認

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

- http://127.0.0.1:4173/index.html

## 問い合わせフォーム設定（Formspree例）

現在 `index.html` のフォーム `action` はプレースホルダーです。

```html
<form action="https://formspree.io/f/your-form-id" method="POST">
```

### 本番化手順

1. Formspreeでフォームを作成し、`your-form-id` を取得
2. `index.html` の `action` を実際のURLへ置換
3. テスト送信して完了メッセージを確認
4. スパム対策（honeypot項目 `website`）が残っていることを確認

## 編集ポイント

- ヒーローコピー: `index.html` の `<section class="hero">`
- サービス内容: `#services`
- 進め方: `#process`
- 想定ケース: `#cases`
- FAQ: `#faq`
- 価格や文言トーン: `index.html` と `style.css`

## 公開前チェックリスト

- [ ] mailtoリンクが無い
- [ ] フォーム送信が実際に通る（Formspree設定済み）
- [ ] 価格表記（15万円（税込））が統一されている
- [ ] 「やること / やらないこと」が明記されている
- [ ] canonical / OGP URL が本番ドメイン
- [ ] スマホでCTAボタンが押しやすい
- [ ] 重要情報に `aria-hidden="true"` を使っていない
