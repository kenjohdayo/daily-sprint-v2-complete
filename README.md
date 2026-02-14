# Consulting LP (Static, Shrine-inspired Theme)

ビルド不要の静的LPです。`index.html` がルートページとして表示されます。

## ローカル確認

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

- http://127.0.0.1:4173/index.html

## 編集ガイド（どこを直せば何が変わるか）

- ファーストビュー/文言: `index.html` の hero セクション
- 問い合わせフォーム項目: `index.html` の `#contactForm`
- FAQ項目: `index.html` の `#faq`
- 色・余白・ボタン: `style.css` の `:root` 変数
- OGP画像: `assets/ogp-shrine-consulting.svg`
- favicon: `assets/favicon.svg`

## 問い合わせフォーム仕様

- 現在は静的運用優先で、ブラウザ内完結（LocalStorage保存）です。
- スパム対策として honeypot (`name="website"`) を実装しています。
- 本番で外部送信に切り替える場合は、`index.html` の `contactForm` submit 処理を Formspree/Getform の POST に置換してください。

### Formspree切替メモ（推奨）

1. Formspreeでフォームを作成し、エンドポイントURLを取得
2. `index.html` の submit ハンドラ内 `localStorage` 保存部分を `fetch` POST に置換
3. 成功時 `formMessage` へ完了文言、失敗時は再送ガイドを表示
4. `trackEvent('form_submit_complete')` は維持

## 計測イベント

`window.dataLayer` へ以下を push します（未設定時は console 出力のみ）。

- `cta_click`（ヘッダー/ヒーロー/フローティング/送信ボタン）
- `form_submit_complete`
- `scroll_depth`（50%, 75%）

## 公開前チェックリスト

- [ ] canonical / og:url が本番URLに解決される
- [ ] OGP画像が表示される
- [ ] フォーム入力→送信完了メッセージまで確認
- [ ] FAQ開閉とモバイルメニューを確認
- [ ] ダミー文字列（example.com 等）が無い
- [ ] 主要CTAクリックが計測される

## リポジトリ構成メモ

- 旧ゲーム関連ファイルは `legacy/` に隔離済みです。


## 100点に近づける追加改善

- `index.html` の `#contactForm` に `data-endpoint` を設定すると、外部フォームAPIへ送信できます。
- 料金セクションに「費用を透明化するための約束」を追記済み。
- `#results` セクションで改善結果のサンプルを掲載し、信頼訴求を強化。

- `#selfcheck` で診断チェックを提供し、自己認識→相談導線を強化。
