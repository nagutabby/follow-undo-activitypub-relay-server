# follow-undo-activitypub-relay-server
## 機能
- follow.js
  - ActivityPubのリレーサーバーと接続するためのリクエストを送信
- undoFollow.js
  - ActivityPubのリレーサーバーとの接続を解除するためのリクエストを送信
## 説明
- リレーサーバーとの接続
  - Mastodonのリクエスト方式を採用
  - リレーサーバーのinboxにFollowアクティビティを送信
- リレーサーバーとの接続の解除
  - FollowアクティビティをUndoアクティビティにラップ
  - リレーサーバーのinboxにUndoアクティビティを送信

## 使い方

1. `follow.js`, `undo.js`のrelayUrlとdomainを適切な値に変更

2. nvmでNode.jsをインストール

```bash
nvm install 22
nvm use
```

3. pnpmでdotenvをインストール

```bash
pnpm i
```

4. `.env`ファイルを作り、リレーサーバーと通信したいアクターの秘密鍵を`PRIVATE_KEY`環境変数に設定

5. `follow.js`あるいは`undoFollow.js`を実行

```bash
cd src
node follow.js
node undoFollow.js
```
