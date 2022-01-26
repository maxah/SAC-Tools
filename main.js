/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* global process */

const FileHound = require('filehound');
const wordsCount = require('words-count').default;
const ISO6391 = require('iso-639-1');
const fs = require('fs');
const cmd = require('node-cmd');
const _ = require('underscore');
const cliProgress = require('cli-progress');
const colors = require('ansi-colors');
const EventEmitter = require('events');

class Emitter extends EventEmitter {};
class Emitter2 extends EventEmitter {};
const parser_events = new Emitter();
const tasks_events = new Emitter2();

var Directories = [];
var Projects = [];
var Files = [];
var Schema = {};
var Blocks = {};
var Outdated = {};
var Empty_pages = [];
var No_translation = [];
var words_count_total = 0;
var verbose = false;
var recount_words = false;
var check_outdated = false;
var empty_pages = false;
var check_translations = false;
var translation_commiter = false;
var new_pages = false;
var lang, lang_name, regexp, begin, end, begin_ts, end_ts;

const basedir = '../Superalgos';

const date = new Date();
var m = date.getMonth() + 1;
var month = (m < 10) ? ('0' + m) : m;
var day = date.getDate().toString();
var year = date.getFullYear().toString();

process.argv.forEach((arg, i) => {
	let str = arg.split('=')[0];
	
	if (str.startsWith('-') && i > 1) {
		str.toLowerCase();
		switch(str) {
			case '-h':
			case '--help':
				if (i > 1) { 
					console.log('Usage: node main [options] \n\nOptions:\n[-v, --verbose]: \t\t Verbose output');
					console.log('[-w, --recount-words]:\t\t Counting the number of words in documents');
					console.log('[-o, --check-outdated]:\t\t Output the outdated pages in the documents');
					console.log('[-e, --empty-pages]:\t\t Pages with incomplete or blank content');
					console.log('[    --check-translations=...]\t Pages with missing or incomplete translations to the selected language ([it] or Italian, [fr] or French, etc.)');
					console.log('\t\t\t\t For example: node main --check-translations=ru or node main --check-translations=Russian (Not case sensitive)');
					console.log('[    --translation-commiter=...] Displaying the date and time of changes made to translations into the selected language and the name of the editor for each file');															
					console.log('\t\t\t\t For example: node main --translation-commiter=ru or node main --translation-commiter=Russian (Not case sensitive)');
					console.log('[-n, --new-pages=[begin:end]]\t Display a list of new pages added to the documentation for the current month or for the period from [begin] to [end].');			
					console.log('[    --new-pages=[begin]]\t If [end] is not specified, then up to the present.The date format is "YYYY-MM-DD".');
					console.log('\t\t\t\t Without parameters it is displayed for the current month.');
					console.log('\t\t\t\t Examples: node main --new-pages=2021.01.01:2022.01.07, node main --new-pages=2022.01.01');
				}												 
				process.exit();
				break;
				
			case '-v':
			case '--verbose':
				verbose = true;
				break;
				
			case '-w':
			case '--recount-words':
				recount_words = true;
				break;
			
			case '-o':
			case '--check-outdated':
				check_outdated = true;
				break;
				
			case '-e':
			case '--empty-pages':
				empty_pages = true;
				break;
				
			//case '-c':
			case '--translation-commiter':
				if (_.last(arg.split('=')) === '') { console.warn(`Enter the code or language name according to ISO-639-1`); process.exit(); }
				let L = _.last(arg.split('=')), Ll = L[0].toUpperCase().concat(L.slice(1).toLowerCase()), l = L.toLowerCase(), valid, name, code;
				
				valid = ISO6391.validate(l);
				name = (ISO6391.getName(l).length) ? ISO6391.getName(l) : false;
				code = (ISO6391.getCode(Ll).length) ? ISO6391.getCode(Ll) : false;
				
				if (!name && !code) { 
					if (!name) console.warn(`The language code is not specified by ISO-639-1 to the given native name [${Ll}]`);
					if (!code) console.warn(`The code [${l}] is not listed in ISO-639-1`);
				} else  if (valid || code || name) {
					if (valid) { lang_name = ISO6391.getName(l); lang = l.toUpperCase();}
					else if (code) { lang_name = Ll; lang = ISO6391.getCode(Ll).toUpperCase();}
					else if (name) { lang_name = name; lang = ISO6391.getCode(name).toUpperCase();}
					
					translation_commiter = true;
					regexp = new RegExp(`"language": "${lang}"`);
					//console.log (lang_name, lang, regexp);	
				}
				break;
				
			//case '-t':
			case '--check-translations':
				if (!lang && !lang_name) {
					if (_.last(arg.split('=')) === '') { console.warn(`Enter the code or language name according to ISO-639-1`); process.exit(); }
					let L = _.last(arg.split('=')), Ll = L[0].toUpperCase().concat(L.slice(1).toLowerCase()), l = L.toLowerCase(), valid, name, code;
					valid = ISO6391.validate(l);
					name = (ISO6391.getName(l).length) ? ISO6391.getName(l) : false;
					code = (ISO6391.getCode(Ll).length) ? ISO6391.getCode(Ll) : false;

					if (!name && !code) { 
						if (!name) console.warn(`The language code is not specified by ISO-639-1 to the given native name [${Ll}]`);
						if (!code) console.warn(`The code [${l}] is not listed in ISO-639-1`);
					} else  if (valid || code || name) {
						if (valid) { lang_name = ISO6391.getName(l); lang = l.toUpperCase();}
						else if (code) { lang_name = Ll; lang = ISO6391.getCode(Ll).toUpperCase();}
						else if (name) { lang_name = name; lang = ISO6391.getCode(name).toUpperCase();}

						check_translations = true;
						//console.log (lang_name, lang);	
					}
				}
				break;
				
			case '-n':
				begin = { d: '01', m: month, y: year }; begin_ts = Date.parse(begin);
				end = { d: day, m: month, y: year }; end_ts = Date.parse(end);
				new_pages = true;
				break;
				
			case '--new-pages':
				let a = _.last(arg.split('=')), [ b, e ] =  a.split(':');
				
				if (b) {
					let [ y, m , d] = b.split('-');
					if(d && m && y) { begin = { d: '01', m: m, y: y }; begin_ts = Date.parse(b);} 
					else { console.log('The [begin] date format is not followed.'); process.exit();}
				} else { console.log(`The mandatory parameter [begin] is not specified`); process.exit();}
				
				if (e) {
					let [y, m, d] = e.split('-');
					if(d && m && y) { end = { d: d, m: m, y: y }; end_ts = Date.parse(e);}  else { console.log('The [end] date format is not followed.'); process.exit();}
				} else { end = { d: day, m: month, y: year };  end_ts = Date.now();};
				new_pages = true;
				break;
				
			default:
				console.log(`Invalid argument[${i - 1}]: ${arg}`);
				break;
		}
	}
});

