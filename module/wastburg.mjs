// Import document classes.
import { WastburgActor } from "./documents/actor.mjs";
import { WastburgItem } from "./documents/item.mjs";
// Import sheet classes.
import { WastburgActorSheet } from "./sheets/actor-sheet.mjs";
import { WastburgItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { WASTBURG } from "./helpers/config.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.wastburg = {
    WastburgActor,
    WastburgItem
  };

  // Add custom constants for configuration.
  CONFIG.WASTBURG = WASTBURG;



  // Define custom Document classes
  CONFIG.Actor.documentClass = WastburgActor;
  CONFIG.Item.documentClass = WastburgItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("wastburg", WastburgActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("wastburg", WastburgItemSheet, { makeDefault: true });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
  
   
    
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper('concat', function() {
  var outStr = '';
  for (var arg in arguments) {
    if (typeof arguments[arg] != 'object') {
      outStr += arguments[arg];
    }
  }
  return outStr;
});

Handlebars.registerHelper('toLowerCase', function(str) {
  return str.toLowerCase();
});



/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */
Hooks.once("ready", async function() {
});
Hooks.off(async function (){
}
);