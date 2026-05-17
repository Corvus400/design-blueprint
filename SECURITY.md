# Security Policy

このリポジトリは HTML design spec と VRT tooling を管理するポートフォリオリポジトリです。

脆弱性の疑いがある内容は、このリポジトリの GitHub Security Advisories から非公開で報告してください。非公開で扱うべき詳細を public Issue、Pull Request、コメント、ログ、スクリーンショットに投稿しないでください。

報告には、不要な秘密情報、認証情報、アクセストークン、private URL、ローカルマシンの絶対パス、個人メールアドレス、非公開の個人情報を含めないでください。

## Scope

対象:

- HTML design spec / VRT tooling
- GitHub Actions / dependency update configuration
- Repository hygiene and public documentation

対象外:

- 一般的なサポート依頼
- デザイン改善提案
- 外部サービスや GitHub 自体の脆弱性
- 仕様内に含まれる架空データを実医療情報として扱う相談

## Repository Operation

このリポジトリはポートフォリオ用途です。外部 PR、一般的なサポート依頼、機能要望、通常のバグ報告は受け付けません。

Issue は、依存更新や公開リポジトリ運用上の衛生報告のために限定的に有効化しています。公開 Issue では、秘密情報、認証情報、アクセストークン、private URL、ローカルマシンの絶対パス、個人メールアドレス、非公開の個人情報、脆弱性の詳細を扱いません。

依存更新とセキュリティ通知のために Renovate / GitHub Security 機能を利用します。GitHub Actions と workflow 依存の更新は、selected actions と SHA pinning を維持したまま確認します。
