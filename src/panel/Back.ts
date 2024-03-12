import { Webview, Disposable, WebviewPanel, Uri, ViewColumn, window } from "vscode";

export class BackPanel {
    public static currentPanel: BackPanel | undefined = undefined;
    private readonly _panel: WebviewPanel;
    private _disposables: Disposable[] = [];

    private constructor(panel: WebviewPanel, extensionUri: Uri) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
        this._setWebviewMessageListener(this._panel.webview);
    }
    public static render(extensionUri: Uri) {
        if (BackPanel.currentPanel) {
            BackPanel.currentPanel._panel.reveal(ViewColumn.One);
        } else {
            const panel = window.createWebviewPanel(
                "backjoon",
                "백준문제",
                ViewColumn.Two,
                {
                    enableScripts: true,
                    localResourceRoots: [Uri.joinPath(extensionUri, "out")],
                }
            );
            BackPanel.currentPanel = new BackPanel(panel, extensionUri);
        }
    }
    public dispose() {
        BackPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private _getWebviewContent(webview: Webview, extensionUri: Uri): string {
        const webviewUri = getUri(webview, extensionUri, ["out", "webview.js"]);
        const nonce = getNonce();
        return `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>백준문제</title>
        </head>
        <body>
        <h1>으음?"</h1>
        <vscode-button id="btn">눌러봐</vscode-button>
        <script nonce="${nonce}" src="${webviewUri}"></script>
        </body>
        </html>`;
    }
    private _setWebviewMessageListener(webview: Webview) {
        webview.onDidReceiveMessage((msg) => {
            const command = msg.command;
            const text = msg.text;

        }, null, this._disposables);
    }
}

function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
function getUri(webview: Webview, extensionUri: Uri, pathList: string[]) {
    return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
}