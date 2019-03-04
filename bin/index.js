#!/usr/bin/env node

/**
 * @Author Angus <angusyoung@mrxcool.com>
 * @Description Sauce Command-line interface
 * @Since 2019-02-26
 */

const program = require('commander');
const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const clone = require('download-git-repo');
const inquirer = require('inquirer');
const spinner = require('ora')();

require('console-colors-node');

console.log('====== Sauce ======'.green.bold);
let dir;

program
	.version('1.0.0', '-v, --version')
	.description('Sauce CLI')
	.usage('<project>')
	.command('<project>');
program.parse(process.argv);


function downloadTemplate(answers) {
	if (fs.existsSync(path.resolve(dir))) {
		spinner.fail('目录已存在'.red);
		return false;
	}
	spinner.start(`正在创建工程模板到${dir}/`.blue);
	clone('github:ay86/Sauce', dir, {clone: true}, function (err) {
		if (err) {
			spinner.fail(err.message.red);
		}
		else {
			spinner.succeed('工程模板创建完成'.green);
			initProject(answers);
		}
	});
}

function initProject(answers) {
	spinner.start('正在进行模版初始化工作'.blue);
	const sPath = path.resolve(dir);
	// 读取配置并更换
	fs.readFile(`${sPath}/package.json`, (err, buffer) => {
		if (err) {
			spinner.fail(err.message.red);
			return false;
		}
		// 移除 git 的配置
		shell.rm('-rf', `${sPath}/.git`);
		let originCfg = JSON.parse(buffer);
		Object.assign(originCfg, answers);
		fs.writeFileSync(`${sPath}/package.json`, JSON.stringify(originCfg, null, 2));

		spinner.succeed('初始化完成'.green);
		runDepend(sPath);
	});
}

function runDepend(projectPath) {
	spinner.start('安装中');
	shell.cd(dir);
	shell.ls();
}

if (!program.args.length) {
	const sProgram = process.argv[process.argv.length - 1];
	const sName = sProgram.substr(sProgram.lastIndexOf('/') + 1);
	console.log('Usage: %s <project>'.red, sName);
}
else {
	dir = program.args[0];
	const questions = [
		{
			type   : 'input',
			name   : 'name',
			message: '输入项目名称',
			default: 'my-sauce',
			validate(name) {
				return /^[a-z\-]+$/.test(name) || '项目名称必须是小写英文字母';
			}
		},
		{
			type   : 'input',
			name   : 'description',
			message: '输入项目描述',
			default: 'Sauce Demo'
		}
	];

	inquirer.prompt(questions).then(answer => {
		downloadTemplate(answer);
	});
}
