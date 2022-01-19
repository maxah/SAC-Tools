/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* global process */

const FileHound = require('filehound');
const wordsCount = require('words-count').default;
const fs = require('fs');
const _ = require('underscore');

var Directories = [];
var Projects = [];
var Files = [];
var Schema = {};
var Blocks = {};
var Outdated = {};
var words_count_total = 0;
var verbose = false;
var recount_words = false;
var check_outdated = false;

process.argv.forEach((arg, i) => {
	if (arg.startsWith('-') && i > 1) {
		arg.toLowerCase();
		switch(arg) {
			case '-h':
				if (i > 1) console.log(' [-v]: Verbose output\n [-w]: Counting the number of words in documents\n [-o]: Output the outdated pages in the documents');
				process.exit();
				break;
				
			case '-v':
				verbose = true;
				break;
				
			case '-w':
				recount_words = true;
				break;
			
			case '-o':
				check_outdated = true;
				break;
				
			default:
				console.log(`Invalid argument[${i - 1}]: ${arg}`);
				break;
		}
	}
});

if (!recount_words && !check_outdated) { console.log("No assignments. Use '-h' for help"); process.exit();}

console.log('Contributable Projects for Translations:');
const directories = FileHound.create()
	.paths('../Superalgos/Projects/')
	.directory()
	.match('Schemas')
	.find()
	.each(dir => { let arr = dir.split('\\'); console.log(`-> ${arr[3]}`); });
	
directories
	.then((dirs) => {
		console.log();
		dirs.forEach((directory) => {
			FileHound.create()
				.path(directory)
				.discard('App-Schema')
				.ext('json')
				.find()
				.then(files => {
					files.forEach(file => {
						let arr = file.split('\\'), project = arr[3], category, type, block;
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
						} catch(err) {
							console.log(err);
							return;
						}
					});
				});
		});
		
		setTimeout(() => {
			dirs.forEach((directory) => {
				FileHound.create()
					.path(directory)
					.discard('App-Schema')
					.ext('json')
					.find()
					.then(files => {
						files.forEach(file => {
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
		}, 10000);
	});

process.on('beforeExit', () => {
	//console.log(Schema);
	if (recount_words) console.log(`Words Total: ${words_count_total}`);
	if (check_outdated && Object.keys(Outdated).length) {
		console.log('Pages with outdated translations:');
		for (let lang in Outdated) {
			console.log(`${lang}:`);
			let files = Outdated[lang];
			for (let file of files) { console.log (file);}
		}
	}
	console.log('Done!');
});
		



