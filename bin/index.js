#!/usr/bin/env node

/**
 * @Author Angus <angusyoung@mrxcool.com>
 * @Description Sauce Command-line interface
 * @Since 2019-02-26
 */

import { program } from 'commander';
import shell from 'shelljs';
import fs from 'node:fs';
import path from 'node:path';
import clone from 'download-git-repo';
import inquirer from 'inquirer';
import ora from 'ora';
import 'console-colors-node';

const spinner = ora();

const questions = [
	{
		type   : 'input',
		name   : 'name',
		message: '输入项目名称：',
		default: 'my-sauce',
		validate(name) {
			return /^[a-z0-9\-]+$/.test(name) || '项目名称必须是小写英文字母、数字、-、_组成';
		}
	},
	{
		type   : 'input',
		name   : 'description',
		message: '输入项目描述：',
		default: 'Sauce Demo'
	},
	{
		type   : 'list',
		name   : 'template',
		message: '选择模版：',
		choices: [
			{name: 'Vue 2 + SaUI', value: 'vue2', short: 'Vue 2'},
			{name: 'Vue 3 + VbUI', value: 'vue3', short: 'Vue 3'}
		],
		default: 'vue3'
	},
	{
		type   : 'confirm',
		name   : 'install',
		message: '是否开始安装？',
		default: true
	}
];

program
		.name('sauce-cli')
		.version('1.5.0', '-v, --version')
		.description('Sauce CLI -> Create a new Sauce application');

program
		.argument('<project>')
		.action((project) => {
			const pwd = project;
			inquirer.prompt(questions).then(answer => {
				if (answer.install) {
					downloadTemplate(pwd, answer);
				}
				else {
					cancel();
				}
			}).catch(cancel);
		});

program.parse();

function handleError(message) {
	spinner.fail(message.red);
}

function cancel() {
	handleError('取消安装');
}

async function downloadTemplate(dir, answers) {
	if (fs.existsSync(path.resolve(dir))) {
		spinner.warn(`目录${ dir }已存在`.yellow);
		const overwrite = await inquirer.prompt([
			{
				type   : 'confirm',
				name   : 'overwrite',
				message: '是否覆盖原有文件继续？',
				default: false
			}
		]).then(answer => answer.overwrite).catch(() => false);
		if (!overwrite) {
			cancel();
			return false;
		}
		// 	清空原目录
		spinner.start('正在清空原文件'.blue);
		shell.rm('-rf', path.resolve(dir));
		spinner.succeed('原文件已删除');
	}
	spinner.start(`正在创建工程模板到${ dir }/`.blue);
	const branch = answers.template === 'vue2' ? 'vue2old' : 'master';
	clone(`github:ay86/Sauce#${ branch }`, dir, {clone: true}, function(err) {
		if (err) {
			handleError(err.message);
		}
		else {
			spinner.info('工程模板创建完成'.blue.bold);
			initProject(dir, answers);
		}
	});
}

function initProject(dir, answers) {
	spinner.start('正在进行模版初始化工作'.blue);
	const projectPath = path.resolve(dir);
	// 读取配置并更换
	fs.readFile(`${ projectPath }/package.json`, (err, buffer) => {
		if (err) {
			handleError(err.message);
			return false;
		}
		// 移除 git 的配置
		shell.rm('-rf', `${ projectPath }/.git`);
		let originCfg = JSON.parse(buffer);
		Object.assign(originCfg, {
			version    : '1.0.0',
			author     : process.env.USER,
			name       : answers.name,
			description: answers.description,
		});
		fs.writeFileSync(`${ projectPath }/package.json`, JSON.stringify(originCfg, null, 2));
		spinner.info('初始化完成'.blue.bold);
		runDepend(dir, projectPath);
	});
}

function runDepend(dir, projectPath) {
	spinner.start('安装中'.blue);
	// shell.cd(dir);
	// shell.exec('npm i', {silent: true});
	spinner.stopAndPersist({
		symbol: '🚀',
		text  : `安装完成，${ projectPath }`.bold
	});
	console.log(`\n运行以下命令启动：\n  cd ${ dir }\n  npm install\n  npm run dev`);
}

console.log(`
 ______     ______     __  __     ______     ______    
/\\  ___\\   /\\  __ \\   /\\ \\/\\ \\   /\\  ___\\   /\\  ___\\   
\\ \\___  \\  \\ \\  __ \\  \\ \\ \\_\\ \\  \\ \\ \\____  \\ \\  __\\   
 \\/\\_____\\  \\ \\_\\ \\_\\  \\ \\_____\\  \\ \\_____\\  \\ \\_____\\ 
  \\/_____/   \\/_/\\/_/   \\/_____/   \\/_____/   \\/_____/ 
                                                       
`.green.bold);
