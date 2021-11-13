// import {ig} from "../../impact/impact";
//
// export class igAbility {
//   static count = 0;
//
//   id: number;
//   name = "";
//   type = 0;
//   paused = false;
//   blocking = true;
//   priority = 0;
//   enabled = true;
//   entity = null;
//   entityOptions = null;
//   entityTarget = null;
//   movable = false;
//   autoStopMoving = true;
//   once = false;
//   activated = false;
//   needsDeactivate = false;
//   activateToggle = false;
//   activateStrict = true;
//   channelled = false;
//   channelling = false;
//   costActivate = 0;
//   costChannel = 0;
//   cooldownDelay = 0;
//   cooldownTimer = null;
//   castTimer = null;
//   requiresTarget = false;
//   canFindTarget = false;
//   canTargetSelf = true;
//   canTargetOthers = true;
//   canTargetFixed = false;
//   rangeX = 0;
//   rangeY = 0;
//   typeTargetable = 0;
//   groupTargetable = 0;
//   faceTarget = true;
//   retainTarget = false;
//   regenBlocking = true;
//   rank = 0;
//   upgrades = [];
//   casting = false;
//   activateCastSettings = null;
//   activatePassCastSettings = null;
//   activateSetupCastSettings = null;
//   deactivateCastSettings = null;
//   deactivateSetupCastSettings = null;
//   failCastSettings = null;
//   failReason = "";
//   onActivated = null;
//   onDeactivated = null;
//   onFailed = null;
//
//   constructor(entity, settings) {
//     this.id = igAbility.count++;
//
//     if (settings && !ig.wm) {
//       if (typeof settings.typeTargetable === "string") {
//         _ut.addType(igEntityExtended, this, "typeTargetable", settings.typeTargetable);
//         delete settings.typeTargetable;
//       }
//
//       if (typeof settings.groupTargetable === "string") {
//         _ut.addType(igEntityExtended, this, "groupTargetable", settings.groupTargetable, "GROUP");
//         delete settings.groupTargetable;
//       }
//
//       ig.merge(this, settings);
//     }
//
//     this.initTypes();
//
//     this.initProperties();
//
//     this.initUpgrades();
//
//     this.setEntity(entity);
//   }
//
//   initTypes() {
//   }
//
//   initProperties() {
//     // timers
//
//     this.castTimer = new ig.Timer();
//     this.cooldownTimer = new ig.Timer();
//
//     // signals
//
//     this.onActivated = new ig.Signal();
//     this.onDeactivated = new ig.Signal();
//     this.onFailed = new ig.Signal();
//   }
//
//   initUpgrades() {
//   }
//
//   activate() {
//     if (this.enabled) {
//
//       if (this.activateToggle && (this.needsDeactivate || this.activated)) {
//
//         return this.deactivate.apply(this, arguments);
//
//       } else if (!this._activating && !this.channelling) {
//
//         this.activated = false;
//
//         if (this.assert(this.cooledDown(), ig.Ability.FAIL.COOLDOWN)) {
//
//           return this.activateSetup.apply(this, arguments);
//
//         }
//
//       }
//
//     }
//   }
//
//   activatePlain() {
//
//     return this.activate();
//
//   }
//
//   execute() {
//     console.warn("DEPRECATED: ig.Ability.execute has been replaced by ig.Ability.activate, and ig.Ability.activate's previous functionality is now handled by ig.Ability.activateComplete.");
//     return this.activate.apply(arguments, this);
//
//   }
//
//   activateSetup() {
//
//     if (!this._activating) {
//
//       this.castEnd();
//
//       this._deactivating = false;
//       this.needsDeactivate = this._activating = true;
//
//       // try to look at target
//
//       if (this.faceTarget) {
//
//         this.entity.lookAt(this.entityTarget);
//
//       }
//
//       // cast first
//
//       if (this.activateSetupCastSettings) {
//
//         this.cast(this.activateSetupCastSettings, this.activateTry, arguments);
//
//       } else {
//
//         return this.activateTry.apply(this, arguments);
//
//       }
//
//     }
//
//   }
//
//   activateTry() {
//
//     // no cost, only check if close enough
//
//     if (this.costActivate === 0) {
//
//       if (this.assert(this.hasTarget(), ig.Ability.FAIL.TARGET) && this.assert(this.closeEnough(), ig.Ability.FAIL.DISTANCE)) {
//
//         if (this.activatePassCastSettings) {
//
//           this.cast(this.activatePassCastSettings, this.activatePass, arguments);
//
//         } else {
//
//           return this.activatePass.apply(this, arguments);
//
//         }
//
//       }
//
//     }
//     // has cost
//     else if (this.assert(this.hasTarget(), ig.Ability.FAIL.TARGET) && this.assert(this.canPayCost(this.costActivate), ig.Ability.FAIL.COST) && this.assert(this.closeEnough(), ig.Ability.FAIL.DISTANCE)) {
//
//       this.extractCost(this.costActivate);
//
//       if (this.activatePassCastSettings) {
//
//         this.cast(this.activatePassCastSettings, this.activatePass, arguments);
//
//       } else {
//
//         return this.activatePass.apply(this, arguments);
//
//       }
//
//     }
//
//   }
//
//   activatePass() {
//
//     if (!this.activatePassCastSettings || !this.activateStrict || this.assert(this.closeEnough(), ig.Ability.FAIL.DISTANCE)) {
//
//       return this.activateComplete.apply(this, arguments);
//
//     }
//
//   }
//
//   activateComplete() {
//
//     this._activating = this._deactivating = false;
//     this.needsDeactivate = true;
//     this.activated = this.once || this.channelled;
//     this.onActivated.dispatch(this);
//
//     // start cooldown
//
//     if (this.cooldownDelay > 0) {
//
//       this.cooldownTimer.set(this.cooldownDelay);
//
//     }
//
//     // try channel once to make sure any channel animations are set
//     // this will also instantly deactivate if can't channel (which is probably good)
//
//     if (this.activateCastSettings) {
//
//       this.cast(this.activateCastSettings, this.channelled ? this.channelTry : null);
//
//     } else {
//
//       this.castEnd();
//
//       if (this.channelled) {
//
//         this.channelTry();
//
//       }
//
//     }
//
//     // drop target
//
//     this.dropEntityTarget();
//
//   }
//
//   deactivate() {
//
//     return this.deactivateSetup.apply(this, arguments);
//
//   }
//
//   deactivateSetup() {
//
//     if (this.needsDeactivate && !this._deactivating) {
//
//       this._deactivating = true;
//       this.activated = this._activating = this.needsDeactivate = false;
//
//       if (this.channelling) {
//
//         this.channelStop();
//
//       }
//
//       this.castEnd();
//
//       // cast first
//
//       if (this.deactivateSetupCastSettings && !this.entity._killed) {
//
//         this.cast(this.deactivateSetupCastSettings, this.deactivateComplete, arguments);
//
//       } else {
//
//         return this.deactivateComplete.apply(this, arguments);
//
//       }
//
//     }
//
//   }
//
//   deactivateComplete() {
//
//     this._deactivating = false;
//
//     this.onDeactivated.dispatch(this);
//
//     if (this.deactivateCastSettings && !this.entity._killed) {
//
//       this.cast(this.deactivateCastSettings);
//
//     } else {
//
//       this.castEnd();
//
//     }
//
//     // drop target
//
//     this.dropEntityTarget();
//
//   }
//
//   cleanup() {
//
//     // cleanup should be silent
//
//     this.castEnd();
//
//     // temporarily replace deactivate cast settings
//
//     var deactivateSetupCastSettings = this.deactivateSetupCastSettings;
//     var deactivateCastSettings = this.deactivateCastSettings;
//     this.deactivateCastSettings = this.deactivateSetupCastSettings = null;
//
//     var result = this.deactivate.apply(this, arguments);
//
//     this.deactivateSetupCastSettings = deactivateSetupCastSettings;
//     this.deactivateCastSettings = deactivateCastSettings;
//
//     // clean signals when game is changing levels
//
//     if (!ig.game.hasLevel) {
//
//       this.onActivated.removeAll();
//       this.onActivated.forget();
//       this.onDeactivated.removeAll();
//       this.onDeactivated.forget();
//       this.onFailed.removeAll();
//       this.onFailed.forget();
//
//     }
//
//     return result;
//
//   }
//
//   cleanupPlain() {
//
//     return this.cleanup();
//
//   }
//
//   pause() {
//
//     this.paused = true;
//
//     this.castTimer.pause();
//     this.cooldownTimer.pause();
//
//   }
//
//   unpause() {
//
//     this.paused = false;
//
//     this.castTimer.unpause();
//     this.cooldownTimer.unpause();
//
//   }
//
//   setEnabled(enabled) {
//
//     if (typeof enabled === 'undefined') {
//
//       enabled = true;
//
//     }
//
//     if (!enabled) {
//
//       this.disable();
//
//     } else {
//
//       this.enable();
//
//     }
//
//   }
//
//   enable() {
//
//     this.enabled = true;
//
//   }
//
//   disable() {
//
//     this.enabled = false;
//
//     if (this.needsDeactivate || this.activated) {
//
//       return this.deactivateSetup(arguments);
//
//     }
//
//   }
//
//   cooledDown() {
//
//     return this.cooldownDelay <= 0 || this.cooldownTimer.delta() >= 0;
//
//   }
//
//   cast(settings, internalCallback, internalArgs) {
//
//     if (settings) {
//
//       var callback;
//       var args;
//
//       if (!settings.async) {
//
//         callback = internalCallback;
//         args = internalArgs;
//
//       }
//
//       var animName = settings.animName;
//
//       if (animName && !settings.animOmniDirectional) {
//
//         animName = this.entity.getDirectionalAnimName(animName);
//
//       }
//
//       var as = settings.animSettings || {};
//
//       // ensure that if animation will not complete on its own
//       // there is a delay so we don't cast forever
//
//       if (animName && !settings.delay && (!(!as.loop && !as.lock && !as.stop) || (as.frame && this.entity.anims[animName] && this.entity.anims[animName].stop))) {
//
//         settings.delay = 1;
//
//       }
//
//       // specific cast time
//
//       if (settings.delay) {
//
//         this.castStart(settings, callback, args);
//
//         this.castTimer.set(settings.delay);
//
//         if (animName) {
//
//           if (typeof as.loop === 'undefined') {
//
//             as.loop = true;
//
//           }
//
//           this.entity.animOverride(animName, as);
//
//         }
//
//       }
//       // cast time based on animation
//       else if (animName) {
//
//         this.castStart(settings, callback, args);
//
//         // auto complete cast at end of animation
//
//         var originalCallback = as.callback;
//         var originalContext = as.context;
//         as.callback = function () {
//
//           this.castComplete();
//
//           if (originalCallback) {
//
//             originalCallback.call(originalContext || this);
//
//           }
//
//         };
//         as.context = this;
//
//         this.entity.animOverride(animName, as);
//
//       } else {
//
//         this.castEffects(settings.effects);
//
//         if (callback) {
//
//           callback.apply(this, args);
//
//         }
//
//       }
//
//       if (settings.async && internalCallback) {
//
//         internalCallback.apply(this, internalArgs);
//
//       }
//
//     } else if (internalCallback) {
//
//       internalCallback.apply(this, internalArgs);
//
//     }
//
//   }
//
//   castStart(settings, internalCallback, internalArgs) {
//
//     this.castEnd();
//
//     this.casting = true;
//     this.castSettings = settings;
//     this.castInternalCallback = internalCallback;
//     this.castInternalArgs = internalArgs;
//
//     // stop moving if cast would be interrupted by movement
//
//     if (this.autoStopMoving && this.getInterrupted()) {
//
//       this.entity.moveAllStop();
//
//     }
//
//     this.castEffects(settings.effects);
//
//   }
//
//   castUpdate() {
//
//     // specific cast time
//
//     if (this.castSettings && this.castSettings.delay && this.castTimer.delta() >= 0) {
//
//       this.castComplete();
//
//     }
//     // not already failed
//     else if (!this.failReason) {
//
//       // interrupt when cannot move while casting and is moving
//
//       this.assert(!this.getInterrupted(), ig.Ability.FAIL.INTERRUPT);
//
//     }
//
//   }
//
//   castComplete() {
//
//     var settings = this.castSettings;
//     var internalCallback = this.castInternalCallback;
//     var internalArgs = this.castInternalArgs;
//
//     // end first, in case another cast is callback
//
//     this.castEnd();
//
//     // clear fail reason
//
//     this.failReason = '';
//
//     // do callbacks
//
//     if (settings && settings.callback) {
//
//       settings.callback.apply(settings.context || this, settings.settings);
//
//     }
//
//     if (internalCallback) {
//
//       internalCallback.apply(this, internalArgs);
//
//     }
//
//   }
//
//   castEnd() {
//
//     if (this.casting || this.castSettings) {
//
//       this.casting = false;
//
//       // kill effects if they are not particles
//
//       if (this.castSettings) {
//
//         var effects = this.castSettings.effects;
//
//         if (effects) {
//
//           for (var i = 0, il = effects.length; i < il; i++) {
//
//             this.effectEnd(effects[i]);
//
//           }
//
//         }
//
//         // release animation
//
//         var animName = this.castSettings.animName;
//
//         if (animName) {
//
//           if (!this.castSettings.animOmniDirectional) {
//
//             animName = this.entity.getDirectionalAnimName(animName);
//
//           }
//
//           this.entity.animRelease(animName, true);
//
//         }
//
//       }
//
//       this.castSettings = this.castInternalCallback = this.castInternalArgs = undefined;
//
//     }
//
//   }
//
//   castEffects(effects) {
//
//     if (effects && effects.length) {
//
//       for (var i = 0, il = effects.length; i < il; i++) {
//
//         this.effectStart(effects[i]);
//
//       }
//
//     }
//
//   }
//
//   effectStart(effect) {
//
//     var es = effect.settings || {};
//
//     // handle lifetime and fadetime
//
//     if (!effect.ignoreDuration) {
//
//       if (this.castSettings) {
//
//         // set lifetime of effect to cast delay or animation length
//
//         if (this.castSettings.delay) {
//
//           es.lifeDuration = this.castSettings.delay;
//
//         } else if (this.castSettings.animName) {
//
//           var anim = this.entity.anims[this.castSettings.animName];
//
//           if (anim) {
//
//             es.lifeDuration = anim.frameTime * anim.sequence.length;
//
//           }
//
//         }
//
//       }
//
//       // fade effect out over lifetime
//
//       if (effect.fade) {
//
//         es.fadeBeforeDeathDuration = es.fadeBeforeDeathDuration || 0;
//
//       }
//
//     }
//
//     // check if not following target or this has a target
//
//     if (!effect.followTarget || this.entityTarget) {
//
//       // create entity
//
//       var entity = effect.entity = ig.game.spawnEntity(effect.entityClass, 0, 0, es);
//
//       // follow entity
//
//       if (effect.followSettings) {
//
//         if (typeof effect.followSettings.flipWith === 'undefined') {
//
//           effect.followSettings.flipWith = true;
//
//         }
//
//         if (effect.followTarget) {
//
//           if (this.entityTarget) {
//
//             entity.moveTo(this.entityTarget, effect.followSettings);
//
//           }
//
//         } else {
//
//           entity.moveTo(this.entity, effect.followSettings);
//
//         }
//
//       }
//       // center entity by default
//       else if (effect.center !== false) {
//
//         entity.pos.x = this.entity.pos.x + (this.entity.size.x - entity.size.x) * 0.5;
//         entity.pos.y = this.entity.pos.y + (this.entity.size.y - entity.size.y) * 0.5;
//
//       }
//
//     }
//
//   }
//
//   effectEnd(effect) {
//
//     if (effect.entity && !effect.entity._killed && (this.failReason === ig.Ability.FAIL.INTERRUPT || !(effect.entity instanceof ig.Particle))) {
//
//       effect.entity.kill();
//       effect.entity = undefined;
//
//     }
//
//   }
//
//   update() {
//
//     if (this.enabled && !this.paused) {
//
//       if (this.casting) {
//
//         this.castUpdate();
//
//       }
//
//       if (this.activated && this.channelled) {
//
//         this.channelTry(arguments);
//
//       }
//
//     }
//
//   }
//
//   channelTry(args) {
//
//     // stop moving if cast would be interrupted by movement
//
//     if (!this.channelling && this.autoStopMoving && this.getInterrupted()) {
//
//       this.entity.moveAllStop();
//
//     }
//
//     // take cost of update and check if target still close enough
//
//     if (this.costChannel === 0) {
//
//       if (this.assert(!this.getInterrupted(), ig.Ability.FAIL.INTERRUPT) && this.assert(this.closeEnough(), ig.Ability.FAIL.DISTANCE)) {
//
//         return this.channel.apply(this, args);
//
//       }
//
//     } else if (this.assert(this.canPayCost(this.costChannel), ig.Ability.FAIL.COST) && this.assert(!this.getInterrupted(), ig.Ability.FAIL.INTERRUPT) && this.assert(this.closeEnough(), ig.Ability.FAIL.DISTANCE)) {
//
//       this.extractCost(this.costChannel);
//
//       return this.channel.apply(this, args);
//
//     }
//
//     // entity can't pay cost, deactivate ability
//
//     return this.deactivate.apply(this, args);
//
//   }
//
//   channel() {
//
//     if (!this.channelling && this.regenBlocking) {
//
//       this.channelling = true;
//
//       this.blockRegen(this.entity);
//
//     }
//
//     if (this.faceTarget) {
//
//       this.entity.lookAt(this.entityTarget);
//
//     }
//
//   }
//
//   channelStop() {
//
//     this.channelling = false;
//     this.unblockRegen(this.entity);
//
//   }
//
//   getUsing() {
//
//     return this.casting || this.channelling;
//
//   }
//
//   getActivelyUsing() {
//
//     return this.activated || this.getUsing();
//
//   }
//
//   getInterrupted() {
//
//     return this.entity.moving && !(this.movable || (this.castSettings && this.castSettings.movable));
//
//   }
//
//   blockRegen(entity) {
//
//     if (entity.regenEnergy) {
//
//       this._regenBlocked = true;
//       entity.regenEnergy = false;
//
//     }
//
//   }
//
//   unblockRegen(entity) {
//
//     if (this._regenBlocked) {
//
//       entity.regenEnergy = true;
//       this._regenBlocked = false;
//
//     }
//
//   }
//
//   setEntity(entity) {
//
//     // clean previous
//
//     if (this.entity) {
//
//       this.entity.onRemoved.remove(this.cleanupPlain, this);
//       this.entity.onAdded.remove(this.activatePlain, this);
//
//       this.cleanup();
//
//     }
//
//     // store new
//
//     this.entity = entity;
//
//     if (this.entity) {
//
//       // auto cleanup when entity is removed from game
//
//       this.entity.onRemoved.add(this.cleanupPlain, this);
//
//       // passive abilities should be turned on as soon as entity is added to game
//
//       if (this.type & ig.Ability.TYPE.PASSIVE) {
//
//         if (this.entity.added) {
//
//           this.activatePlain();
//
//         } else {
//
//           this.entity.onAdded.addOnce(this.activatePlain, this);
//
//         }
//
//       }
//
//     }
//
//   }
//
//   setEntityOptions(entity) {
//
//     this.entityOptions = entity;
//
//   }
//
//   setEntityTarget(entity) {
//
//     // check type of entity against the types of entities this can target
//
//     if (!entity || (this.entityTarget !== entity && this.isEntityTargetable(entity))) {
//
//       this.entityTarget = entity;
//       this._entityTargetRetained = false;
//
//     }
//
//   }
//
//   isEntityTargetable(entity) {
//
//     return (!entity.fixed || this.canTargetFixed) && (!this.typeTargetable || (entity.type & this.typeTargetable) === this.typeTargetable && !(this.entity.group & entity.group)) && (!this.groupTargetable || (entity.group & this.groupTargetable) === this.groupTargetable) && ((this.canTargetOthers && this.entity !== entity) || (this.canTargetSelf && this.entity === entity));
//
//   }
//
//   setEntityTargetFirst(entities) {
//
//     // try to set target until one set
//
//     if (entities && entities.length) {
//
//       for (var i = 0, il = entities.length; i < il; i++) {
//
//         this.setEntityTarget(entities[i]);
//
//         if (this.entityTarget) {
//
//           break;
//
//         }
//
//       }
//
//     }
//     // set target to nothing
//     else {
//
//       this.setEntityTarget();
//
//     }
//
//   }
//
//   setClosestEntityTarget() {
//
//     // find all targetables
//
//     if (this.rangeX > 0 || this.rangeY > 0) {
//
//       // clear current entity
//
//       if (this.entityTarget) {
//
//         this.setEntityTarget();
//
//       }
//
//       var entities = _uti.entitiesInAABB(
//         this.entity.pos.x - this.rangeX,
//         this.entity.pos.y - this.rangeY,
//         this.entity.pos.x + this.entity.size.x + this.rangeX,
//         this.entity.pos.y + this.entity.size.y + this.rangeY,
//         true
//       );
//
//       // try to set target until one set
//
//       this.setEntityTargetFirst(entities);
//
//     }
//
//   }
//
//   dropEntityTarget() {
//
//     if (this.entityTarget) {
//
//       if (this.isEntityTargetDroppable()) {
//
//         this.setEntityTarget();
//
//       } else {
//
//         this._entityTargetRetained = true;
//
//       }
//
//     }
//
//   }
//
//   isEntityTargetDroppable() {
//
//     return !((this.activated && this.channelled) || this.retainTarget);
//
//   }
//
//   hasTarget() {
//
//     // target is required
//
//     if (this.requiresTarget) {
//
//       // has no target but able to find a target in range
//
//       if (this.canFindTarget && !this.entityTarget) {
//
//         this.setClosestEntityTarget();
//
//       }
//
//       // has target
//
//       if (this.entityTarget) {
//
//         return true;
//
//       }
//
//       return false;
//
//     }
//
//     return true;
//
//   }
//
//   hasValidTarget() {
//
//     return !this.requiresTarget || this.entityTarget;
//
//   }
//
//   closeEnough() {
//
//     // target is required
//
//     if (this.requiresTarget) {
//
//       // has target
//
//       if (this.entityTarget) {
//
//         var interactiveTarget = this.entityTarget.type & ig.EntityExtended.TYPE.INTERACTIVE;
//
//         // infinite range
//
//         if ((this.rangeX === 0 && this.rangeY === 0) || (interactiveTarget && this.entityTarget.rangeInteractableX === 0 && this.entityTarget.rangeInteractableY === 0)) {
//
//           return true;
//
//         }
//         // check range allowable vs target range
//         else {
//
//           var rangeX;
//           var rangeY;
//
//           if (interactiveTarget) {
//
//             rangeX = Math.max(this.rangeX, this.entityTarget.rangeInteractableX);
//             rangeY = Math.max(this.rangeY, this.entityTarget.rangeInteractableY);
//
//           } else {
//
//             rangeX = this.rangeX;
//             rangeY = this.rangeY;
//
//           }
//
//           // expand entity bounds by activate distance and check if overlaps target bounds
//
//           var overlap = _uti.AABBIntersect(
//             this.entityTarget.pos.x,
//             this.entityTarget.pos.y,
//             this.entityTarget.pos.x + this.entityTarget.size.x,
//             this.entityTarget.pos.y + this.entityTarget.size.y,
//             this.entity.pos.x - rangeX,
//             this.entity.pos.y - rangeY,
//             this.entity.pos.x + this.entity.size.x + rangeX,
//             this.entity.pos.y + this.entity.size.y + rangeY
//           );
//
//           // flip entity to face target
//
//           if (this.faceTarget) {
//
//             this.entity.lookAt(this.entityTarget);
//
//           }
//
//           return overlap;
//
//         }
//
//       }
//       // no target
//       else {
//
//         return false;
//
//       }
//
//     }
//
//     return true;
//
//   }
//
//   assert(checkResult, failReason) {
//
//     if (!checkResult) {
//
//       this.fail(failReason);
//
//     } else {
//
//       this.failReason = '';
//
//     }
//
//     return checkResult;
//
//   }
//
//   fail(failReason) {
//
//     this.failReason = failReason || ig.Ability.FAIL.UNKNOWN;
//
//     this._activating = this._deactivating = false;
//
//     // only end cast if interrupting
//
//     if (this.failReason === ig.Ability.FAIL.INTERRUPT) {
//
//       this.castEnd();
//
//     } else {
//
//       var fs = this.failCastSettings;
//
//       if (fs) {
//
//         // set fail reason as init anim of effects
//
//         if (fs.effects) {
//
//           for (var i = 0, il = fs.effects.length; i < il; i++) {
//
//             var effect = fs.effects[i];
//
//             effect.settings = effect.settings || {};
//             effect.settings.animInit = this.failReason;
//
//           }
//
//         }
//
//         if (this.failCastSettings) {
//
//           this.cast(this.failCastSettings);
//
//         } else {
//
//           this.castEnd();
//
//         }
//
//       }
//
//     }
//
//     this.onFailed.dispatch(this);
//
//     // drop target
//
//     this.dropEntityTarget();
//
//   }
//
//   canPayCost(amount) {
//
//     return !this.entity.hasOwnProperty('energy') || this.entity.invulnerable || this.entity.energy >= amount;
//
//   }
//
//   extractCost(amount) {
//
//     if (this.entity.drainEnergy) {
//
//       this.entity.drainEnergy(amount, this);
//
//     }
//
//   }
//
//   addUpgrades(upgrades) {
//
//     _ut.arrayCautiousAddMulti(this.upgrades, upgrades);
//
//   }
//
//   upgrade(rank) {
//
//     if (rank === true) {
//
//       rank = this.upgrades.length;
//
//     } else if (!_ut.isNumber(rank)) {
//
//       rank = this.rank + 1;
//
//     }
//
//     this.changegrade(rank);
//
//   }
//
//   downgrade(rank) {
//
//     if (rank === true) {
//
//       rank = 0;
//
//     } else if (!_ut.isNumber(rank)) {
//
//       rank = this.rank - 1;
//
//     }
//
//     this.changegrade(rank);
//
//   }
//
//   changegrade(rank) {
//
//     var rankMax = this.upgrades.length;
//     var direction = rank < this.rank ? -1 : 1;
//     var rankNext = this.rank + direction;
//
//     // clean up ability before upgrade
//
//     if (this.rank !== rank) {
//
//       this.cleanup();
//
//     }
//
//     // do upgrades
//
//     while (this.rank !== rank && rankNext < rankMax && rankNext >= 0) {
//
//       this.rank = rankNext;
//
//       var upgrade = this.upgrades[rankNext];
//       var entity = this.entity;
//       var entityOptions = this.entityOptions || entity;
//
//       if (typeof upgrade === 'function') {
//
//         upgrade.call(this, entity, entityOptions);
//
//       } else {
//
//         ig.merge(this, upgrade);
//
//       }
//
//       rankNext += direction;
//
//     }
//
//   }
//
//   clone(c) {
//
//     if (c instanceof ig.Ability !== true) {
//
//       c = new ig.Ability();
//
//     }
//
//     c.name = this.name;
//     c.type = this.type;
//     c.enabled = this.enabled;
//
//     c.costActivate = this.costActivate;
//     c.costDeactivate = this.costDeactivate;
//     c.costChannel = this.costChannel;
//
//     c.requiresTarget = this.requiresTarget;
//     c.canFindTarget = this.canFindTarget;
//     c.canTargetSelf = this.canTargetSelf;
//     c.canTargetOthers = this.canTargetOthers;
//     c.typeTargetable = this.typeTargetable;
//     c.rangeX = this.rangeX;
//     c.rangeY = this.rangeY;
//     c.retainTarget = this.retainTarget;
//
//     c.rank = this.rank;
//     c.upgrades = this.upgrades.slice(0);
//
//     c.regenBlocking = this.regenBlocking;
//
//     c.setEntityOptions(this.entityOptions);
//     c.setEntity(this.entity);
//
//     return c;
//
//
//   }
