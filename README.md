#使い方
## 準備
```
npm i
```
## .envファイルに必要な項目を用意する
以下の項目を持つ.envファイルを作成する。

```
API_KEY=***********************
OWNER=owner_name
REPO=repositroy_name
ASSIGNEE=assignee_name
```

## すべてのレビューコメントを取得する
.envに指定されたレポジトリ、assigneeの全プルリクエストのコメントをjsonファイルで出力する
```
node get_all_review_comments.js
```