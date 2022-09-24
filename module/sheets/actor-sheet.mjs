/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
 export class WastburgActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["wastburg", "sheet", "actor", "personnage", "trait","prevot","caid"],
      template: "systems/wastburg/templates/actor/actor-sheet.hbs",
      width: 520,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "etats-list" }]
    });
  }

  /** @override */
  get template() {
    return `systems/wastburg/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

   /** @override */
   getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();
    

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

 
    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);     
    }

    if (actorData.type == 'personnage') {
      this._prepareItems(context);
      this._prepareCharacterData(context);     
    }
    if (actorData.type == 'prevot') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }
    if (actorData.type == 'caid') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }
    
    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();
    return context;
  }
  
  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    // Handle ability scores.
  }
  
  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const traits = [];
    const item = [];
    const contacts =[];
    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Append to gear.
      if (i.type === 'item') {
        item.push(i);
      }
      if (i.type === 'trait') {
        traits.push(i);
      }
      if (i.type == 'contact') {
        contacts.push(i);
      }
    }

    // Assign and return
    context.item = item;
    context.traits = traits;
    context.contacts = contacts;
   }

 


  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Button Rooll
    html.find('.onRollButton').click(this._onButtonRoll.bind(this));
    html.find('.fas fa-dice-d6').click(this._onButtonRoll.bind(this));
    

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }


  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
   async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  async _onButtonRoll () {
    
    let formula = document.getElementById("selectRollInput");
    var value = formula.value;
    if (value == "1") {
      const roll = await new Roll("3d6kl").roll({async: true});
      const result = roll.total;
      const actor = this.actor;
      const actorName = this.actor.name; 
      const valueAubaine= actor.system.aubaine.value;
      const valueAubaineGroupe= actor.system.aubaineGroupe.value;
      console.log(actorName)
      console.log(result)

          if  (result =="1")
          await roll.toMessage({ flavor :`<html><h2><strong>Non,et...</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
          if (result =="2")
          await roll.toMessage({flavor: `<html><h2><strong>Non</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
          if (result =="3")
          await roll.toMessage({flavor:  `<html><h2><strong>Non,mais...</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
          if (result =="4")
          await roll.toMessage({flavor:  `<html><h2><strong>Oui, mais...</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
          if (result =="5")
          await roll.toMessage({flavor: `<html><h2><strong>Oui</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
          if (result =="6")
          await roll.toMessage({flavor:  `<html><h2><strong>Oui,et...</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
      }

      if (value == "2") {
        const roll = await new Roll("2d6kl").roll({async: true});
        const result = roll.total;
        const actor = this.actor;
        const actorName = this.actor.name; 
        const valueAubaine= actor.system.aubaine.value;
        const valueAubaineGroupe= actor.system.aubaineGroupe.value;
        console.log(actorName)
        console.log(result)

        if  (result =="1")
        await roll.toMessage({ flavor :`<html><h2><strong>Non,et...</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
        if (result =="2")
        await roll.toMessage({flavor: `<html><h2><strong>Non</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
        if (result =="3")
        await roll.toMessage({flavor:  `<html><h2><strong>Non,mais...</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
        if (result =="4")
        await roll.toMessage({flavor:  `<html><h2><strong>Oui, mais...</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
        if (result =="5")
        await roll.toMessage({flavor: `<html><h2><strong>Oui</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
        if (result =="6")
        await roll.toMessage({flavor:  `<html><h2><strong>Oui,et...</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});           
      }

      if (value == "3") {
        const roll = await new Roll("1d6").roll({async: true});
        const result = roll.total;
        const actor = this.actor;
        const actorName = this.actor.name; 
        const valueAubaine= actor.system.aubaine.value;
        const valueAubaineGroupe= actor.system.aubaineGroupe.value;
        console.log(actorName)
        console.log(result)

        if  (result =="1")
        await roll.toMessage({ flavor :`<html><h2><strong>Non,et...</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
        if (result =="2")
        await roll.toMessage({flavor: `<html><h2><strong>Non</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
        if (result =="3")
        await roll.toMessage({flavor:  `<html><h2><strong>Non,mais...</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
        if (result =="4")
        await roll.toMessage({flavor:  `<html><h2><strong>Oui, mais...</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
        if (result =="5")
        await roll.toMessage({flavor: `<html><h2><strong>Oui</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
        if (result =="6")
        await roll.toMessage({flavor:  `<html><h2><strong>Oui,et...</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});                 
      }
      if (value == "4") {
        const roll = await new Roll("2d6kh").roll({async: true});
        const result = roll.total;
        const actor = this.actor;
        const actorName = this.actor.name; 
        const valueAubaine= actor.system.aubaine.value;
        const valueAubaineGroupe= actor.system.aubaineGroupe.value;
        console.log(actorName)
        console.log(result)

        if  (result =="1")
        await roll.toMessage({ flavor :`<html><h2><strong>Non,et...</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
        if (result =="2")
        await roll.toMessage({flavor: `<html><h2><strong>Non</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
        if (result =="3")
        await roll.toMessage({flavor:  `<html><h2><strong>Non,mais...</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
        if (result =="4")
        await roll.toMessage({flavor:  `<html><h2><strong>Oui, mais...</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
        if (result =="5")
        await roll.toMessage({flavor: `<html><h2><strong>Oui</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
        if (result =="6")
        await roll.toMessage({flavor:  `<html><h2><strong>Oui,et...</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`}); 
        
      }
      if (value == "5") {
        const roll = await new Roll("3d6kh").roll({async: true});
        const result = roll.total;
        const actor = this.actor;
        const actorName = this.actor.name; 
        const valueAubaine= actor.system.aubaine.value;
        const valueAubaineGroupe= actor.system.aubaineGroupe.value;
        console.log(actorName)
        console.log(result)

        if  (result =="1")
        await roll.toMessage({ flavor :`<html><h2><strong>Non,et...</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
        if (result =="2")
        await roll.toMessage({flavor: `<html><h2><strong>Non</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
        if (result =="3")
        await roll.toMessage({flavor:  `<html><h2><strong>Non,mais...</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
        if (result =="4")
        await roll.toMessage({flavor:  `<html><h2><strong>Oui, mais...</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
        if (result =="5")
        await roll.toMessage({flavor: `<html><h2><strong>Oui</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`});
        if (result =="6")
        await roll.toMessage({flavor:  `<html><h2><strong>Oui,et...</strong></h2><h3>Réserve d'Aubaine : ${valueAubaine}<br>Réserve d'aubaine de groupe : ${valueAubaineGroupe}<br></h3>`}); 
      }       
  }
}  
