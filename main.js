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
const _ = require('underscore');
const EventEmitter = require('events');

class Emitter extends EventEmitter {};
const parser_events = new Emitter();

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
var lang, lang_name;

process.argv.forEach((arg, i) => {
	let str = arg.split('=')[0];
	
	if (str.startsWith('-') && i > 1) {
		str.toLowerCase();
		switch(str) {
			case '-h':
			case '--help':
				if (i > 1) console.log('Usage: node main [options] \n\nOptions:\n [-v, --verbose]: \t\t Verbose output\n [-w, --recount-words]:\t\t Counting the number of words in documents\n [-o, --check-outdated]:\t Output the outdated pages in the documents\n [-e, --empty-pages]:\t\t Pages with incomplete or blank content\n [    --check-translations=...]\t Pages with missing or incomplete translations to the selected language ([it] or Italian, [fr] or French, etc.).\n\t\t\t\t For example: node main --check-translations=en or node main --check-translations=Russian (Not case sensitive)');
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
				
			//case '-t':
			case '--check-translations':
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
				break;
				
			default:
				console.log(`Invalid argument[${i - 1}]: ${arg}`);
				break;
		}
	}
});

if (!recount_words && !check_outdated && !check_translations && !empty_pages) { console.log("No assignments. Use '-h' for help"); process.exit();}

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
			Projects.push(FileHound.create()
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
	groups.forEach((group) => {
		group.forEach(file => {
			try {
				if (recount_words) console.log(file);
				let words_count = 0, type, topic, definition;
				let obj = JSON.parse(fs.readFileSync(file));

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
	
	console.log('\nDone!');
});
		
