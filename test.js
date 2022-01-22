/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

const cmd = require('node-cmd');
const txt_json = require('txt-file-to-json');

const basedir = '../Superalgos';
const file = 'Projects/Foundations/Schemas/Docs-Tutorials/W/Welcome/Welcome-to-Superalgos/welcome-to-superalgos-091-tutorial-step-lets-start-with-100-bucks.json';
const template = 'hash file commiter date time unknown unknown2 text\n';

cmd.run(`cd ${basedir} && git blame ${file}`,
	function (err, data, stderr) {
		if (err)
			console.log('err : ', err.message);
		if (stderr)
			console.log('stderr : ', stderr);
		if (data) {
			//console.log(data);
			//let text = template.concat(data);
			let text = data.split('\n');
//			const dataInJSON = txt_json({ data: text });
//			console.log(dataInJSON);
			//let re = /"language": "DE"/;
			let lang = 'DE';
			let str =`"language": "${lang}"`;
			let re = new RegExp(str);
			text.forEach(line  => {
				if  (re.test(line)) {
					//console.log(line);
					console.log(line.split('(').pop().split(')').shift());
				}
			});
		}
	});