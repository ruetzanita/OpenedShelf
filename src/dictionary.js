export const SUBJECTIVE_MAP = {
  // Atmosphere & Vibe
  "scary": ["genre:supernatural", "genre:serial_killers", "isolated", "genre:psychological_suspense", "genre:true_crime", "genre:dark"],
  "terrifying": ["genre:supernatural", "genre:serial_killers", "isolated", "genre:psychological_suspense", "genre:true_crime", "genre:dark"],
  "creepy": ["genre:supernatural", "genre:psychological_suspense", "genre:deadly_stalker"],
  "spooky": ["genre:haunted_house", "genre:restless_spirits", "genre:gothic", "genre:supernatural"],
  // Low Stakes & Comfort
  "low_stakes": ["genre:cozy", "suburban", "family_dynamics", "genre:amateur_sleuth"],
  "low-stakes": ["genre:cozy", "suburban", "family_dynamics", "genre:amateur_sleuth"],
  "comforting": ["genre:cozy", "suburban", "family_dynamics", "genre:homesteading_life"],
  // Intensity & Grit
  "atmospheric": ["extreme_weather", "isolated", "genre:gothic"],
  "dark": ["moral_ambiguity", "criminal_underworld", "violent_content", "genre:dark_fantasy", "genre:grimdark"],
  "gritty": ["urban_decay", "moral_ambiguity", "resource_scarcity", "graphic_violence"],
  "whimsical": ["genre:farcical_escapes", "genre:mythic_retellings", "genre:absurdist"],
  // Thriller & Mystery Elements
  "suspenseful": ["time_limit", "genre:deadly_stalker", "survival_scenario", "genre:psychological_suspense"],
  "twisty": ["unreliable_narrator", "non_linear_narrative", "hidden_identity", "genre:clever_red_herrings"],
  "mind-bending": ["alternate_history", "time_loop", "unreliable_narrator", "genre:descent_into_madness"],
  // Romance Elements
  "steamy": ["explicit_sexual_content", "genre:taboo"],
  "spicy": ["explicit_sexual_content", "genre:taboo"],
  "sweet": ["genre:courtship", "genre:friends_to_lovers", "intimate_scope"],
  "swoony": ["genre:soulmates", "genre:destined_to_be", "genre:courtship"],
  "angsty": ["genre:star_crossed_lovers", "miscommunication", "prolonged_separation", "genre:enemies_to_lovers"],
  // Sci-Fi & Fantasy Elements
  "epic": ["multi_generational", "multiple_pov", "genre:galactic_empire", "genre:high"],
  "futuristic": ["genre:cyberpunk", "genre:cybernetic_implants", "extraterrestrial", "genre:surveillance_state"],
  "techy": ["genre:hard_scifi", "genre:cyber_attack", "genre:artificial_intelligence", "genre:virtual_reality"],
  "magical": ["genre:hard_magic", "genre:monsters_and_beasts", "genre:summoning", "genre:high"],
  // Emotional & Literary Elements
  "sad": ["grief_and_loss", "genre:surviving_loss", "genre:tragic_miscommunication"],
  "devastating": ["grief_and_loss", "genre:surviving_loss", "genre:scars_of_war"],
  "heartbreaking": ["grief_and_loss", "genre:surviving_loss", "genre:scars_of_war"],
  "funny": ["genre:satirical", "genre:parody", "genre:absurdist", "genre:romantic_comedy"],
  "hilarious": ["genre:satirical", "genre:parody", "genre:absurdist", "genre:romantic_comedy"],
  "inspiring": ["overcoming_adversity", "genre:road_to_recovery", "genre:biography_memoir"],
  "poetic": ["lyrical_prose", "experimental_structure", "genre:free_verse"],
  "thought-provoking": ["genre:philosophical", "social_resistance"],
  // Non-Fiction Elements
  "informative": ["genre:historical", "genre:scientific", "genre:oral"],
  "educational": ["genre:educational", "genre:scientific", "genre:history"],
  "practical": ["genre:habits_and_routines", "genre:study_and_learning_skills", "genre:self_help"],
  "helpful": ["genre:habits_and_routines", "genre:study_and_learning_skills", "genre:self_help"],
  "actionable": ["genre:productivity_and_focus", "genre:personal_finance_and_wealth", "genre:self_help"],
  "deep": ["genre:philosophical", "genre:theoretical_physics", "genre:cultural_criticism"],
  "mind-expanding": ["genre:philosophical", "genre:theoretical_physics", "genre:cultural_criticism"],
  "real": ["genre:biography_memoir", "genre:autobiography", "investigative", "genre:true_crime", "historical"],
  "true": ["genre:biography_memoir", "genre:autobiography", "investigative", "genre:true_crime", "historical"],
  "motivating": ["overcoming_adversity", "genre:chasing_goals", "genre:entrepreneurship"],
  // Horror Elements
  "gory": ["graphic_violence", "genre:body", "genre:visceral_gore"],
  "disturbing": ["psychological_torture", "taboo_subjects", "isolated"],
  // Pacing & Structure
  "fast": ["time_limit", "survival_scenario", "genre:action"],
  "action-packed": ["time_limit", "survival_scenario", "genre:action"],
  "slow": ["intimate_scope", "genre:philosophical", "genre:agonizing_slow_burn", "genre:literary_fiction"],
  "character-driven": ["first_person_pov", "genre:coming_of_age", "intimate_scope"],
  "plot-driven": ["genre:action", "heist", "quest_narrative"]
};
export function getSuggestions(query) {
  if (!query) return [];
  const words = query.toLowerCase().replace(/[^a-z0-9\s-]/g, "").split(/\s+/);
  let suggestions = new Set();
  for (const word of words) {
    if (SUBJECTIVE_MAP[word]) {
      SUBJECTIVE_MAP[word].forEach((tag) => suggestions.add(tag));
    }
  }
  return Array.from(suggestions);
}

