// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { parse } from 'node-html-parser';
import { BackPanel } from './panel/Back';
// import { provideVSCodeDesignSystem, vsCodeDivider } from '@vscode/webview-ui-toolkit';
export function activate(context: vscode.ExtensionContext) {
	let current_value = 0;
	let open_text_document: vscode.TextDocument | undefined = undefined;
	let python_command_path: string | undefined = undefined;
	let currentPanel: vscode.WebviewPanel | undefined = undefined;
	let disposable = vscode.commands.registerCommand('backjoon.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from backjoon!');
	});
	let query_container: any = {};
	// let backjoon_class = vscode.commands.registerCommand("backjoon.class", () => {
	// 	BackPanel.render(context.extensionUri);
	// });
	// context.subscriptions.push(backjoon_class);

	context.subscriptions.push(disposable);
	vscode.workspace.onDidChangeConfiguration(event => {
		let affected = event.affectsConfiguration("python.defaultInterpreterPath");
		console.log(event);
		if (affected) {
			console.log(affected);
		}
	});

	const excute_python = async (input_string: string) => {
		const extension = vscode.extensions.getExtension("ms-python.python");
		if (extension === undefined) { return; }
		if (extension && !extension.isActive) {
			await extension.activate();
		}
		const command = extension.exports.settings.getExecutionDetails().execCommand;
		python_command_path = command[0];
		if (python_command_path === undefined) { return; };
		if (vscode.workspace.workspaceFolders === undefined) { return; };
		const current_path_folder = vscode.workspace.workspaceFolders[0];
		const file_path = path.join(current_path_folder.uri.fsPath, current_value.toString() + ".py");
		// console.log("인풋수투링", python_command_path);
		// console.log("실행패수", file_path);
		const result = spawnSync(python_command_path, [file_path], {
			input: input_string,
			encoding: 'utf-8'
		});
		return {
			stdout: result.stdout.toString(),
			stderr: result.stderr.toString(),
		};
	};
	context.subscriptions.push(vscode.commands.registerCommand("backjoon.python", async () => {




	}));
	context.subscriptions.push(vscode.commands.registerCommand('backjoon.webview', async () => {
		vscode.window.showInputBox().then(async (value) => {
			console.log(value);
			if (value === undefined) {
				return;
			}
			if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
				console.log("실행");
				const current_path_folder = vscode.workspace.workspaceFolders[0];
				const file_path = path.join(current_path_folder.uri.fsPath, value + ".py");
				const is_file = fs.existsSync(file_path);
				query_container = {};
				if (!is_file) {
					fs.writeFileSync(file_path, "");
				}
				current_value = Number(value);
				open_text_document = await vscode.workspace.openTextDocument(file_path);
				await vscode.window.showTextDocument(open_text_document, { viewColumn: vscode.ViewColumn.One });


			}
			const python = vscode.workspace.getConfiguration('python.defaultInterpreterPath');
			console.log(python);


			if (currentPanel === undefined) {
				currentPanel = vscode.window.createWebviewPanel("일단뷰", "뷰", {
					viewColumn: vscode.ViewColumn.Two
				}, {
					enableScripts: true,
					enableForms: true,
				});
				currentPanel.webview.onDidReceiveMessage(async (msg) => {
					console.log(msg);
					if (msg.command === "request_grade") {
						await open_text_document?.save();
						const result = await excute_python(msg.text);
						console.log(result);
						if (result) {
							const result_string = result.stderr.toString() ? result.stderr.toString() : result.stdout.toString();
							query_container[msg.idx] = {
								input: msg.text,
								output: result_string,
							};
							getWebviewContent(value, query_container).then(r => {
								if (currentPanel === undefined) { return; }
								currentPanel.webview.html = r;
							});
						}
					}
				}, undefined, context.subscriptions);
				currentPanel.onDidDispose((e) => {
					console.log("dispose");
					currentPanel = undefined;
				});
			}
			getWebviewContent(value).then(r => {
				if (currentPanel === undefined) { return; }
				currentPanel.webview.html = r;
			});
		});
	}
	));
}


async function getWebviewContent(value: string, query_container: any = {}) {
	const res = await fetch("https://www.acmicpc.net/problem/" + value);
	const text = (await res.text());
	const html = parse(text);
	const title = (html.querySelector('title')?.innerText) ?? "모름";
	const table = html.querySelector('table');
	const description = html.querySelector('div#problem_description');
	const input_description = html.querySelector('div#problem_input');
	const output_description = html.querySelector('div#problem_output');
	const datas = html.querySelectorAll("pre.sampledata");

	let data_container = ``;

	let idx = 0;
	for (let i = 0; i < datas.length; i += 2) {


		data_container += `<div class="container border">
		<div>
		<form class="row g-3">
		<div class="col-sm-4 col-4">
		<label class="form-control" for="input${idx}">입력</lable>
		<textarea class="form-control" id="input${idx}" >${query_container[idx] ? query_container[idx]["input"] : datas[i].innerText}</textarea>
		</div>
		<div class="col-sm-4 col-4">
		<label class="form-control" for="result${idx}">내 출력</lable>
		<textarea class="form-control" id="result${idx}" >${query_container[idx] ? query_container[idx]["output"] : ""}</textarea>
		</div>
		<div class="col-sm-4 col-4">
		<label class="form-control" for="output${idx}">예상출력</lable>
		<textarea class="form-control" id="output${idx}" >${datas[i + 1].innerText}</textarea>
		</div>
		</form>
		<button type="" class="btn btn-primary" onclick="send_data(${idx})">테스트</button>
		</div>

		</div>`;
		idx++;

	}

	return `<!DOCTYPE html>
  <html lang="ko">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">

      <style>
      table{
        text-align:center;
      }
      </style>
	  <script>
	  const vscode = acquireVsCodeApi();
	  function hello(){
		  vscode.postMessage({
			command:'start',
			text:'hello'
			
		  })
	  }
	  function send_data(idx){
		const input_value = document.getElementById("input"+idx).value
		vscode.postMessage({
			command:"request_grade",
			text:input_value,
			idx:idx
		})
	  }	
	  window.onload = function(){
		vscode.postMessage({command:"startup"})
		console.log("html started up")
	  }
	  </script>
      <title>${title}</title>
  </head>
  <body>
    <h2>${title}</h2>
	${table}
	<div><h4>문제</h4></div>

    ${description}
	<div><h4>입력</h4></div>
	<vscode-divider></vscode-divider>
	${input_description}
	<div><h4>출력</h4></div>
	<vscode-divider></vscode-divider>
	${output_description}
	<div>
	${data_container}
	</div>
  </body>
  <script>
  
  </script>
  </html>`;
}


// This method is called when your extension is deactivated
export function deactivate() { }