if (!recount_words && !check_outdated && !check_translations && !empty_pages && !translation_commiter && !new_pages) 
	{ console.log("No assignments. Use '-h' for help"); process.exit();}

const bar = new cliProgress.SingleBar({
		format: 'Progress [' + colors.cyan('{bar}') + '] {percentage}% | {value}/{total} | {file}',
		barCompleteChar: '\u2588',
		barIncompleteChar: '\u2591',
		hideCursor: true
	});

console.log('Contributable Projects for Translations:');
FileHound.create()
	.paths('../Superalgos/Projects/')
	.directory()
	.match('Schemas')
	.find()
	.each(dir => { let arr = dir.split('\\'); console.log(`-> ${arr[3]}`);})
	.then(directories => {
		console.log();
		directories.forEach((directory) => {
			Projects.push(
				FileHound.create()
					.path(directory)
					.discard('App-Schema')
					.ext('json')
					.find()
			);	
		});		  
	
		Promise.all(Projects).then((groups) => {
			groups  = _.reject(groups, function (elem) { return !elem.length;});
			groups.forEach((group, gi) => {
				group.forEach((file, fi) => {
					let arr = file.split('\\'), project = arr[3], category, type, block, translated = true;
					let isBlock;

					switch (arr[5]) {
						case 'Docs-Nodes':
							category = 'Node';
							break;

						case 'Docs-Concepts':
							category = 'Concept';
							break;

						case 'Docs-Topics':
							category = 'Topic';
							break;

						case 'Docs-Tutorials':
							category = 'Tutorial';
							break;

						case 'Docs-Reviews':
							category = 'Review';
							break;

						case 'Docs-Books':
							category = 'Book';
							break;

						default: 
							console.warn(`No category is assigned for --> ${arr[5]}`);
							break;
					}

					try {
						let type, topic;
						let obj = JSON.parse(fs.readFileSync(file));

						type = obj.type;

						if (_.has(obj, 'topic')) {
							topic = obj.topic;
						}

						if (_.has(obj, 'definition')) { 
							if (!_.has(Schema, project)) { Schema[project] = {}; }
							if (!_.has(Schema[project], category)) { Schema[project][category]= {}; }
							if (!_.has(Schema[project][category], type)) { Schema[project][category][type] = {}; } 

							Schema[project][category][type]['Definition'] = obj.definition;
							if (check_outdated && obj.definition.updated && obj.definition.translations) {
								let update_time = obj.definition.updated;
								obj.definition.translations.forEach(item => {
									if (update_time > item.updated) {
										if (!_.has(Outdated, item.language)) Outdated[item.language] = [];
										if (!_.contains(Outdated[item.language], file)) Outdated[item.language].push(file);
									}
								});
							}

							if (empty_pages && (obj.definition.text.startsWith('Write the definition for this Node') 
									  || obj.definition.text.startsWith('Right click to edit')
									  || obj.definition.text.startsWith('Right click and Edit')
									  || obj.definition.text.startsWith('Right click and select')
									  || obj.definition.text.length === 0)) {
								Empty_pages.push(file);
							}

							if (check_translations) {
								if (obj.definition.translations && translated) {
									translated = _.some(obj.definition.translations, function (item) { return item.language = lang; });
								} else translated = false;
							}
						}

						if (_.has(obj, 'paragraphs')) { 
							let paragraphs = obj.paragraphs;
							paragraphs.forEach(p => {								
								switch (p.style) {
									case 'Block':
										isBlock = true;
										block = p.text;
										break;

									case 'Summary':
									case 'Text':
										if (empty_pages && (p.text.startsWith('Right click and Edit')
												  || p.text.startsWith('Right click and select'))) { Empty_pages.push(file);}
									case 'Title':
									case 'Subtitle':
									case 'List':
									case 'Table':
									case 'Success':
									case 'Note':
									case 'Important':
									case 'Callout':
										if (check_outdated && p.updated && p.translations) {
											let update_time = p.updated;
											p.translations.forEach(item => {
												if (update_time > item.updated) {
													if (!_.has(Outdated, item.language)) Outdated[item.language] = [];
													if (!_.contains(Outdated[item.language], file)) Outdated[item.language].push(file);
												}
											});
										}
										break;

										if (check_translations) {
											if (p.translations && translated) {
												translated = _.some(p.translations, function (item) { return item.language = lang;});
											} else translated = false;
										}

									case 'Include':								
										let includeText = p.text;

										if (_.has(Blocks, includeText)) {} else {
											Blocks[includeText] = { name: includeText, wordCount: 0 };
										}
										break;
								}

								if (isBlock && category) { 
									if (!_.has(Schema, project)) { Schema[project] = {}; }
									if (!_.has(Schema[project], category)) { Schema[project][category] = {}; }
									if (!_.has(Schema[project][category], type)) { Schema[project][category][type] = {}; } 
									if (!_.has(Schema[project][category][type], block)) { Schema[project][category][type][block] = []; } 
									if (!Array.isArray(Schema[project][category][type][block])) { console.log(`${project}->${category}->${type}->${block}`); }
									Schema[project][category][type][block].push(p);
									//console.log(Schema[project][category][type][block]);
									//console.log(`${project}->${category}->${type}->${block}`);
								} 
							});
						}
					} catch (err) {
						console.log(err);
						return;
					}

					if (check_translations && !translated) No_translation.push(file); 
					if (gi === (groups.length - 1) && fi === (group.length - 1)) { setTimeout(() => { parser_events.emit('end', groups);}, 3000 );}
				});
			});
		});
	});	
	
