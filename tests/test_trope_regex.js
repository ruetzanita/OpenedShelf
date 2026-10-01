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

import assert from 'node:assert';
import { TROPE_KEYWORDS } from '../build/v2/src/tags_trope_keywords.js';

const STOP_WORDS = new Set([
    'a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'and', 'or', 'but', 
    'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'with', 'about', 
    'from', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 
    'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'as', 'if', 'then', 
    'than', 'so', 'no', 'not', 'only', 'other', 'some', 'any', 'such', 'very', 'too', 
    'just', 'more', 'most', 'narrative', 'story', 'novel', 'account', 'tale', 'chronicle',
    'society', 'system', 'environment', 'infrastructure', 'relationship', 'courtship',
    'encounter', 'engagement', 'hegemony', 'authority', 'constructs', 'beings', 
    'individuals', 'competitors', 'partners', 'protagonist', 'character', 'dwellings', 
    'structure'
]);

function makeVerbPhraseFlexible(phrase) {
    // Strip leading relative pronouns
    let cleanPhrase = phrase.replace(/^(who|which|that|wherein)\s+/i, '');
    const words = cleanPhrase.split(/\s+/);
    if (words.length === 0) return '';
    
    // Escape each word
    const escapedWords = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    
    let verb = escapedWords[0];
    let flexibleVerb = verb;
    
    if (verb === 'set') {
        flexibleVerb = 'set(?:ting)?';
    } else if (verb === 'run' || verb === 'runs') {
        flexibleVerb = 'run(?:ning|s)?';
    } else if (verb === 'flee' || verb === 'flees') {
        flexibleVerb = 'flee(?:ing|s)?';
    } else if (verb.endsWith('ing')) {
        const stem = verb.slice(0, -3);
        const cleanStem = (stem.length > 3 && stem[stem.length - 1] === stem[stem.length - 2]) ? stem.slice(0, -1) : stem;
        flexibleVerb = `${cleanStem}(?:ing|ed|s|es)?`;
    } else if (verb.endsWith('ed')) {
        let stem = verb.slice(0, -2);
        if (verb === 'structured') stem = 'structur';
        flexibleVerb = `${stem}(?:ed|ing|s|es)?`;
    } else if (verb.endsWith('s') && !verb.endsWith('ss')) {
        const stem = verb.slice(0, -1);
        flexibleVerb = `${stem}(?:s|ed|ing)?`;
    }
    
    // Allow optional relative pronouns and helper verbs before the verb
    const prefix = '(?:who|which|that|wherein)?\\s*(?:is|are|was|were|has\\s+been|have\\s+been)?\\s*';
    
    // Process prepositions/conjunctions in the rest of the words
    const processedRest = escapedWords.slice(1).map(w => {
        if (w === 'upon' || w === 'on' || w === 'around' || w === 'about') return '(?:upon|on|around|about)';
        if (w === 'in' || w === 'within' || w === 'into') return '(?:in|within|into)';
        if (w === 'of' || w === 'for') return '(?:of|for)';
        if (w === 'by' || w === 'through' || w === 'via') return '(?:by|through|via)';
        if (w === 'which' || w === 'wherein' || w === 'where' || w === 'that' || w === 'who') return '(?:who|which|that|wherein)';
        return w;
    });
    
    if (processedRest.length === 0) {
        return `${prefix}${flexibleVerb}`;
    }
    
    // Allow an optional adjective/modifier word between words in the verb phrase, including after the first verb
    return `${prefix}${flexibleVerb}\\s+(?:[a-z-]+\\s+)?${processedRest.join('\\s+(?:[a-z-]+\\s+)?')}`;
}

