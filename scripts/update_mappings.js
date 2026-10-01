/*
 * OpenedShelf - A brutally efficient edge architecture for readers at the margins.
 * Copyright (C) 2026 Anita Ruetz
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import fs from 'node:fs';

let content = fs.readFileSync('build/v2/src/seed_mappings.js', 'utf8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes("['genre:soft_scifi'"));
const endIndex = lines.findIndex(l => l.includes("['genre:spiritual'"));

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find start/end indices");
    process.exit(1);
}

const replacement = `    // --- SCI-FI ---
    ['genre:soft_scifi', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%social science fiction%", "%sociological%"]],
    ['genre:military_scifi', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%military science fiction%", "%space warfare%"]],
    ['genre:alternate_history', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%alternative history%", "%imaginary histories%"]],
    ['genre:space_western', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%interplanetary voyages%", "%frontier and pioneer life%"]],
    ['genre:clifi', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%climatic changes fiction%", "%environmental degradation%"]],
    ['genre:biopunk', "short_synopsis LIKE ?", ["%biotechnology fiction%"]],
    ['genre:nanopunk', "short_synopsis LIKE ?", ["%nanotechnology fiction%"]],
    ['genre:silkpunk', "short_synopsis LIKE ?", ["%asian mythology fiction%"]],
    
    // --- FANTASY ---
    ['genre:high', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%high fantasy%", "%epic fantasy%"]],
    ['genre:low', "short_synopsis LIKE ?", ["%low fantasy%"]],
    ['genre:urban', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%urban fantasy%", "%city and town life fiction%"]],
    ['genre:portal', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%parallel universes fiction%", "%imaginary places%"]],
    ['genre:xianxia', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%xianxia%", "%chinese mythology fiction%"]],
    ['genre:mythic_retellings', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%mythology fiction%", "%folklore adaptation%"]],
    
    // --- MULTI-PARENT SCOPED (Cozy, Gothic, Dark, Historical) ---
    ['genre:cozy', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%cozy mystery%", "%gentle mystery%"], 'genre:mystery'],
    ['genre:cozy', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%cozy fantasy%", "%gentle fantasy%"], 'genre:fantasy'],
    ['genre:gothic', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%gothic horror%", "%gothic fiction%"], 'genre:horror'],
    ['genre:gothic', "short_synopsis LIKE ?", ["%gothic romance%"], 'genre:romance'],
    ['genre:gothic', "short_synopsis LIKE ?", ["%gothic fantasy%"], 'genre:fantasy'],
    ['genre:gothic', "short_synopsis LIKE ?", ["%gothic mystery%"], 'genre:mystery'],
    ['genre:gothic', "short_synopsis LIKE ?", ["%gothic poetry%"], 'genre:poetry'],
    ['genre:dark', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%dark fantasy%", "%antiheroes fiction%"], 'genre:fantasy'],
    ['genre:dark', "short_synopsis LIKE ?", ["%dark romance%"], 'genre:romance'],
    ['genre:dark', "short_synopsis LIKE ?", ["%dark comedy%"], 'genre:humor'],
    ['genre:historical', "short_synopsis LIKE ?", ["%historical fantasy%"], 'genre:fantasy'],
    ['genre:historical', "short_synopsis LIKE ?", ["%historical romance%"], 'genre:romance'],
    ['genre:historical', "short_synopsis LIKE ?", ["%historical mystery%"], 'genre:mystery'],
    ['genre:historical', "short_synopsis LIKE ?", ["%historical thriller%"], 'genre:thriller'],
    ['genre:historical', "short_synopsis LIKE ?", ["%historical adventure%"], 'genre:adventure'],
    ['genre:historical', "short_synopsis LIKE ?", ["%military history%"], 'genre:war_fiction'],
    ['genre:historical', "short_synopsis LIKE ?", ["%historical biography%"], 'genre:biography_memoir'],

    // --- DYSTOPIAN ---
    ['genre:theocracy', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%religion and state fiction%", "%religious fundamentalism fiction%"]],
    ['genre:totalitarian', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%totalitarianism fiction%", "%dictatorship fiction%"]],
    ['genre:technocracy', "short_synopsis LIKE ?", ["%technocracy fiction%"]],
    ['genre:environmental_collapse', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%environmental disaster fiction%", "%ecological fiction%"]],
    ['genre:cyberpunk_dystopia', "short_synopsis LIKE ?", ["%cyberpunk fiction%"]],
    ['genre:bureaucratic_nightmare', "short_synopsis LIKE ?", ["%bureaucracy fiction%"]],
    
    // --- HORROR ---
    ['genre:cosmic', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%cosmic horror%", "%lovecraftian%"]],
    ['genre:body', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%body horror%", "%mutation fiction%"]],
    ['genre:folk', "short_synopsis LIKE ?", ["%folk horror%"]],
    ['genre:comedy', "short_synopsis LIKE ?", ["%horror comedy%"], 'genre:horror'],
    ['genre:sci_fi', "(ol_subjects LIKE ? OR ol_subjects LIKE ? OR ol_genres LIKE ? OR ol_genres LIKE ?) AND (ol_subjects LIKE ? OR ol_genres LIKE ? OR short_synopsis LIKE ?)", ["%science fiction%", "%sci-fi%", "%science fiction%", "%sci-fi%", "%horror%", "%horror%", "%sci-fi horror%"], 'genre:horror'],
    
    // --- MULTI-PARENT SCOPED (Psychological, Medical, Political, Corporate, Domestic) ---
    ['genre:psychological', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%psychological horror%", "%mental illness fiction%"], 'genre:horror'],
    ['genre:psychological', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%psychological thriller%", "%psychological suspense%"], 'genre:thriller'],
    ['genre:psychological', "short_synopsis LIKE ?", ["%psychological realism%"], 'genre:historical_fiction'],
    ['genre:medical', "short_synopsis LIKE ?", ["%medical mystery%"], 'genre:mystery'],
    ['genre:medical', "short_synopsis LIKE ?", ["%medical crime%"], 'genre:true_crime'],
    ['genre:political', "short_synopsis LIKE ?", ["%political thriller%"], 'genre:thriller'],
    ['genre:political', "short_synopsis LIKE ?", ["%political crime%"], 'genre:true_crime'],
    ['genre:political', "short_synopsis LIKE ?", ["%political history%"], 'genre:history'],
    ['genre:political', "short_synopsis LIKE ?", ["%political biography%"], 'genre:biography_memoir'],
    ['genre:corporate', "short_synopsis LIKE ?", ["%corporate thriller%"], 'genre:thriller'],
    ['genre:corporate', "short_synopsis LIKE ?", ["%corporate culture%"], 'genre:business_finance'],
    ['genre:domestic', "short_synopsis LIKE ?", ["%domestic thriller%"], 'genre:thriller'],
    ['genre:domestic', "short_synopsis LIKE ?", ["%domestic crime%"], 'genre:true_crime'],

    // --- THRILLER / MYSTERY ---
    ['genre:techno', "short_synopsis LIKE ?", ["%techno thriller%"], 'genre:thriller'],
    ['genre:scientific', "short_synopsis LIKE ?", ["%scientific thriller%"], 'genre:thriller'],
    ['genre:scientific', "short_synopsis LIKE ?", ["%scientific biography%"], 'genre:biography_memoir'],
    ['genre:small_town', "short_synopsis LIKE ?", ["%small town mystery%"]],
    ['genre:tactical', "short_synopsis LIKE ?", ["%tactical thriller%"]],
    ['genre:epic_suspense', "short_synopsis LIKE ?", ["%epic suspense%"]],
    ['genre:cryptic', "short_synopsis LIKE ?", ["%cryptic mystery%"]],
    ['genre:biological_suspense', "short_synopsis LIKE ?", ["%biological suspense%"]],
    ['genre:manipulation', "short_synopsis LIKE ?", ["%manipulation%"]],
    ['genre:syndicate', "short_synopsis LIKE ?", ["%syndicate%"]],
    ['genre:traditional', "short_synopsis LIKE ?", ["%traditional mystery%"]],
    ['genre:caper', "short_synopsis LIKE ?", ["%caper%"]],
    ['genre:true_crime_inspired', "short_synopsis LIKE ?", ["%true crime inspired%"]],
    ['genre:occult', "short_synopsis LIKE ?", ["%occult detective%"]],
    ['genre:private_investigator', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%private investigator%", "%private eye%"]],
    ['genre:hard_boiled', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%hard boiled%", "%hardboiled%"]],
    ['genre:noir_aesthetic', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%noir fiction%", "%noir%"]],
    ['genre:gentleman_thief', "short_synopsis LIKE ?", ["%gentleman thief%"]],
    ['genre:forensic_analysis', "short_synopsis LIKE ?", ["%forensic science fiction%"]],
    ['genre:international', "short_synopsis LIKE ?", ["%international mystery%"], 'genre:mystery'],
    ['genre:culinary', "short_synopsis LIKE ?", ["%culinary mystery%"], 'genre:mystery'],
    ['genre:culinary', "short_synopsis LIKE ?", ["%culinary biography%"], 'genre:biography_memoir'],

    // --- ROMANCE ---
    ['genre:western', "short_synopsis LIKE ?", ["%western romance%"], 'genre:romance'],
    ['genre:sports', "short_synopsis LIKE ?", ["%sports romance%"], 'genre:romance'],
    ['genre:new_adult', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%new adult fiction%", "%college students fiction%"]],
    ['genre:taboo', "short_synopsis LIKE ? OR short_synopsis LIKE ?", ["%forbidden love fiction%", "%social norms fiction%"]],
    
    // --- MULTI-PARENT SCOPED (Contemporary, Adventure, Military) ---
    ['genre:contemporary', "short_synopsis LIKE ?", ["%contemporary romance%"], 'genre:romance'],
    ['genre:contemporary', "short_synopsis LIKE ?", ["%contemporary history%"], 'genre:history'],
    ['genre:contemporary', "short_synopsis LIKE ?", ["%contemporary war%"], 'genre:war_fiction'],
    ['genre:contemporary', "short_synopsis LIKE ?", ["%contemporary realism%"], 'genre:historical_fiction'],
    ['genre:adventure', "short_synopsis LIKE ?", ["%adventure romance%"], 'genre:romance'],
    ['genre:adventure', "short_synopsis LIKE ?", ["%adventure mystery%"], 'genre:mystery'],
    ['genre:military', "short_synopsis LIKE ?", ["%military thriller%"], 'genre:thriller'],
    ['genre:military', "short_synopsis LIKE ?", ["%military history%"], 'genre:history'],
    ['genre:military', "short_synopsis LIKE ?", ["%military fiction%"], 'genre:war_fiction'],

    // --- HISTORICAL FICTION / HISTORY / WAR ---
    ['genre:colonial', "short_synopsis LIKE ?", ["%colonial history%"]],
    ['genre:resistance', "short_synopsis LIKE ?", ["%resistance movement%"]],
    ['genre:biological', "short_synopsis LIKE ?", ["%biological warfare%"]],
    ['genre:civil', "short_synopsis LIKE ?", ["%civil war%"]],
    ['genre:classic', "short_synopsis LIKE ?", ["%classic literature%"]],
    ['genre:nautical_and_maritime', "short_synopsis LIKE ?", ["%nautical fiction%"]],
    ['genre:wilderness_and_survival', "short_synopsis LIKE ?", ["%wilderness fiction%"]],
    ['genre:pioneer_and_frontier', "short_synopsis LIKE ?", ["%frontier and pioneer%"]],
    ['genre:lost_world', "short_synopsis LIKE ?", ["%lost world%"]],
    ['genre:military_and_scouting', "short_synopsis LIKE ?", ["%scouting fiction%"]],
    ['genre:home_front', "short_synopsis LIKE ?", ["%home front%"]],
    ['genre:resistance_and_guerrilla', "short_synopsis LIKE ?", ["%guerrilla warfare fiction%"]],
    ['genre:post_war_and_aftermath', "short_synopsis LIKE ?", ["%post war fiction%"]],
    
    // --- HUMOR ---
    ['genre:wordplay_and_wit', "short_synopsis LIKE ?", ["%wordplay%"]],
    ['genre:absurdist', "short_synopsis LIKE ?", ["%absurdist fiction%"]],
    ['genre:observational', "short_synopsis LIKE ?", ["%observational humor%"]],
    ['genre:slapstick_and_farce', "short_synopsis LIKE ?", ["%farce%"]],
    ['genre:anecdotal', "short_synopsis LIKE ?", ["%anecdotes%"]],
    ['genre:picaresque', "short_synopsis LIKE ?", ["%picaresque%"]],
    ['genre:situational', "short_synopsis LIKE ?", ["%situational comedy%"]],
    ['genre:surreal', "short_synopsis LIKE ?", ["%surrealist fiction%"]],
    ['genre:screwball', "short_synopsis LIKE ?", ["%screwball comedy%"]],
    
    // --- LITERARY FICTION ---
    ['genre:satirical', "short_synopsis LIKE ?", ["%satire%"], 'genre:literary_fiction'],
    ['genre:satirical', "short_synopsis LIKE ?", ["%satirical poetry%"], 'genre:poetry'],
    ['genre:satirical', "short_synopsis LIKE ?", ["%satirical humor%"], 'genre:humor'],
    ['genre:satirical', "short_synopsis LIKE ?", ["%historical satire%"], 'genre:historical_fiction'],
    ['genre:existential', "short_synopsis LIKE ?", ["%existentialism fiction%"]],
    ['genre:philosophical', "short_synopsis LIKE ?", ["%philosophical fiction%"], 'genre:literary_fiction'],
    ['genre:philosophical', "short_synopsis LIKE ?", ["%philosophy biography%"], 'genre:biography_memoir'],
    ['genre:postmodernist', "short_synopsis LIKE ?", ["%postmodern fiction%"]],
    ['genre:speculative', "short_synopsis LIKE ?", ["%speculative fiction%"]],
    ['genre:autobiographical', "short_synopsis LIKE ?", ["%autobiographical fiction%"]],
    ['genre:epistolary', "short_synopsis LIKE ?", ["%epistolary fiction%"]],
    ['genre:multi_generational_sagas', "short_synopsis LIKE ?", ["%multigenerational saga%"]],
    ['genre:minimalist', "short_synopsis LIKE ?", ["%minimalist fiction%"]],
    ['genre:literary', "short_synopsis LIKE ?", ["%literary biography%"], 'genre:biography_memoir'],

    // --- BIOGRAPHY / MEMOIR ---
    ['genre:memoir', "short_synopsis LIKE ?", ["%memoir%"]],
    ['genre:business', "short_synopsis LIKE ?", ["%business biography%"]],
    ['genre:musician', "short_synopsis LIKE ?", ["%musician biography%"]],
    ['genre:actor', "short_synopsis LIKE ?", ["%actor biography%"]],
    ['genre:criminal', "short_synopsis LIKE ?", ["%criminal biography%"]],
    ['genre:humanitarian', "short_synopsis LIKE ?", ["%humanitarian biography%"]],
    ['genre:artist', "short_synopsis LIKE ?", ["%artist biography%"]],
    ['genre:classical', "short_synopsis LIKE ?", ["%classical musician biography%"]],
    ['genre:lgbtq', "short_synopsis LIKE ?", ["%sexual minority biography%"]],
    ['genre:feminist', "short_synopsis LIKE ?", ["%feminist biography%"]],
    ['genre:nature', "short_synopsis LIKE ?", ["%nature writing biography%"]],
    ['genre:disability', "short_synopsis LIKE ?", ["%people with disabilities biography%"]],
    ['genre:educational', "short_synopsis LIKE ?", ["%educator biography%"]],
    ['genre:childhood', "short_synopsis LIKE ?", ["%childhood biography%"]],
    ['genre:immigrant', "short_synopsis LIKE ?", ["%immigrant biography%"]],
    ['genre:family', "short_synopsis LIKE ?", ["%family biography%"]],
    ['genre:poverty', "short_synopsis LIKE ?", ["%poor biography%"]],
    ['genre:celebrity', "short_synopsis LIKE ?", ["%celebrity biography%"]],
    ['genre:travel', "short_synopsis LIKE ?", ["%travel writing%"], 'genre:biography_memoir'],

    // --- POETRY ---
    ['genre:epic', "short_synopsis LIKE ?", ["%epic poetry%"], 'genre:poetry'],
    ['genre:epic', "short_synopsis LIKE ?", ["%epic fiction%"], 'genre:historical_fiction'],
    ['genre:lyric', "short_synopsis LIKE ?", ["%lyric poetry%"]],
    ['genre:pastoral', "short_synopsis LIKE ?", ["%pastoral poetry%"]],
    ['genre:didactic', "short_synopsis LIKE ?", ["%didactic poetry%"]],
    ['genre:prose', "short_synopsis LIKE ?", ["%prose poems%"]],
    ['genre:laudatory', "short_synopsis LIKE ?", ["%laudatory poetry%"]],
    ['genre:dramatic', "short_synopsis LIKE ?", ["%dramatic poetry%"]],
    ['genre:experimental', "short_synopsis LIKE ?", ["%experimental poetry%"]],
    ['genre:spiritual', "short_synopsis LIKE ?", ["%spiritual poetry%"]]`;

const newLines = [
    ...lines.slice(0, startIndex),
    replacement,
    ...lines.slice(endIndex + 1)
];

fs.writeFileSync('build/v2/src/seed_mappings.js', newLines.join('\n'));
console.log('Successfully updated seed_mappings.js');