parser_events.on('end', (groups) => {
	if (new_pages) { let len = 0; _.each(groups, function (a) { len += a.length;}); bar.start(len, 0); bar.update({ file: ''});}
	groups.forEach((group, gi) => {
		group.forEach((file, fi) => {
			try {
				if (recount_words || translation_commiter) console.log(file);
				let words_count = 0, type, topic, definition;
				let obj = JSON.parse(fs.readFileSync(file));

				if (translation_commiter || new_pages) {
					let tmp = file.split('\\'), f = tmp.slice(2).join('/'), fno = _.last(tmp), fn = (fno.length > 50) ? '...'.concat(fno.slice(-50)) : _.last(tmp);
					let git_cmd = cmd.runSync(`cd ${basedir} && git blame ${f}`);
					
					if (git_cmd.err) { console.log(`Sync err: ${git_cmd.err}`);};
					if (git_cmd.stderr) { console.log(`Sync stderr: ${git_cmd.stderr}`);};
					if (git_cmd.data) {
						let data = git_cmd.data, text = data.split('\n');
						if (translation_commiter) {
							text.forEach(line  => {
								if  (regexp.test(line)) {
									console.log(line.split('(').pop().split(')').shift());
								}
							});
						}
						
						if (new_pages) {
							let t = _.first(text), ts = Date.parse(t.split('(').pop().split(')').shift().split(' +').shift().slice(-19).split(' ').shift());
							bar.increment(); bar.update({ file: fn });
							if (begin_ts <= ts && ts <= end_ts) { Files.push(file);}
							if (gi === (groups.length - 1) && fi === (group.length - 1)) { setTimeout(() => { tasks_events.emit('complete');}, 3000 );}
						}
					}
				} 
				
				type = obj.type;

				if (_.has(obj, 'topic')) {
					topic = obj.topic;
				}

				if (_.has(obj, 'definition')) { 
					definition = obj.definition;
					if (definition.text) {
						words_count += wordsCount(definition.text);
					}
				}

				if (_.has(obj, 'paragraphs')) { 
					let paragraphs = obj.paragraphs;
					paragraphs.forEach((p, i) => {
						switch (p.style) {
							case 'Summary':
							case 'Text':
							case 'Title':
							case 'Subtitle':
							case 'List':
							case 'Table':
							case 'Success':
							case 'Note':
							case 'Important':
							case 'Callout':
								if (p.text) { words_count += wordsCount(p.text);}
								break;

							case 'Include':								
								let includeText = p.text;
								let splittedIncludeText = includeText.split('->'); 
								let project = splittedIncludeText[0];
								let category = splittedIncludeText[1];
								let type = splittedIncludeText[2];
								let block =  splittedIncludeText[3];

								if (Schema[project][category][type][block]) {
									if (Array.isArray(Schema[project][category][type][block])) {
										Schema[project][category][type][block].forEach(ip  => {
											switch (ip.style) {
												case 'Summary':
												case 'Text':
												case 'Title':
												case 'Subtitle':
												case 'List':
												case 'Table':
												case 'Success':
												case 'Note':
												case 'Important':
												case 'Callout':
													if (ip.text) {
														let wcount = wordsCount(ip.text);
														words_count += wcount;
														Blocks[includeText].wordCount += wcount;
													}
													break;
											};
										});
										obj.paragraphs[i].content = Schema[project][category][type][block];
									} else if (Schema[project][category][type][block].text) {
										let wcount = wordsCount(Schema[project][category][type][block].text);
										Blocks[includeText].wordCount = wcount;
										words_count += wcount;
										obj.paragraphs[i].content = Schema[project][category][type][block].text;
									}
									obj.paragraphs[i].included_words_count = Blocks[includeText].wordCount;
								} else {}
								break;

							default:
								break;
						}
					});
				}

				if (words_count) {
					if (recount_words) {
						if (verbose) console.log(obj);
						console.log(`words: ${words_count}\n`);
					}
					words_count_total += words_count;
				}
			} catch(err) {
				console.log(err);
				return;
			}
		});
	});
});