function compileKeywordToRegexSource(phrase) {
    let clean = phrase.toLowerCase().trim();

    // 1. Identify and extract optional prefix
    const prefixRegex = /^(?:(?:the|a|an)\s+)?(?:[a-z-]+\s+){1,2}(?:of|in|on|between|upon|to|from|by|for|into)\s+(?:a|an|the)?\s*/i;
    const prefixMatch = clean.match(prefixRegex);
    let prefixPart = '';
    if (prefixMatch) {
        const escPrefix = prefixMatch[0].trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
        prefixPart = `(?:${escPrefix}\\s+)?`;
        clean = clean.slice(prefixMatch[0].length);
    }

    // 2. Identify and extract optional trailing clause
    const trailingRegex = /\s+(by|through|via|for|to|with|attributable\s+to|resulting\s+in|involving|arising\s+from|associated\s+with|derived\s+from|or)\s+[a-z\s'-]+$/i;
    const trailingMatch = clean.match(trailingRegex);
    let trailingPart = '';
    if (trailingMatch) {
        const clause = trailingMatch[0].trim();
        const escClause = clause.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
        trailingPart = `(?:\\s+${escClause})?`;
        clean = clean.slice(0, clean.length - trailingMatch[0].length);
    }

    // 3. Compile the core clean phrase
    const academicNouns = 'narrative|story|novel|account|tale|chronicle|society|system|environment|infrastructure|relationship|courtship|encounter|engagement|hegemony|authority|constructs|beings|individuals|competitors|partners|protagonist|character|dwellings|structure|shifter|shapeshifter|shape\\[\\s-\\]\\?shifter|planet|world|apparatus|regime|regimes|government|organization|organizations|practices|processes|investigation|inquiry|pattern|patterns|manner|method|methods|course|form|forms|mode|modes|style|styles';
    const academicPattern = new RegExp(`^(a|an|the)?\\s*([a-z-]+\\s+)?(${academicNouns})\\s+(.*)$`, 'i');
    const match = clean.match(academicPattern);
    
    let compiled = '';
    if (match) {
        const article = match[1] ? '(?:a|an|the)?\\s*' : '';
        const adj = '(?:[a-z-]+\\s+)?'; 
        
        let noun = match[3];
        if (['narrative', 'story', 'novel', 'account', 'tale', 'chronicle'].includes(noun)) {
            noun = '(?:narrative|story|novel|account|tale|chronicle)';
        } else if (['individual', 'individuals', 'being', 'beings', 'person', 'persons', 'character', 'characters', 'subject', 'subjects'].includes(noun)) {
            noun = '(?:individual|individuals|being|beings|person|persons|character|characters|subject|subjects)';
        }
        
        const verbPhrase = match[4];
        const flexibleVerbPhrase = makeVerbPhraseFlexible(verbPhrase);
        
        compiled = `${article}${adj}${noun}\\s+${flexibleVerbPhrase}`;
    } else {
        let escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const literalPattern = escaped.replace(/\\-| /g, '[ -]');
        compiled = `(?:(?:a|an|the)\\s+(?:[a-z-]+\\s+)?)?${literalPattern}`;
    }

    let finalPattern = `${prefixPart}${compiled}${trailingPart}`;

    // 4. Apply spelling and synonym replacements at the VERY END on the constructed regex pattern (post-escaping)
    finalPattern = finalPattern
        .replace(/\bshapeshifter\b/g, 'shape[ -]?shifter')
        .replace(/\bshapeshifting\b/g, 'shape[ -]?shifting')
        .replace(/\bsuperintelligence\b/g, 'super[ -]?intelligence')
        .replace(/\bsuperintelligent\b/g, 'super[ -]?intelligent')
        .replace(/\bdouble\\-agent\b/g, 'double[ -]?agent')
        .replace(/\bpost\\-biological\b/g, 'post[ -]?biological')
        .replace(/\bpost\\-apocalyptic\b/g, 'post[ -]?apocalyptic')
        .replace(/\bbounty\\-hunter\b/g, 'bounty[ -]?hunter')
        .replace(/\bfirst\\-contact\b/g, 'first[ -]?contact')
        .replace(/\bwhodunit\b/g, 'whodunn?it')
        .replace(/\bwhodunnit\b/g, 'whodunn?it')
        // Synonyms
        .replace(/\b(homicides?|murders?|killings?)\b/g, '(?:homicide|murder|killing)s?')
        .replace(/\b(perpetrators?|murderers?|killers?|offenders?)\b/g, '(?:perpetrator|murderer|killer|offender)s?')
        .replace(/\b(investigations?|investigating|investigate|investigated)\b/g, 'investigat(?:e|ing|ed|ion|ions)?')
        .replace(/\b(apprehensions?|captures?|arrests?)\b/g, '(?:apprehension|capture|arrest)s?')
        .replace(/\b(recidivists?|serials?)\b/g, '(?:recidivist|serial)s?')
        .replace(/\b(individuals?|peoples?|persons?|characters?|subjects?)\b/g, '(?:individual|individuals|people|person|persons|character|characters|subject|subjects)');

    // Noun pluralization rules
    const pluralNouns = ['disappearance', 'homicide', 'murder', 'killer', 'perpetrator', 'citizen', 'subject', 'being', 'individual', 'unsolved', 'mystery', 'anatomy', 'component', 'limitations', 'mechanism', 'device', 'relic', 'artifact', 'encounter', 'engagement', 'relationship'];
    for (const noun of pluralNouns) {
        const nounRegex = new RegExp(`\\b${noun}\\b`, 'g');
        finalPattern = finalPattern.replace(nounRegex, `${noun}(?:s|es)?`);
    }

    return finalPattern;
}

// Prepare the matching rules
console.log("Compiling rules...");
const testRules = Object.keys(TROPE_KEYWORDS).map(tropeName => {
    const keywords = TROPE_KEYWORDS[tropeName];
    const regexPatterns = [];
    const triggerWords = new Set();
    
    for (const kw of keywords) {
        const kwParts = kw.split(/\s+or\s+/);
        for (const part of kwParts) {
            const pattern = compileKeywordToRegexSource(part);
            regexPatterns.push(pattern);
            
            // Extract trigger words
            const words = part.toLowerCase().split(/[^a-z0-9-]+/);
            for (const w of words) {
                if (w && !STOP_WORDS.has(w)) {
                    triggerWords.add(w);
                }
            }
        }
    }
    
    const combinedRegexStr = regexPatterns.join('|');
    return {
        id: tropeName,
        regex: new RegExp(`\\b(?:${combinedRegexStr})\\b`, 'i'),
        triggerWords: Array.from(triggerWords)
    };
});
console.log(`Compiled ${testRules.length} rules.`);

// 50 test cases modeling various Library of Congress blurbs
const testCases = [
    {
        synopsis: "A suspenseful narrative centering upon the weaponization of biological agents by a rogue organization.",
        expectedTropes: ["biological_terror"]
    },
    {
        synopsis: "A fictional story depicting the conditions of life under circumstances of severe economic inequality in 19th century Europe.",
        expectedTropes: ["crushing_poverty"]
    },
    {
        synopsis: "A thrilling novel structured around a protagonist's journey to fulfill a heroic imperative of great consequence.",
        expectedTropes: ["epic_quests"]
    },
    {
        synopsis: "A detailed account focusing on the systematic modification of a planet's biosphere to support human life.",
        expectedTropes: ["terraforming"]
    },
    {
        synopsis: "A historic chronicle recounting a vessel sustaining multiple generations of travelers across the cosmos.",
        expectedTropes: ["generation_ship"]
    },
    {
        synopsis: "An immersive simulation depicting passengers born aboard a ship in transit.",
        expectedTropes: ["generation_ship"]
    },
    {
        synopsis: "A short story describing an initial encounter between humanity and extraterrestrial intelligence.",
        expectedTropes: ["first_contact"]
    },
    {
        synopsis: "A complex tale exploring warp speed and hyperspace travel.",
        expectedTropes: ["ftl_travel"]
    },
    {
        synopsis: "A character demonstrating the ability to manipulate matter through purely cognitive means.",
        expectedTropes: ["telekinesis"]
    },
    {
        synopsis: "An unhinged scientist conducting a forbidden experiment in defiance of ethical constraints.",
        expectedTropes: ["mad_science"]
    },
    {
        synopsis: "A classic whodunit detailing the circumstances and authorship of a homicide.",
        expectedTropes: ["whodunit"]
    },
    {
        synopsis: "A jaded detective investigating a pattern of serial murders.",
        expectedTropes: ["grizzled_detective", "serial_murder_hunt"]
    },
    {
        synopsis: "A story about a double agent who is embedded within an adversary organization while reporting to another.",
        expectedTropes: ["double_agent"]
    },
    {
        synopsis: "A historical account of a quiet town mystery where everyone has secrets.",
        expectedTropes: ["small_town_secrets"]
    },
    {
        synopsis: "A tense legal thriller describing the adversarial determination of fact and responsibility before a court of law.",
        expectedTropes: ["courtroom_drama"]
    },
    {
        synopsis: "A narrative depicting the gradual disintegration of a character's psychological coherence after a traumatic event.",
        expectedTropes: ["descent_into_madness"]
    },
    {
        synopsis: "A space setting where an orbital tether facilitates the transport of cargo between a planet and space.",
        expectedTropes: ["space_elevators"]
    },
    {
        synopsis: "A planet rendered uninhabitable by environmental degradation and resource exhaustion.",
        expectedTropes: ["dying_earth"]
    },
    {
        synopsis: "A dystopian tale where a state apparatus is tasked with the detection and suppression of subversive ideation.",
        expectedTropes: ["thought_police"]
    },
    {
        synopsis: "A rigid caste hierarchy where positions are determined by birth and immutable.",
        expectedTropes: ["caste_system"]
    },
    {
        synopsis: "A dark fantasy centering upon the binding of spirits or demons through ceremonial arcane practice.",
        expectedTropes: ["summoning"]
    },
    {
        synopsis: "A young wizard attending an institution dedicated to the formal instruction of arcane arts.",
        expectedTropes: ["magical_academies"]
    },
    {
        synopsis: "A narrative structured around the extended encirclement and reduction of a castle or city by hostile forces.",
        expectedTropes: ["sieges"]
    },
    {
        synopsis: "A story of adversaries navigating a fraught and reluctant courtship in historical London.",
        expectedTropes: ["enemies_to_lovers"]
    },
    {
        synopsis: "A sweet romance detailing the transformation of a longstanding friendship into a romantic and sexual partnership.",
        expectedTropes: ["friends_to_lovers"]
    },
    {
        synopsis: "An office romance describing the dynamic tension between a reticent and a gregarious romantic partner.",
        expectedTropes: ["grumpy_sunshine"]
    },
    {
        synopsis: "A romantic comedy where two people simulate a romantic relationship for social purposes.",
        expectedTropes: ["fake_dating"]
    },
    {
        synopsis: "A tragic love story featuring ill-fated lovers whose relationship is impeded by forces beyond their control.",
        expectedTropes: ["star_crossed_lovers"]
    },
    {
        synopsis: "A group of unrelated individuals who develop bonds of familial affection and obligation.",
        expectedTropes: ["found_family"]
    },
    {
        synopsis: "A story of a princess romance where she falls for a prince.",
        expectedTropes: ["royal_romance"]
    },
    {
        synopsis: "A science fiction story containing a machine endowed with simulated intelligence.",
        expectedTropes: ["artificial_intelligence"]
    },
    {
        synopsis: "A society where organic biological anatomy has been augmented with integrated mechanical or electronic components.",
        expectedTropes: ["cyborgs"]
    },
    {
        synopsis: "A computer-generated experiential space indistinguishable from physical reality.",
        expectedTropes: ["virtual_reality"]
    },
    {
        synopsis: "A technological post-biological human existence through scientific enhancement.",
        expectedTropes: ["transhumanism"]
    },
    {
        synopsis: "A whole brain emulation preserving cognitive identity in a synthetic substrate.",
        expectedTropes: ["mind_uploading"]
    },
    {
        synopsis: "A post-apocalyptic story depicting a protagonist navigating a landscape rendered desolate and hostile.",
        expectedTropes: ["wasteland_survival"]
    },
    {
        synopsis: "A dystopian thriller centering on the algorithmic surveillance and rating of citizens' social conduct.",
        expectedTropes: ["social_credit"]
    },
    {
        synopsis: "An undead predatory entity of folkloric origin exercising supernatural influence over mortals.",
        expectedTropes: ["vampires"]
    },
    {
        synopsis: "A shape shifter of folkloric tradition who assumes the characteristics of a wolf.",
        expectedTropes: ["werewolves"]
    },
    {
        synopsis: "A ghost or specter bound to a particular location by unresolved circumstances at the time of death.",
        expectedTropes: ["restless_spirits"]
    },
    {
        synopsis: "A zombie apocalypse where a fictional plague causes the dead to rise and prey upon the living.",
        expectedTropes: ["zombies"]
    },
    {
        synopsis: "A professional operative engaged to commit homicide for remuneration in a corrupt corporate city.",
        expectedTropes: ["hired_assassin"]
    },
    {
        synopsis: "A plot structured around an urgent countdown with fatal consequences for failure.",
        expectedTropes: ["race_against_time"]
    },
    {
        synopsis: "An innocent but accused protagonist proving innocence after a setup.",
        expectedTropes: ["wrongfully_accused"]
    },
    {
        synopsis: "A protagonist pursuing retributive justice outside lawful channels.",
        expectedTropes: ["ruthless_revenge"]
    },
    {
        synopsis: "An impossible crime committed under circumstances that appear physically impossible.",
        expectedTropes: ["locked_room_puzzle"]
    },
    {
        synopsis: "A non-fiction investigation of unsolved mysteries and unexplained disappearances.",
        expectedTropes: ["vanishing_without_a_trace", "unsolved_cold_case"]
    },
    {
        synopsis: "A factual account of white collar fraud and securities embezzlement.",
        expectedTropes: ["white_collar_fraud"]
    },
    {
        synopsis: "A sociological study of a destructive cult led by a charismatic con artist.",
        expectedTropes: ["dangerous_cults"]
    },
    {
        synopsis: "A documentary account of prison reform and mass incarceration.",
        expectedTropes: ["broken_prison_systems"]
    }
];

// Run matches
console.log("\nRunning match validation...");
let passed = 0;
for (let idx = 0; idx < testCases.length; idx++) {
    const tc = testCases[idx];
    const words = new Set(tc.synopsis.toLowerCase().split(/[^a-z0-9-]+/).filter(Boolean));
    const matchedTropes = [];
    
    for (const rule of testRules) {
        // Pre-filtering check
        if (rule.triggerWords.length > 0) {
            let hasTrigger = false;
            for (let w = 0; w < rule.triggerWords.length; w++) {
                if (words.has(rule.triggerWords[w])) {
                    hasTrigger = true;
                    break;
                }
            }
            if (!hasTrigger) continue;
        }
        
        if (rule.regex.test(tc.synopsis)) {
            matchedTropes.push(rule.id);
        }
    }
    
    // Assert all expected tropes are matched
    try {
        for (const exp of tc.expectedTropes) {
            assert.ok(matchedTropes.includes(exp), `Expected synopsis to match trope '${exp}', but matched: [${matchedTropes.join(', ')}]`);
        }
        passed++;
    } catch (err) {
        console.error(`FAIL [Case ${idx + 1}]: "${tc.synopsis}"`);
        console.error(err.message);
    }
}

console.log(`\nValidation complete. Passed ${passed}/${testCases.length} tests.`);

// Speed Benchmarking
console.log("\nRunning performance benchmark (1,000 iterations over all cases)...");

// Method A: Raw Sequential Regex Test
const tStartRaw = performance.now();
for (let iter = 0; iter < 1000; iter++) {
    for (const tc of testCases) {
        const matched = [];
        for (const rule of testRules) {
            if (rule.regex.test(tc.synopsis)) {
                matched.push(rule.id);
            }
        }
    }
}
const tEndRaw = performance.now();
const timeRaw = tEndRaw - tStartRaw;

// Method B: Pre-filtering + Regex Test
const tStartFiltered = performance.now();
for (let iter = 0; iter < 1000; iter++) {
    for (const tc of testCases) {
        const words = new Set(tc.synopsis.toLowerCase().split(/[^a-z0-9-]+/).filter(Boolean));
        const matched = [];
        for (const rule of testRules) {
            if (rule.triggerWords.length > 0) {
                let hasTrigger = false;
                for (let w = 0; w < rule.triggerWords.length; w++) {
                    if (words.has(rule.triggerWords[w])) {
                        hasTrigger = true;
                        break;
                    }
                }
                if (!hasTrigger) continue;
            }
            if (rule.regex.test(tc.synopsis)) {
                matched.push(rule.id);
            }
        }
    }
}
const tEndFiltered = performance.now();
const timeFiltered = tEndFiltered - tStartFiltered;

console.log(`Raw Regex Matching Time: ${timeRaw.toFixed(2)} ms`);
console.log(`Pre-Filtered Matching Time: ${timeFiltered.toFixed(2)} ms`);
console.log(`Speedup Factor: ${(timeRaw / timeFiltered).toFixed(2)}x`);

if (passed === testCases.length) {
    console.log("\nALL TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
} else {
    process.exit(1);
}
