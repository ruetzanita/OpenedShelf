import re
import os

file_path = "src/tags_trope_keywords.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

updates = {
    # True Crime (CONSERVATIVE)
    "serial_killer_profile": ['"criminological analysis of a serial offender"', '"psychiatric evaluation of serial murderers"', '"non-fiction psychological profile of a killer"'],
    "unsolved_cold_case": ['"historical investigation of an unsolved crime"', '"true crime account of a cold case"', '"non-fiction investigation of unsolved mysteries"'],
    "forensic_breakthrough": ['"true account of forensic investigation"', '"factual forensic methodology in solving crime"'],
    "dna_profiling": ['"application of genetic genealogy in law enforcement"', '"factual account of dna evidence in criminal justice"'],
    "daring_heist": ['"true crime narrative of a major robbery"', '"factual account of an organized heist"'],
    "organized_crime_syndicate": ['"historical analysis of organized crime"', '"factual account of a criminal syndicate"', '"true crime history of the mafia"'],
    "white_collar_fraud": ['"investigation into corporate malfeasance"', '"factual account of financial fraud"', '"non-fiction analysis of embezzlement"'],
    "con_artist_grift": ['"true account of confidence fraud"', '"factual investigation of a scam artist"'],
    "dangerous_cults": ['"sociological study of a destructive cult"', '"true account of a coercive religious movement"'],
    "vanishing_without_a_trace": ['"factual investigation of a missing person"', '"true crime account of an unexplained disappearance"'],
    "broken_prison_systems": ['"systemic analysis of penal institutions"', '"sociological critique of mass incarceration"', '"documentary account of prison reform"'],
    "tense_interrogation": ['"transcript analysis of police interrogations"', '"factual account of criminal confessions"'],

    # Biography & Memoir
    "coming_of_age": ['"formative development"', '"transition to adulthood"', '"autobiographical account of youth"'],
    "family_roots": ['"genealogical history"', '"ancestral lineage"', '"family heritage documentation"'],
    "immigrant_journey": ['"memoir of immigration"', '"autobiographical account of the diaspora"', '"personal narrative of relocation"'],
    "working_class_struggle": ['"autobiographical account of labor struggles"', '"personal narrative of socioeconomic hardship"'],
    "fighting_illness": ['"autobiographical account of medical treatment"', '"personal narrative of chronic illness"'],
    "road_to_recovery": ['"memoir of substance abuse recovery"', '"autobiographical account of rehabilitation"'],
    "surviving_loss": ['"personal narrative of bereavement"', '"memoir of mourning and grief"'],
    "homesteading_life": ['"autobiographical account of self-sufficiency"', '"personal narrative of agricultural living"'],
    "fighting_for_change": ['"memoir of political activism"', '"autobiographical account of social justice advocacy"'],
    "true_crime_survival": ['"autobiographical account of surviving trauma"', '"victim\'s personal narrative of a crime"'],
    "behind_the_scenes": ['"firsthand account of industry operations"', '"insider narrative of organizational events"'],
    "whistleblower": ['"disclosure of institutional misconduct"', '"exposure of corporate malfeasance"', '"insider account of systemic corruption"'],

    # History (CONSERVATIVE)
    "epic_battles": ['"historical analysis of decisive military engagements"', '"factual account of strategic conflicts"'],
    "bloody_revolutions": ['"historical study of violent political upheavals"', '"factual account of armed insurrections"'],
    "rise_and_fall_of_empires": ['"historical analysis of imperial decline"', '"factual study of geopolitical collapse"'],
    "trade_and_commerce": ['"economic history of trade routes"', '"historical analysis of global commerce"'],
    "treaties_and_diplomacy": ['"historical study of international relations"', '"factual account of diplomatic negotiations"'],
    "daily_life_and_customs": ['"sociocultural history of daily life"', '"historical analysis of domestic customs"'],
    "dusty_archives": ['"historiographical research of primary sources"', '"archival history methodologies"'],
    "brutal_colonization": ['"historical analysis of colonial exploitation"', '"factual account of imperial conquest"'],
    "kings_and_queens": ['"biographical history of monarchy"', '"historical study of royal dynasties"'],
    "migrations_and_settlements": ['"historical analysis of mass migrations"', '"factual account of pioneering settlements"'],
    "sieges_and_fortifications": ['"military history of siege warfare"', '"factual study of defensive fortifications"'],
    "industrial_revolution": ['"economic history of industrialization"', '"historical analysis of the factory era"'],
    "shadowy_espionage": ['"historical account of covert operations"', '"factual history of intelligence agencies"'],
    "wartime_propaganda": ['"historical analysis of psychological warfare"', '"factual study of state media manipulation"'],
    "logistics_and_supply_lines": ['"military history of supply chain management"', '"historical analysis of battlefield logistics"'],

    # Self-Help (AGGRESSIVE)
    "chasing_goals": ['"goal setting methodologies"', '"strategic objective attainment"'],
    "mastering_time": ['"time management strategies"', '"optimization of personal efficiency"'],
    "breaking_bad_habits": ['"behavioral modification"', '"cessation of maladaptive behaviors"'],
    "deep_focus": ['"cognitive concentration techniques"', '"attention span optimization"'],
    "beating_procrastination": ['"strategies to overcome task avoidance"', '"anti-procrastination methodologies"'],
    "bouncing_back_from_burnout": ['"occupational burnout recovery"', '"strategies for combating chronic fatigue"'],
    "building_confidence": ['"self-esteem enhancement"', '"development of interpersonal confidence"'],
    "setting_hard_boundaries": ['"establishment of personal boundaries"', '"assertiveness training methodologies"'],
    "navigating_conflict": ['"conflict resolution strategies"', '"interpersonal dispute management"'],
    "crushing_debt": ['"personal debt reduction strategies"', '"financial insolvency recovery"'],
    "mapping_the_mind": ['"cognitive behavioral self-improvement"', '"applied neuroscience for personal growth"'],
    "optimizing_sleep": ['"sleep hygiene optimization"', '"strategies for combating insomnia"'],
    "fueling_the_body": ['"nutritional optimization strategies"', '"dietary methodologies for personal health"'],
    "owning_the_stage": ['"public speaking methodologies"', '"oratorical skill development"'],

    # Science & Technology
    "tech_society": ['"societal impacts of technology"', '"sociocultural effects of technological advancement"'],
    "automation_robotics": ['"industrial automation engineering"', '"robotic systems architecture"'],
    "cybersecurity_cryptography": ['"information security protocols"', '"cryptographic methodologies"'],
    "systems_architecture": ['"distributed systems engineering"', '"software architectural patterns"'],
    "linux_open_source": ['"open-source software development"', '"linux kernel architecture"'],
    "telemetry_data_logging": ['"telemetry data acquisition"', '"sensor network monitoring systems"'],
    "signal_processing": ['"digital signal processing methodologies"', '"algorithmic signal analysis"'],
    "crispr_gene_editing": ['"crispr-cas9 gene editing techniques"', '"genomic manipulation methodologies"'],
    "pharmacology_therapeutics": ['"pharmacokinetic analysis"', '"clinical drug development processes"'],
    "medical_ethics": ['"bioethical considerations in healthcare"', '"clinical ethics and patient rights"'],
    "aerospace_avionics": ['"aerospace engineering methodologies"', '"avionics systems architecture"'],
    "renewable_energy_systems": ['"sustainable energy infrastructure"', '"renewable power generation systems"'],
    "climatological_modeling": ['"climatological simulation methodologies"', '"atmospheric modeling systems"'],
    "scientific_method_discovery": ['"epistemology of scientific discovery"', '"history and philosophy of science"'],
    "academic_peer_review": ['"academic publishing methodologies"', '"scholarly peer review processes"'],
    "laboratory_protocols": ['"experimental laboratory procedures"', '"wet lab methodologies"'],
    "technological_singularity": ['"theoretical models of intelligence explosion"', '"hypothetical technological singularity"'],
    "nanotechnology": ['"nanoscale engineering"', '"molecular machine architecture"'],
    "biomimicry": ['"biomimetic engineering"', '"nature-inspired technological design"'],

    # Business & Finance (AGGRESSIVE)
    "supply_chain_logistics": ['"global supply chain management"', '"logistical distribution network optimization"'],
    "extraction_bottlenecks": ['"resource extraction constraints"', '"production bottleneck analysis"'],
    "market_speculation": ['"financial market speculation analysis"', '"economic bubble phenomena"'],
    "corporate_restructuring": ['"organizational reorganization"', '"corporate turnaround strategies"'],
    "labor_dynamics": ['"labor relations and collective bargaining"', '"workforce dynamic analysis"'],
    "regulatory_compliance": ['"corporate regulatory compliance frameworks"', '"legal compliance methodologies"'],
    "venture_capital": ['"venture capital investment strategies"', '"startup funding mechanisms"'],
    "fiscal_policy": ['"macroeconomic fiscal policy"', '"government taxation and expenditure analysis"'],
    "disruptive_technology": ['"disruptive innovation theory"', '"economic impacts of paradigm shifts"'],
    "risk_mitigation": ['"enterprise risk management"', '"financial contingency planning"'],
    "financial_fraud": ['"analysis of corporate embezzlement"', '"securities fraud investigation"'],

    # Essays
    "cultural_criticism": ['"sociocultural analysis"', '"critical examination of culture"'],
    "philosophical_inquiry": ['"metaphysical and epistemological discourse"', '"existential philosophical essays"'],
    "polemic_argument": ['"polemical discourse"', '"argumentative rhetoric"'],
    "historical_parallels": ['"historiographical analogies"', '"comparative historical analysis"'],
    "nature_writing": ['"ecological essays"', '"literary observations of the natural world"'],
    "urban_chronicles": ['"sociological essays on urban life"', '"metropolitan observations"'],
    "intimate_profiles": ['"biographical character studies"', '"in-depth personal profiles"'],

    # Travel
    "expat_life": ['"expatriate experiences"', '"cross-cultural relocation narratives"'],
    "exploration_logs": ['"expeditionary field notes"', '"documentary exploration journals"'],
    "total_immersion": ['"cultural immersion travel"', '"ethnographic travel experiences"'],
    "adrenaline_travel": ['"extreme adventure tourism"', '"high-risk recreational travel"'],
    "spiritual_pilgrimage": ['"religious pilgrimage narratives"', '"spiritual travelogues"'],
    "open_road_trips": ['"transcontinental highway journeys"', '"road trip travelogues"'],
    "backpacking_adventures": ['"budget backpacking travel"', '"independent hosteling experiences"'],
    "traveling_solo": ['"independent solo travelogues"', '"unaccompanied travel narratives"'],
    "sailing_the_seas": ['"nautical travelogues"', '"transoceanic sailing voyages"'],
    "scenic_train_journeys": ['"railway travelogues"', '"transcontinental train journeys"'],
    "arctic_expeditions": ['"polar exploration narratives"', '"arctic expeditionary logs"'],
    "desert_crossings": ['"arid environment expeditions"', '"desert travelogues"'],
    "mountain_treks": ['"alpine mountaineering accounts"', '"high-altitude trekking narratives"'],
    "river_journeys": ['"fluvial expedition narratives"', '"riverine travelogues"'],
    "cycling_tours": ['"long-distance bicycle touring"', '"cycling expedition narratives"'],
    "volunteer_travel": ['"humanitarian voluntourism"', '"international service travel"'],
    "literary_pilgrimage": ['"literary tourism"', '"travels to authorial landmarks"'],
    "culinary_travel": ['"gastronomic tourism"', '"culinary travelogues"'],
    "walking_through_history": ['"historical route trekking"', '"pedestrian journeys along ancient paths"'],
    "urban_exploration": ['"urban exploration of abandoned structures"', '"urbex photography and documentation"'],

    # Cookbooks (AGGRESSIVE)
    "mastering_technique": ['"culinary methodologies"', '"foundational cooking principles"'],
    "fermentation_and_preservation": ['"food preservation methodologies"', '"fermentation science"'],
    "cooking_with_fire": ['"wood-fired culinary techniques"', '"open-flame cooking methodologies"'],
    "ultimate_comfort_food": ['"traditional home cooking"', '"comfort food culinary traditions"'],
    "global_street_food": ['"international street food culture"', '"global street culinary practices"'],
    "specialty_diets": ['"specialized dietary regimens"', '"therapeutic dietary cooking"'],
    "wild_foraging": ['"foraging methodologies"', '"identification and culinary use of wild edibles"']
}

modified_content = content
for key, values in updates.items():
    pattern = r'("' + re.escape(key) + r'": \[\s*)([\s\S]*?)(\s*\])'
    match = re.search(pattern, modified_content)
    if match:
        prefix = match.group(1)
        existing_items = match.group(2)
        suffix = match.group(3)
        
        lines = existing_items.split('\n')
        if lines:
            indent = re.match(r'^\s*', lines[-1]).group(0)
            if not indent:
                indent = "        "
        else:
            indent = "        "
            
        new_items = ", ".join(values)
        if existing_items.strip():
            replacement = prefix + existing_items + ",\n" + indent + new_items + suffix
        else:
            replacement = prefix + "\n" + indent + new_items + suffix
            
        modified_content = modified_content[:match.start()] + replacement + modified_content[match.end():]
    else:
        print(f"Warning: Key {key} not found.")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(modified_content)

print("Modification complete.")