tasks_events.on('complete', () => {
	bar.stop();
});

process.on('beforeExit', () => {
	//console.log(Schema);
	if (recount_words) console.log(`Words Total: ${words_count_total}`);
	if (check_outdated && Object.keys(Outdated).length) {
		console.log('Pages with outdated translations:');
		for (let l in Outdated) {
			console.log(`${l}:`);
			let files = Outdated[l];
			for (let file of files) { console.log (file);}
		}
	}
	
	if (empty_pages) {
		console.log();
		console.log('Pages with incomplete or blank content:');
		Empty_pages =  _.uniq(Empty_pages);
		Empty_pages.forEach(page => console.log(page));
		console.log(`Total: ${Empty_pages.length}`);
	}
	
	if (check_translations) {
		console.log();
		console.log(`Pages with missing or incomplete translations to ${lang_name} [${lang}]:`);
		No_translation = _.uniq(No_translation);
		No_translation.forEach(page => console.log(page));
		console.log(`Total: ${No_translation.length}`);
	}
	
	if (new_pages) {
		bar.stop();
		console.log();
		console.log(`Pages added from ${begin.d}-${begin.m}-${begin.y} to ${end.d}-${end.m}-${end.y}`);
		if (Files.length) Files.forEach(page => console.log(page));
		else console.log('No new pages found');
	}
	
	console.log('\nDone!');
});
		
